import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { query } from "../db.js";

// Herramienta de consulta de productos MEJORADA
const productsTool = new DynamicStructuredTool({
  name: "consultar_inventario_practiiko",
  description: "OBLIGATORIA. Úsala para CUALQUIER pregunta sobre productos, modelos, precios, colchones o sofás. Si no la usas, no puedes responder.",
  schema: z.object({
    termino: z.string().describe("Palabra clave para buscar (ej: 'colchon', 'sofa', 'mama', 'D006')"),
  }),
  func: async function({ termino }) {
    console.log(`[STRICT DB SEARCH] Buscando: ${termino}`);
    try {
      let t = termino.trim().toLowerCase();
      // Limpieza básica para errores comunes (clochon -> colchon)
      if (t.includes('clochon')) t = t.replace('clochon', 'colchon');
      if (t.includes('soffa')) t = t.replace('soffa', 'sofa');
      
      let clean = t;
      if (clean.endsWith('es')) clean = clean.slice(0, -2);
      else if (clean.endsWith('s')) clean = clean.slice(0, -1);

      const res = await query(
        `SELECT p.name, p.description, p.code, p.price_bcv, p.price_cash, c.name as categoria
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE (p.name ILIKE $1 OR p.description ILIKE $1 OR p.code ILIKE $1 OR c.name ILIKE $1 OR p.name ILIKE $2 OR c.name ILIKE $2)
         AND p.status = 'active' LIMIT 10`,
        [`%${t}%`, `%${clean}%`]
      );

      if (res.rows.length === 0) {
        return "ERROR CRÍTICO: No existe NADA con ese nombre en la base de datos real. Dile al cliente que no tienes ese modelo exacto disponible por ahora.";
      }
      return JSON.stringify(res.rows);
    } catch (e) {
      return "Error de conexión con inventario.";
    }
  },
});

const tools = [productsTool];

const SYSTEM_MESSAGE = `
IDENTIDAD: Eres el Agente Virtual de Practiiko 💎. Tu única misión es informar sobre el inventario REAL.

REGLA DE ORO: NO CONOCES NINGÚN MODELO DE MEMORIA. 
Para responder sobre sofás, colchones o precios, DEBES usar 'consultar_inventario_practiiko' SIEMPRE.
Si la herramienta no devuelve resultados, NO INVENTES NOMBRES NI PRECIOS. Di que no tienes ese modelo disponible.

PAUTAS DE RESPUESTA:
- Brevedad extrema (máximo 2 párrafos).
- No narres que vas a buscar, solo da la respuesta.
- Si el cliente es de Margarita: Da precios BCV y Cash (el cash es el más bajo).
- Si el cliente es Nacional: NO DES PRECIOS. Envíalo a WhatsApp: 0424-8948664.
- Apoyo visual: www.bit.ly/CatalogoPractiiko (Prohibido enviar fotos).

DATO CLAVE: Los códigos reales son como D001, D006, etc. Verifica siempre qué producto es cada código en la base de datos antes de hablar.
`;

export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
  try {
    const tableName = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
    const historyRes = await query(
      `SELECT message FROM ${tableName} WHERE session_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [sessionId]
    );
    const chatHistory = historyRes.rows.map(r => typeof r.message === 'string' ? JSON.parse(r.message) : r.message).map(msg => msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)).reverse();

    const model = new ChatOpenAI({
      openAIApiKey: process.env.DEEPSEEK_API_KEY,
      configuration: { baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com" },
      modelName: "deepseek-chat",
      temperature: 0, // Cero creatividad para evitar alucinaciones
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_MESSAGE],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = createToolCallingAgent({ llm: model, tools, prompt });
    const executor = new AgentExecutor({ agent, tools });

    const result = await executor.invoke({
      input: message,
      chat_history: chatHistory,
    });

    const aiResponse = result.output;

    // Guardado de mensajes
    const dbTable = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
    if (source === 'whatsapp') {
      await query(`INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse })]);
    } else {
      await query(`INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4)`, [sessionId, JSON.stringify({ role: 'assistant', content: aiResponse }), source, commentId]);
    }

    return aiResponse;
  } catch (error) {
    console.error("[AGENT FATAL ERROR]:", error);
    return "Lo siento, tuve un problema al consultar mi inventario. ¿Podrías repetir tu pregunta? 💎";
  }
}
