import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { query } from "@/lib/db";

const model = new ChatOpenAI({
  openAIApiKey: process.env.DEEPSEEK_API_KEY || "dummy_key_for_build_only",
  configuration: { baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com" },
  modelName: "deepseek-chat",
  temperature: 0,
});

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
 * RESPUESTA FINAL (LLM SOLO PARA ENVOLTURA)
 */
async function buildResponse(message, customerName, inventory, location) {

  const baseText = inventory.text;

  const prefix = inventory.isFallback
    ? "Actualmente no tengo ese modelo exacto, pero mira estas opciones:\n\n"
    : "";

  const locationText = location === "MARGARITA"
    ? "\n🚚 Envío gratis en Margarita."
    : "\n📦 Envíos nacionales por WhatsApp: 0424-8948664.";

  const final = `${prefix}${baseText}\n${locationText}\n\n📸 Ver más: www.bit.ly/CatalogoPractiiko`;

  return final;
}

/**
 * MAIN
 */
export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
  try {
    const intent = detectIntent(message);

    // RESPUESTAS RÁPIDAS
    if (intent === "OTHER") {
      return "¡Con gusto! 💎 ¿Buscas sofás o colchones?";
    }

    if (intent === "GREETING") {
      return `¡Hola ${customerName}! 👋 Bienvenido a Practiiko 💎\n\n¿Buscas sofás o colchones?`;
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

    let currentIntent = intent;
    if (intent === "LOCATION_UPDATE") currentIntent = "CATALOG";

    const term = extractKeyword(message);

    const inventory = await getInventory(term, currentIntent, location);

    if (!inventory.found) {
      return `No encontré ese modelo 💎\n\nMira el catálogo completo:\nwww.bit.ly/CatalogoPractiiko`;
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
    console.error(error);
    return "Error consultando inventario 💎";
  }
}
