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
 * DETECTA INTENCIÓN POR REGLAS (DETERMINÍSTICO)
 */
function detectIntent(message) {
  const m = message.toLowerCase();
  if (m.includes("hola") || m.includes("buen") || m.includes("saludo")) return "GREETING";
  if (m.includes("catalogo") || m.includes("que tiene") || m.includes("ver todo") || m.includes("disponibl")) return "CATALOG";
  if (m.includes("precio") || m.includes("costo") || m.includes("cuanto") || m.includes("envio") || m.includes("margarita")) return "PRICE_INFO";
  return "PRODUCT_QUERY";
}

/**
 * EXTRAE KEYWORD POR REGLAS (DETERMINÍSTICO)
 */
function extractKeywordRuleBased(message) {
  const m = message.toLowerCase();
  const keywords = [
    'colchon', 'sofa', 'mueble', 'cama', 'individual', 'matrimonial', 'queen',
    'd001', 'd006', 'd007', 's001', 's005', 's012', 'c002', 'c003',
    'caterpilar', 'tofu', 'burbuja', 'mama', 'merey', 'nube', 'lemmy', 'tumbona'
  ];

  for (const k of keywords) {
    if (m.includes(k)) return k;
  }
  return null;
}

/**
 * BUSCA EN DB (DETERMINÍSTICO)
 */
async function getInventoryData(term, intent) {
  try {
    let sql = "";
    let params = [];

    if (intent === "CATALOG" || (intent === "PRODUCT_QUERY" && !term)) {
      sql = `SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria 
             FROM products p LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.status = 'active' ORDER BY p.id ASC LIMIT 6`;
    } else if (term) {
      let t = term.toLowerCase();
      if (t.includes('clochon')) t = t.replace('clochon', 'colchon');
      sql = `SELECT p.name, p.code, p.price_bcv, p.price_cash, c.name as categoria 
             FROM products p LEFT JOIN categories c ON p.category_id = c.id 
             WHERE (p.name ILIKE $1 OR p.description ILIKE $1 OR p.code ILIKE $1 OR c.name ILIKE $1)
             AND p.status = 'active' LIMIT 8`;
      params = [`%${t}%`];
    } else {
      return { found: false, list: "" };
    }

    const res = await query(sql, params);
    if (res.rows.length === 0) return { found: false, list: "" };

    const list = res.rows.map(p => `
💎 ${p.name}
Código: ${p.code}
Precio BCV: $${p.price_bcv}
Precio CASH: $${p.price_cash} 💎
`).join("\n");

    return { found: true, list };
  } catch (e) {
    console.error("[DB ERROR]", e);
    return { error: true, list: "" };
  }
}

const SYSTEM_PROMPT = `
IDENTIDAD: Eres el Agente Virtual de Practiiko 💎. Solo informas sobre el inventario REAL.

RESTRICCIÓN ABSOLUTA:
1. SOLO puedes hablar de los productos que aparecen abajo en la sección "PRODUCTOS DISPONIBLES".
2. Si un producto NO está en esa lista, di que no lo tienes y ofrece ver el catálogo: www.bit.ly/CatalogoPractiiko.
3. NO INVENTES NADA. Si falta un precio o descripción, no lo deduzcas.
4. Si el cliente pregunta de dónde eres: Tienda física en C.C. Terranova Plaza, Local A-14, Porlamar, Margarita.
5. Si es de fuera de Margarita (Nacional): PROHIBIDO dar precios. Dile que un asesor cotizará por WhatsApp: 0424-8948664.

PRODUCTOS DISPONIBLES (DATO REAL DE LA DB):
{inventory_list}

CONTEXTO:
Cliente: {customer_name} | Plataforma: {platform}
`;

export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
  try {
    const intent = detectIntent(message);
    const term = extractKeywordRuleBased(message);
    const inventory = await getInventoryData(term, intent);

    const finalPrompt = SYSTEM_PROMPT
      .replace("{inventory_list}", inventory.found ? inventory.list : "NO HAY PRODUCTOS COINCIDENTES EN ESTE MOMENTO.")
      .replace("{customer_name}", customerName)
      .replace("{platform}", source.toUpperCase());

    const response = await model.invoke([
      new SystemMessage(finalPrompt),
      new HumanMessage(message)
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
