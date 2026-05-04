import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { query } from "@/lib/db";

let _model;
function getModel() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error("Falta la variable GOOGLE_API_KEY en las variables de entorno de Easypanel.");
  }

  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: "gemini-1.5-flash",
      maxOutputTokens: 512,
      temperature: 0.1, // Un poco más de creatividad para evitar lo robótico
    });
  }
  return _model;
}

/**
 * NORMALIZADOR
 */
function normalize(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * INTENCIÓN
 */
function detectIntent(message) {
  const m = normalize(message);

  if (["gracias", "ok", "dale", "perfecto", "entendido"].some(w => m.includes(w))) return "OTHER";
  if (m.includes("margarita") || m.includes("porlamar") || m.includes("pampatar")) return "LOCATION_UPDATE";
  if (m.includes("precio") || m.includes("cuanto")) return "PRICE_INFO";
  if (m.includes("catalogo") || m.includes("ver todo")) return "CATALOG";
  if (m.includes("sofa") || m.includes("colchon") || m.match(/[a-z]\d{3}/)) return "PRODUCT_QUERY";
  if (m.includes("hola") || m.includes("buen")) return "GREETING";

  return "OTHER";
}

/**
 * KEYWORD
 */
function extractKeyword(message) {
  const m = normalize(message);

  const code = m.match(/[a-z]\d{3}/);
  if (code) return code[0];

  if (m.includes("sofa")) return "sofa";
  if (m.includes("colchon")) return "colchon";

  return null;
}

/**
 * UBICACIÓN
 */
function detectLocation(message, history) {
  const text = normalize(history + " " + message);
  if (text.includes("margarita") || text.includes("porlamar")) return "MARGARITA";
  return "UNKNOWN";
}

/**
 * DB
 */
async function getInventory(term, intent, location) {
  try {
    let rows = [];
    let isFallback = false;

    const baseQuery = `
      SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;

    if (intent === "CATALOG") {
      const res = await query(baseQuery + " LIMIT 5");
      rows = res.rows;
    }

    if (term) {
      const res = await query(
        baseQuery + ` AND (p.name ILIKE $1 OR p.code ILIKE $1 OR c.name ILIKE $1) LIMIT 5`,
        [`%${term}%`]
      );

      rows = res.rows;

      // fallback
      if (rows.length === 0) {
        const res2 = await query(baseQuery + " LIMIT 5");
        rows = res2.rows;
        isFallback = true;
      }
    }

    if (rows.length === 0) {
      return { found: false };
    }

    const showPrices = location === "MARGARITA";

    const text = rows.map(p => {
      return `
💎 *${p.name}* (Código: ${p.code})
${showPrices
          ? `Precio BCV: $${p.price_bcv}\nPrecio CASH: $${p.price_cash} 💎`
          : `Venta Nacional: Escríbenos al WhatsApp 0424-8948664 💎`}
`;
    }).join("\n");

    return { found: true, text, isFallback };

  } catch (e) {
    console.error(e);
    return { found: false };
  }
}

/**
 * RESPUESTA FINAL (LLM CON GEMINI)
 */
async function buildResponse(message, customerName, inventory, location) {
  const isMargarita = location === "MARGARITA";
  
  const prompt = `
IDENTIDAD: Eres el Agente Virtual de Practiiko 💎. Tu misión es presentar productos de forma profesional y amable.

REGLAS:
1. Usa el inventario proporcionado abajo. No inventes productos.
2. UBICACIÓN: El cliente está en ${isMargarita ? "MARGARITA (Isla)" : "VENTA NACIONAL (Tierra Firme)"}.
3. Si es MARGARITA, destaca el envío gratis. Si es NACIONAL, indica que los envíos se cotizan por WhatsApp (0424-8948664).
4. Si FALLBACK es TRUE, di: "No tengo ese modelo exacto, pero mira estas opciones:".
5. CIERRE: Siempre invita a ver más en www.bit.ly/CatalogoPractiiko

INVENTARIO:
${inventory.text}

FALLBACK: ${inventory.isFallback ? "TRUE" : "FALSE"}
`;

  try {
    const model = getModel();
    const response = await model.invoke([
      new SystemMessage(prompt),
      new HumanMessage(message)
    ]);
    return response.content;
  } catch (error) {
    console.error("DEBUG - Gemini Error:", error.message);
    // Fallback manual si falla la API (Muy importante para no dejar al cliente mudo)
    const locationText = isMargarita ? "\n🚚 Envío gratis en Margarita." : "\n📦 Envíos nacionales: 0424-8948664.";
    const list = inventory.text || "Visita nuestro catálogo para ver modelos y precios.";
    return `¡Hola ${customerName}! 👋 (Mód. Estático) 💎\n\n${list}\n${locationText}\n\n📸 Ver más: www.bit.ly/CatalogoPractiiko`;
  }
}

/**
 * MAIN
 */
export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
  try {
    const intent = detectIntent(message);

    // RESPUESTAS RÁPIDAS
    // GESTIÓN DE INTENCIONES ESPECIALES (No cortocircuitamos, dejamos que Gemini les de forma)
    let currentIntent = intent;
    if (intent === "LOCATION_UPDATE") currentIntent = "CATALOG";
    
    // Si es un saludo o no hay intención clara, forzamos catálogo para que Gemini tenga algo que mostrar
    if (intent === "GREETING" || intent === "OTHER") {
      currentIntent = "CATALOG";
    }

    // historial
    const table = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';

    const historyRes = await query(
      `SELECT message FROM ${table} WHERE session_id = $1 AND (message::json->>'role') = 'user' ORDER BY created_at DESC LIMIT 3`,
      [sessionId]
    );

    const history = historyRes.rows
      .map(r => {
        const msg = typeof r.message === 'string' ? JSON.parse(r.message) : r.message;
        return msg.content || "";
      })
      .join(" ");

    const location = detectLocation(message, history);

    const term = extractKeyword(message);
    const inventory = await getInventory(term, currentIntent, location);

    // Si no hay inventario y no es un saludo, damos respuesta de fallback
    if (!inventory.found && intent !== "GREETING" && intent !== "OTHER") {
      const noProdMsg = `No encontré ese modelo exacto 💎\n\nPero puedes ver todo nuestro catálogo aquí:\nwww.bit.ly/CatalogoPractiiko`;
      
      if (source === 'whatsapp') {
        await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`, [sessionId, JSON.stringify({ role: 'assistant', content: noProdMsg })]);
      } else {
        await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`, [sessionId, JSON.stringify({ role: 'assistant', content: noProdMsg }), source, commentId]);
      }
      return noProdMsg;
    }

    const response = await buildResponse(message, customerName, inventory, location);

    // guardar
    if (source === 'whatsapp') {
      await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`,
        [sessionId, JSON.stringify({ role: 'assistant', content: response })]);
    } else {
      await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`,
        [sessionId, JSON.stringify({ role: 'assistant', content: response }), source, commentId]);
    }

    return response;

  } catch (error) {
    console.error("CRITICAL AGENT ERROR:", error);
    const errorMsg = "Error consultando inventario 💎";
    
    // Intentar guardar el error en la DB para que el admin lo vea
    try {
      const table = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
      if (source === 'whatsapp') {
        await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`, [sessionId, JSON.stringify({ role: 'assistant', content: errorMsg })]);
      } else {
        await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`, [sessionId, JSON.stringify({ role: 'assistant', content: errorMsg }), source, commentId]);
      }
    } catch (dbErr) {
      console.error("Failed to log error to DB:", dbErr);
    }
    
    return errorMsg;
  }
}
