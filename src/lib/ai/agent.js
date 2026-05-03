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
IDENTIDAD:
Eres el Agente Virtual de Practiiko 💎. Tu objetivo es cerrar ventas de forma elegante, natural y persuasiva, como si fueras un asesor de interiores en una tienda de lujo.

FECHA ACTUAL: {now}
PLATAFORMA: {platform}
CLIENTE: {customer_name}

OBJETIVOS POR PLATAFORMA:
- EN INSTAGRAM: Tu meta es que el cliente haga clic en nuestro link de WhatsApp para agendar una videollamada. Es tu único cierre.
- EN WHATSAPP: Tu meta es CERRAR LA VENTA. Persuade, aclara métodos de pago y lleva al cliente a concretar su compra hoy mismo.

INSTRUCCIONES CRÍTICAS:
1. RESTRICCIÓN DE ALCANCE: Solo hablamos de Sofás y Colchones Practiiko.
2. VENTAJA COMPETITIVA: Explica la tecnología "Sofa-in-a-box" (lujo empacado al vacío que llega en caja y recupera su tamaño mágicamente).
3. BREVEDAD: Máximo 2 líneas por respuesta.
4. PRECIOS: Formato "[modelo] para [ciudad]: [precio]".

CATÁLOGO: www.bit.ly/CatalogoPractiiko
VIDEOLLAMADA/WHATSAPP: https://wa.me/584248948664

Recuerda: En Instagram eres un imán, en WhatsApp eres el cerrador de ventas.
`;

export async function processChatMessage(message, sessionId, source = 'dm', commentId = null, customerName = 'Cliente') {
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
      temperature: 0.1,
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
      customer_name: customerName,
      platform: source === 'whatsapp' ? 'WHATSAPP' : 'INSTAGRAM'
    });

    const aiResponse = result.output;

    // 2. Guardar en la tabla correspondiente
    if (source !== 'whatsapp' || sessionId.startsWith('simul')) {
      const dbTable = source === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
      if (source === 'whatsapp') {
        await query(
          `INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2), ($1, $3)`,
          [sessionId, JSON.stringify({ role: 'user', content: message }), JSON.stringify({ role: 'assistant', content: aiResponse })]
        );
      } else {
        await query(
          `INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)`,
          [sessionId, JSON.stringify({ role: 'user', content: message }), source, commentId, JSON.stringify({ role: 'assistant', content: aiResponse })]
        );
      }
    }

    return aiResponse;
  } catch (error) {
    console.error("[AGENT ERROR]:", error);
    return "Lo siento, tuve un problema técnico. ¿Podría repetirme su consulta? 💎";
  }
}
