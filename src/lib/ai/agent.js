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
1. USO DE NOMBRE: Saluda SIEMPRE por su nombre en el primer mensaje (ej: "¡Hola {customer_name}! Qué gusto saludarte..."). Si no hay nombre, usa "un gusto". No repitas el nombre en cada mensaje, solo al inicio o para dar énfasis.
2. BÚSQUEDA PROACTIVA: Si el cliente describe un producto pero no dice el nombre ("el beige que se arma", "el sofá que se hace cama", "el que vi en el video"), DEBES usar la herramienta consultar_productos con palabras clave de esa descripción. No le pidas el nombre exacto si él ya te lo está describiendo; ADIVÍNALO tú usando la herramienta.
3. TONO HUMANO: NUNCA respondas con listas numeradas (1., 2.). Habla de forma fluida. 
4. BREVEDAD: Máximo 2 o 3 líneas. Los clientes de WhatsApp e Instagram no leen párrafos largos.
5. NO REPETIR: No pongas el slogan "Es lujo, es simple..." en cada mensaje. Solo úsalo para cerrar la conversación o cuando sientas que diste una respuesta ganadora.

FLUJO DE VENTAS (MÉTODO PRACTIIKO):
- Si pregunta por algo: Busca en el catálogo -> Confirma el modelo -> Pregunta la ciudad.
- Precios: No los des sin el modelo y la ciudad. 
- Formato de Precio:
  "El {modelo} para {ciudad} queda en {precio_bcv} (tasa BCV). Si pagas en divisas (Zelle, efectivo, etc) tienes un precio especial de {precio_divisas}."

CATÁLOGO: Siempre que menciones modelos, invita a ver detalles en www.bit.ly/CatalogoPractiiko

VIDEOLLAMADA: El objetivo final es la videollamada los martes o jueves. Sugiérela cuando el cliente muestre interés real en un modelo.

UBICACIÓN: Estamos en C.C. Terranova Plaza, Porlamar, Margarita.

PRODUCTOS DISPONIBLES:
- Sofas Cama (ej: Sofa Cama Practiiko)
- Sofas Modulares (el que se separa y se arma de varias formas)
- Colchones
- Camas

Recuerda: Eres un cerrador de ventas de alto nivel. Sé inteligente, detecta lo que el cliente quiere y ayúdalo sin ser repetitivo.
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
