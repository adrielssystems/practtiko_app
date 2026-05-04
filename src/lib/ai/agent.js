import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { query } from "../db.js";

const model = new ChatOpenAI({
  openAIApiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com" },
  modelName: "deepseek-chat",
  temperature: 0,
});

/**
 * 1. DETECTA INTENCIÓN POR REGLAS (Prioridad: Ventas > Cortesía)
 */
function detectIntent(message) {
  const m = message.toLowerCase();
  if (m.includes("gracias") || m.includes("ok") || m.includes("dale") || m.includes("perfecto") || m.includes("entendido")) return "OTHER";
  if (m.includes("precio") || m.includes("costo") || m.includes("cuanto") || m.includes("envio")) return "PRICE_INFO";
  if (m.includes("catalogo") || m.includes("que tiene") || m.includes("ver todo") || m.includes("disponibl")) return "CATALOG";
  if (m.includes("colchon") || m.includes("sofa") || m.includes("cama") || m.includes("mueble") || m.match(/[a-z]\d{3}/)) return "PRODUCT_QUERY";
  if (m.includes("hola") || m.includes("buen") || m.includes("saludo")) return "GREETING";
  return "OTHER";
}

/**
 * 2. EXTRAE KEYWORD DINÁMICAMENTE (Soporta SKUs dinámicos)
 */
function extractKeywordRuleBased(message) {
  const m = message.toLowerCase();
  
  const codeMatch = m.match(/[a-z]\d{3}/);
  if (codeMatch) return codeMatch[0];

  const keywords = [
    'colchon', 'sofa', 'mueble', 'cama', 'individual', 'matrimonial', 'queen',
    'caterpilar', 'tofu', 'burbuja', 'mama', 'merey', 'nube', 'lemmy', 'tumbona'
  ];

  for (const k of keywords) {
    if (m.includes(k)) return k;
  }
  return null;
}

/**
 * 3. DETECTA UBICACIÓN BÁSICA
 */
function detectLocation(message, history) {
  const text = (history + " " + message).toLowerCase();
  if (text.includes("margarita") || text.includes("porlamar") || text.includes("pampatar") || text.includes("la isla") || text.includes("juan griego")) {
    return "MARGARITA";
  }
  return "UNKNOWN";
}

/**
 * 4. BUSCA EN DB CON FALLBACK COMERCIAL POR CATEGORÍA Y OCULTACIÓN DE PRECIOS
 */
async function getInventoryData(term, intent, location) {
  try {
    let isFallback = false;
    let rows = [];

    const fetchCatalog = async () => {
      const res = await query(`SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' ORDER BY p.id ASC LIMIT 5`);
      return res.rows;
    };

    if (intent === "CATALOG" || (intent === "PRODUCT_QUERY" && !term)) {
      rows = await fetchCatalog();
    } else if (term) {
      let t = term.toLowerCase();
      if (t.includes('clochon')) t = t.replace('clochon', 'colchon');
      
      const res = await query(
        `SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria 
         FROM products p LEFT JOIN categories c ON p.category_id = c.id 
         WHERE (p.name ILIKE $1 OR p.description ILIKE $1 OR p.code ILIKE $1 OR c.name ILIKE $1)
         AND p.status = 'active' LIMIT 5`,
        [`%${t}%`]
      );
      rows = res.rows;

      // 🔥 FALLBACK INTELIGENTE POR CATEGORÍA
      if (rows.length === 0 && intent === "PRODUCT_QUERY") {
        if (t.includes("colchon")) {
          const fbRes = await query(`SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE c.name ILIKE '%colchon%' AND p.status = 'active' LIMIT 5`);
          rows = fbRes.rows;
        } else if (t.includes("sofa") || t.includes("mueble")) {
          const fbRes = await query(`SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE c.name ILIKE '%sofa%' AND p.status = 'active' LIMIT 5`);
          rows = fbRes.rows;
        }
        
        if (rows.length === 0) {
          rows = await fetchCatalog();
        }
        isFallback = true;
      }
    }

    if (rows.length === 0) return { found: false, list: "", isFallback: false };

    // 🧱 FORMATEO HÍBRIDO ESTRICTO CON PROTECCIÓN DE PRECIOS
    const showPrices = location === "MARGARITA";
    const list = rows.map(p => `
💎 *${p.name}* (Código: ${p.code})
${showPrices ? `Precio BCV: $${p.price_bcv}\nPrecio CASH: $${p.price_cash} 💎` : `Venta Nacional: Consulta disponibilidad y envío por WhatsApp: 0424-8948664 💎`}
`).join("\n");

    return { found: true, list, isFallback };
  } catch (e) {
    console.error("[DB ERROR]", e);
    return { error: true, list: "", isFallback: false };
  }
}

