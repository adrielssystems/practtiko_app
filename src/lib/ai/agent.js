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
  description: "ÚNICA FUENTE DE VERDAD SOBRE EL INVENTARIO Y PRECIOS. Úsala siempre que el cliente pregunte por modelos o costos. Devuelve nombres, descripciones, precios BCV ($) y precios Divisas ($).",
  schema: z.object({
    query: z.string().describe("El producto o modelo a buscar (ej: 'sofa', 'modular', 'colchon')"),
  }),
  func: async function({ query: searchTerm }) {
    console.log(`[DB QUERY] Buscando en catálogo: ${searchTerm}`);
    try {
      const res = await query(
        "SELECT name, description, price_bcv, price_cash, status FROM products WHERE (name ILIKE $1 OR description ILIKE $1) AND status = 'active' LIMIT 8",
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
Eres el Agente Virtual de Practiiko 💎. Tu objetivo es cerrar ventas de forma elegante, natural y persuasiva.
FECHA ACTUAL: {now}
PLATAFORMA: {platform}
CLIENTE: {customer_name}

INSTRUCCIONES CRÍTICAS DE VERACIDAD Y PRECIOS:
1. FILTRO DE UBICACIÓN (VITAL): 
   - SI EL CLIENTE ES DE MARGARITA: Puedes dar precios usando la herramienta 'consultar_productos'.
   - SI EL CLIENTE ES DE CUALQUIER OTRA PARTE (Valencia, Caracas, etc.): NO REVELES PRECIOS BAJO NINGUNA CIRCUNSTANCIA. 
     * Si está en Instagram: Dile que por políticas de envío nacional, los precios y presupuestos se dan exclusivamente por WhatsApp: https://wa.me/584248948664
     * Si está en WhatsApp: Dile que un asesor humano se comunicará con él en breve para darle el precio exacto y el costo de envío por Tealca.
2. VERACIDAD FINANCIERA: No inventes precios. Usa la herramienta solo para clientes de Margarita.
3. SI NO HAY PRECIO: Si la herramienta no devuelve un precio, indica que estás consultando con un humano.

OBJETIVOS:
- EN INSTAGRAM: Tu meta es que el cliente haga clic en el link de WhatsApp. NO DES PRECIOS a clientes de fuera de Margarita.
- EN WHATSAPP: Tu meta es CERRAR LA VENTA (solo Margarita). Para clientes nacionales, tu meta es captar el interés y pasarle el caso a un humano.

LOGÍSTICA Y ENVÍOS:
- MARGARITA: C.C. Terranova Plaza. ¡Envío GRATIS! 🎁
- NACIONAL: Envíos por TEALCA. (Recuerda: NO DAR PRECIOS del producto aquí).

PRECIOS Y PAGOS:
- Ofrece siempre el precio en Dólares (BCV) que devuelva la herramienta.
- Aceptamos Efectivo, Zelle o Binance.
- CASHEA: Hasta el 10/05/2026 hay promo (30%/25% inicial + cuotas).

CATÁLOGO: www.bit.ly/CatalogoPractiiko
VIDEOLLAMADA: https://wa.me/584248948664

RECUERDA: La elegancia de Practiiko reside en la honestidad. Si no tienes el dato exacto, no lo inventes.
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

    const model = new ChatOpenAI({
      openAIApiKey: process.env.DEEPSEEK_API_KEY || "dummy_key_for_build",
      configuration: {
        baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
      },
      modelName: "deepseek-chat",
      temperature: 0.1,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_MESSAGE],
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
