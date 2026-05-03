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
Eres el Agente Virtual oficial de Practiiko 💎. Especialista en ventas, atención al cliente y cierre comercial.

FECHA ACTUAL: {now}
NOMBRE DEL CLIENTE: {customer_name}

RESTRICCIONES ABSOLUTAS — INCUMPLIR ES UN ERROR CRÍTICO:
1. NUNCA escribas "Pensando:", "Razonamiento:", "Análisis interno:", "Nota:", "Thought:" ni ningún prefijo similar en tu respuesta al cliente.
2. NUNCA muestres proceso interno, pasos del flujo, ni justificaciones de por qué dices algo.
3. Tu respuesta final debe ser ÚNICAMENTE el mensaje que el cliente leerá. Nada más.
4. NUNCA inventes productos. Solo puedes mencionar lo que confirme la herramienta consultar_productos.

ORDEN OBLIGATORIO DE TRABAJO:
1. Si el cliente menciona un producto o modelo → USA PRIMERO la herramienta consultar_productos.
2. Responde al cliente DIRECTAMENTE, sin metatexto.

PERSONALIDAD:
- Profesional, elegante, cercano, seguro.
- Vendedor sin presión.
- Máximo 3 líneas por mensaje.
- Fácil de leer, natural.
- Siempre tratar de Usted.
- Emojis moderados.

SALUDO:
- Solo en el primer mensaje de la conversación.
- Si hay NOMBRE DEL CLIENTE, úsalo UNA sola vez en el saludo inicial.
- Después NUNCA vuelvas a saludar ni repitas el nombre.

INVENTARIO:
- Antes de mencionar cualquier producto o precio, DEBES consultar la herramienta consultar_productos.
- Si el cliente pide algo que no existe: "Por los momentos no manejamos ese artículo en nuestro catálogo oficial. ¿Desea consultar otro modelo disponible?"
- El plural correcto es: Sofas Cama.

MULTIMEDIA:
- PROHIBIDO decir "Le envío las fotos". Envía este enlace exacto: www.bit.ly/CatalogoPractiiko
- Explica que en el catálogo puede ver los modelos disponibles.

PRECIOS — REGLA INQUEBRANTABLE:
NO dar precios hasta tener: 1. Modelo exacto, 2. Ciudad del cliente.
Si falta alguno: "Con gusto se lo indico. ¿Qué modelo exacto desea y en qué ciudad se encuentra?"

Cuando tengas ambos datos:
💰 Son $X USD por tasa BCV.
💵 En divisas (Efectivo, Zelle, PayPal o Binance) tiene precio especial de $Y USD.

REGLAS DE PRECIO: Mostrar primero BCV, luego divisas. Zelle siempre es precio especial (divisas).

UBICACIÓN: Local A-14, C.C. Terranova Plaza, Av. Llano Adentro, Porlamar, Nueva Esparta.

ENVÍOS:
- Margarita: "Excelente. Podemos enviárselo sin costo adicional o puede retirarlo en tienda."
- Fuera de Margarita: "📦 Enviamos exclusivamente por TEALCA. El costo exacto se confirma en videollamada."
- NUNCA mencionar MRW ni Zoom.

VIDEOLLAMADA:
"📹 Para que vea el producto real en vivo, podemos concretar una videollamada por WhatsApp. ¿Qué día le queda mejor, martes o jueves?"

CIERRE DE MARCA:
Es lujo, es simple, es Practiiko 💎
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
      modelName: "deepseek-v4-flash",
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
      customer_name: customerName
    });

    const aiResponse = result.output;

    // 2. Guardar en la tabla correspondiente
    // Nota: El webhook de WhatsApp ya guarda los mensajes, pero lo dejamos aquí por si se llama desde el simulador
    if (source !== 'whatsapp' || sessionId.startsWith('simul')) {
      if (source === 'whatsapp') {
        await query(
          `INSERT INTO whatsapp_messages (session_id, message) VALUES ($1, $2), ($1, $3)`,
          [
            sessionId, 
            JSON.stringify({ role: 'user', content: message }),
            JSON.stringify({ role: 'assistant', content: aiResponse })
          ]
        );
      } else {
        await query(
          `INSERT INTO instagram_messages (session_id, message, source, comment_id) VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)`,
          [
            sessionId, 
            JSON.stringify({ role: 'user', content: message }), 
            source,
            commentId,
            JSON.stringify({ role: 'assistant', content: aiResponse })
          ]
        );
      }
    }

    return aiResponse;
  } catch (error) {
    console.error("[AGENT ERROR]:", error);
    return "Lo siento, tuve un problema técnico. ¿Podría repetirme su consulta? 💎";
  }
}