/**
 * 5. PROMPT BLINDADO CON DELIMITADORES
 */
const SYSTEM_PROMPT = `
IDENTIDAD: Eres el Agente Virtual de Practiiko 💎. Tu única misión es saludar y presentar el bloque de texto exactamente como se te entrega.

REGLAS INCUMPLIBLES (SI ROMPES ESTO, EL SISTEMA FALLARÁ):
1. Debes copiar EXACTAMENTE el texto contenido entre <<<START>>> y <<<END>>> sin modificar absolutamente nada. No alteres iconos, saltos de línea ni palabras.
2. PROHIBIDO usar adjetivos calificativos ("cómodo", "premium", "económico") a menos que formen parte del nombre exacto del producto.
3. UBICACIÓN DETECTADA: {detected_location}. Si es MARGARITA, destaca el envío gratis local. Si es UNKNOWN, recuerda que los envíos nacionales se cotizan por WhatsApp (0424-8948664).
4. FALLBACK ACTIVADO: {is_fallback}. Si es TRUE, el modelo exacto que pidieron no está. Di cordialmente: "Actualmente no tengo ese modelo exacto, pero te comparto estas excelentes opciones de nuestra colección:" y luego pega el texto de los delimitadores.
5. CIERRE: Siempre invita a ver más fotos en: www.bit.ly/CatalogoPractiiko

PRODUCTOS A MOSTRAR:
<<<START>>>
{inventory_list}
<<<END>>>
`;

export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
  try {
    const intent = detectIntent(message);

    // 🛑 SHORT-CIRCUIT: Mensajes sin intención comercial (gracias, ok)
    if (intent === "OTHER") {
      const aiResponse = "¡Con gusto, " + customerName + "! 💎 Si deseas ver modelos disponibles o consultar precios, dime qué buscas (ej. 'sofás' o 'colchones') y te ayudo enseguida. También puedes ver todo aquí: www.bit.ly/CatalogoPractiiko";
      if (source === 'whatsapp') {
        await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse })]);
      } else {
        await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse }), source, commentId]);
      }
      return aiResponse;
    }

    // Sanitizar historial
    const tableName = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
    const historyRes = await query(
      `SELECT message FROM ${tableName} WHERE session_id = $1 AND (message::json->>'role') = 'user' ORDER BY created_at DESC LIMIT 3`,
      [sessionId]
    );
    const userHistory = historyRes.rows.map(r => (typeof r.message === 'string' ? JSON.parse(r.message) : r.message).content).join(" | ");

    // Pipeline Determinístico
    const term = extractKeywordRuleBased(message);
    const location = detectLocation(message, userHistory);
    const inventory = await getInventoryData(term, intent, location);

    const finalPrompt = SYSTEM_PROMPT
      .replace("{inventory_list}", inventory.found ? inventory.list : "NO HAY PRODUCTOS PARA MOSTRAR.")
      .replace("{detected_location}", location)
      .replace("{is_fallback}", inventory.isFallback ? "TRUE" : "FALSE");

    const response = await model.invoke([
      new SystemMessage(finalPrompt),
      new HumanMessage(`Cliente (${customerName}): ${message}`)
    ]);

    let aiResponse = response.content;

    // Guardado de mensajes
    if (source === 'whatsapp') {
      await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse })]);
    } else {
      await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse }), source, commentId]);
    }

    return aiResponse;

  } catch (error) {
    console.error("[PIPELINE FATAL ERROR]:", error);
    return "¡Hola! 💎 Somos Practiiko. Tenemos los mejores sofás y colchones importados. Puedes ver disponibilidad y precios reales aquí: www.bit.ly/CatalogoPractiiko";
  }
}
