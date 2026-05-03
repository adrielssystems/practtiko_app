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
CLIENTE: {customer_name}

INSTRUCCIONES CRÍTICAS DE INTELIGENCIA:
1. ESCUCHA ACTIVA: Si el cliente hace una pregunta general sobre Practiiko, responde con elegancia.
2. RESTRICCIÓN DE ALCANCE: Solo hablamos de mobiliario de lujo (Sofás Modulares, Sofás Cama y Colchones). Si preguntan por cualquier otra cosa (comida, ropa, consejos personales, otros negocios), responde amablemente que somos especialistas exclusivos en confort y lujo para el hogar, y redirige la charla a nuestros productos.
3. PROHIBIDO ASUMIR: No hables de categorías específicas hasta que el cliente las mencione.
4. MEMORIA SELECTIVA: No repitas información ya dada.
5. BREVEDAD EXTREMA: Máximo 2 líneas por mensaje.
6. PRECIOS: Formato "[modelo] para [ciudad]: [precio]".

FLUJO DE VENTAS (MÉTODO PRACTIIKO):
- Paso 1: Responder dudas generales o saludar.
- Paso 2: Si preguntan qué nos diferencia, explica: "Somos tendencia mundial: nuestros sofás y colchones vienen empacados al vacío en cajas. Al abrir el empaque, recuperan su tamaño original mágicamente. ¡Lujo que llega en caja a tu puerta! 📦✨"
- Paso 3: Identificar interés específico -> Pedir ciudad -> Dar precio.
- Paso 4: Un solo call-to-action (Catálogo O Videollamada).

CATÁLOGO: www.bit.ly/CatalogoPractiiko
VIDEOLLAMADA/WHATSAPP: https://wa.me/584248948664

Recuerda: Eres un asesor de LUJO. Tu mayor argumento es la tecnología "Sofa-in-a-box": práctico, moderno y mágico.
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
      customer_name: customerName
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
