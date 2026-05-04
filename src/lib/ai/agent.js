import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { query } from "../db.js";

const model = new ChatOpenAI({
  openAIApiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com" },
  modelName: "deepseek-chat",
  temperature: 0,
});

/**
 * PASO 1: EXTRAER TÉRMINO DE BÚSQUEDA
 */
async function getSearchTerm(message, history) {
  const prompt = `Extrae el término de búsqueda (modelo, código o tipo de mueble) del mensaje del cliente. 
  Si no hay una intención de búsqueda clara, responde "NONE".
  Mensaje: "${message}"
  Respuesta (Solo el término o NONE):`;
  
  const res = await model.invoke([new HumanMessage(prompt)]);
  const term = res.content.trim().toUpperCase();
  return term === "NONE" ? null : term;
}

/**
 * PASO 2: CONSULTAR DB (DETERMINÍSTICO)
 */
async function searchInventory(term) {
  if (!term) return { found: false, products: [] };
  
  let t = term.toLowerCase();
  if (t.includes('clochon')) t = t.replace('clochon', 'colchon');
  if (t.includes('soffa')) t = t.replace('soffa', 'sofa');
  
  let clean = t;
  if (clean.endsWith('es')) clean = clean.slice(0, -2);
  else if (clean.endsWith('s')) clean = clean.slice(0, -1);

  try {
    const res = await query(
      `SELECT p.name, p.description, p.code, p.price_bcv, p.price_cash, c.name as categoria
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.name ILIKE $1 OR p.description ILIKE $1 OR p.code ILIKE $1 OR c.name ILIKE $1 OR p.name ILIKE $2 OR c.name ILIKE $2)
       AND p.status = 'active' LIMIT 5`,
      [`%${t}%`, `%${clean}%`]
    );
    
    return {
      found: res.rows.length > 0,
      products: res.rows
    };
  } catch (e) {
    console.error("[DB ERROR]", e);
    return { error: true, products: [] };
  }
}

/**
 * PASO 3: GENERAR RESPUESTA FINAL
 */
const SYSTEM_PROMPT = `
IDENTIDAD: Eres el Agente Virtual de Practiiko 💎. Solo informas sobre el inventario REAL.

REGLAS DE ORO (INCUMPPLIBLES):
1. SOLO puedes hablar de los productos que se te entregan en la sección "INVENTARIO ACTUAL".
2. Si "INVENTARIO ACTUAL" está vacío o no coincide con lo que pide el cliente, responde: "Actualmente no ubico ese modelo exacto en mi inventario, pero te invito a ver nuestro catálogo completo: www.bit.ly/CatalogoPractiiko".
3. PROHIBIDO INVENTAR: No inventes nombres, códigos (D001, etc) ni precios.
4. BREVEDAD: Máximo 2 párrafos.
5. PRECIOS: Si el cliente es de Margarita, da el precio BCV y el precio CASH (más bajo). Si es Nacional, NO des precios, envíalo a WhatsApp: 0424-8948664.
6. UBICACIÓN: Tienda física en C.C. Terranova Plaza, Local A-14, Porlamar.

INVENTARIO ACTUAL:
{inventory_data}

INFO CLIENTE:
Nombre: {customer_name}
Plataforma: {platform}
`;

export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
  try {
    // 1. Sanitizar historial (Solo mensajes del usuario para evitar auto-contaminación)
    const tableName = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
    const historyRes = await query(
      `SELECT message FROM ${tableName} WHERE session_id = $1 AND (message::json->>'role') = 'user' ORDER BY created_at DESC LIMIT 3`,
      [sessionId]
    );
    const userHistory = historyRes.rows.map(r => (typeof r.message === 'string' ? JSON.parse(r.message) : r.message).content).join(" | ");

    // 2. Extraer intención y Buscar en DB
    const term = await getSearchTerm(message, userHistory);
    const dbResult = await searchInventory(term);

    // 3. Generar respuesta con el LLM como formateador
    const inventoryString = dbResult.found 
      ? JSON.stringify(dbResult.products, null, 2)
      : "NO HAY PRODUCTOS ENCONTRADOS.";

    const finalPrompt = SYSTEM_PROMPT
      .replace("{inventory_data}", inventoryString)
      .replace("{customer_name}", customerName)
      .replace("{platform}", source.toUpperCase());

    const response = await model.invoke([
      new SystemMessage(finalPrompt),
      new HumanMessage(message)
    ]);

    const aiResponse = response.content;

    // 4. Guardar respuesta
    if (source === 'whatsapp') {
      await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse })]);
    } else {
      await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse }), source, commentId]);
    }

    return aiResponse;

  } catch (error) {
    console.error("[PIPELINE FATAL ERROR]:", error);
    return "Hola! Un gusto saludarte. Tenemos los mejores sofás y colchones importados para ti. ¿Qué modelo buscas? Puedes ver nuestro catálogo aquí: www.bit.ly/CatalogoPractiiko 💎";
  }
}
