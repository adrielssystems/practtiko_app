import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { query } from "../db.js";

// Herramienta de consulta de productos
const productsTool = new DynamicStructuredTool({
  name: "consultar_productos",
  description: "ÚNICA FUENTE DE VERDAD SOBRE EL INVENTARIO. Úsala ANTES de saludar o pedir datos si el cliente menciona CUALQUIER objeto (ej: colchón, cama, sofá, modular). No asumas que vendemos algo si no aparece aquí. Devuelve modelos, materiales y disponibilidad.",
  schema: z.object({
    query: z.string().describe("El producto o modelo a buscar (ej: 'sofa', 'modular', 'colchon')"),
  }),
  func: async function({ query: searchTerm }) {
    console.log(`[DB QUERY] Buscando en catálogo: ${searchTerm}`);
    try {
      const res = await query(
        "SELECT name, description, material, color, status FROM products WHERE name ILIKE $1 OR description ILIKE $1 LIMIT 5",
        [`%${searchTerm}%`]
      );
      return JSON.stringify(res.rows);
    } catch (e) {
      console.error("[DB ERROR]", e);
      return "Error al consultar el catálogo.";
    }
  },
});

const tools = [productsTool];

const SYSTEM_MESSAGE = `
Eres el Agente Virtual oficial de Practiiko 💎.

REGLA DE ORO — NO NEGOCIABLE:
1. NO SABES qué vende Practiiko por defecto. Tu memoria interna sobre productos es CERO.
2. Si el cliente menciona CUALQUIER producto (sofás, camas, colchones, mesas, etc.), DEBES llamar a 'consultar_productos' ANTES de dar cualquier respuesta afirmativa.
3. Si la herramienta devuelve [], informa de inmediato que NO manejamos ese rubro. Ejemplo: "Por los momentos no manejamos ese artículo en nuestro catálogo oficial. Nos especializamos en Sofás y Modulares de lujo."
4. NUNCA pidas la ciudad o el modelo si no has confirmado primero mediante la herramienta que el producto EXISTE.

IDENTIDAD Y MARCA:
- Especialista en ventas por DM, atención al cliente y cierre comercial.
- Slogan de cierre: "Es lujo, es simple, es Practiiko 💎".
- Trato: Siempre "Usted".
- Tono: Profesional, elegante, cercano, seguro. Vendedor sin presión.

FECHA Y HORA ACTUAL (Venezuela): {now}
`;

export async function processChatMessage(message, sessionId, source = 'dm', commentId = null) {
  try {
    // 1. Obtener historial reciente de la tabla correspondiente
    const tableName = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
    const historyRes = await query(
      `SELECT message FROM ${tableName} WHERE session_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [sessionId]
    );
    
    const chatHistory = historyRes.rows.map(r => typeof r.message === 'string' ? JSON.parse(r.message) : r.message).map(msg => msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)).reverse();

    // Intentar cargar el prompt personalizado desde la DB
    const settingsRes = await query("SELECT value FROM app_settings WHERE key = 'ai_prompt'");
    const dynamicSystemMessage = settingsRes.rows[0]?.value || SYSTEM_MESSAGE;

    const model = new ChatOpenAI({
      openAIApiKey: process.env.DEEPSEEK_API_KEY || "dummy_key_for_build",
      configuration: {
        baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
      },
      modelName: "deepseek-chat",
      temperature: 0.1, // Reducimos temperatura para ser más estrictos
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", dynamicSystemMessage],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    });

    const executor = new AgentExecutor({
      agent,
      tools,
    });

    const result = await executor.invoke({
      input: message,
      chat_history: chatHistory,
      now: new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
    });

    const aiResponse = result.output;

    // 2. Guardar en la tabla correspondiente
    // Nota: El webhook de WhatsApp ya guarda los mensajes, pero lo dejamos aquí por si se llama desde el simulador
    if (source !== 'whatsapp' || sessionId.startsWith('simul')) {
      await query(
        `INSERT INTO ${tableName} (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)`,
        [
          sessionId, 
          JSON.stringify({ role: 'user', content: message }), 
          source === 'whatsapp' ? 'whatsapp' : source,
          commentId,
          JSON.stringify({ role: 'assistant', content: aiResponse })
        ]
      );
    }

    return aiResponse;
  } catch (error) {
    console.error("[AGENT ERROR]:", error);
    return "Lo siento, tuve un problema técnico. ¿Podría repetirme su consulta? 💎";
  }
}
