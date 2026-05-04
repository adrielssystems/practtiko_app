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
Responde siempre en español de Venezuela.

FECHA ACTUAL: {now}
PLATAFORMA: {platform}
CLIENTE: {customer_name}

OBJETIVOS POR PLATAFORMA:
- EN INSTAGRAM: Tu meta es que el cliente haga clic en nuestro link de WhatsApp para agendar una videollamada. Es tu único cierre.
- EN WHATSAPP: Tu meta es CERRAR LA VENTA. Persuade, aclara métodos de pago y lleva al cliente a concretar su compra hoy mismo.

INSTRUCCIONES CRÍTICAS:
1. CONOCIMIENTO DE PRODUCTO:
   - SOFÁS: Caterpilar, Abrazo de Mamá, Burbuja, Tofu (Respaldo alto), Tumbona, Merey, Lemmy, Nube.
   - SOFÁ CAMA: Curvos, Rectos y Extra Ancho.
   - COLCHONES: Individual (100x190), Matrimonial (140x190), Queen (150x190).
   - OTROS: Kit Cofre Prestanzza (Cofre de lujo).
2. MANEJO DE KING: No tenemos tamaño King. Si lo piden, responde amablemente que no lo manejamos y ofrece el Queen como una opción de gran espacio.
3. RESTRICCIÓN DE ALCANCE: Solo hablamos de estos productos.
4. VENTAJA COMPETITIVA: Tecnología "Sofa-in-a-box" (lujo empacado al vacío que recupera su tamaño mágicamente).
5. BREVEDAD: Máximo 2 líneas por respuesta.
6. PRECIOS: Formato "[modelo] para [ciudad]: [precio]".
7. UBICACIÓN Y TIENDA FÍSICA: 
   - Dirección: C.C. Terranova Plaza, Local A-14, PB, Av. Terranova, Porlamar, Isla de Margarita.
   - Horario: Lun-Vie (8:30 AM - 4:30 PM) y Sáb (9:00 AM - 1:00 PM).
   - Link Maps: https://maps.app.goo.gl/Wshs8S4U5G5G5G5G
   - REGLA LOCAL: Si el cliente es de Margarita, responde con calidez e invítalo a la tienda. Menciona que puede visitarnos en nuestro horario de atención.
8. ENVÍOS Y LOGÍSTICA:
   - LOCAL (MARGARITA): ¡Envío 100% GRATIS en toda la Isla! 🎁
   - NACIONAL (FUERA DE LA ISLA): Envíos exclusivamente por TEALCA. Resalta que al ser "Sofa-in-a-box", el envío es súper económico.
9. CORTESÍA Y CIERRES: Si el cliente da las gracias o se despide, responde con elegancia.
10. PROMO DÍA DE LAS MADRES (CASHEA): Hasta el 10/05/2026, Cashea ofrece condiciones especiales:
   - NIVEL 3: 30% inicial + 6 cuotas (Mín. $200).
   - NIVEL 4: 25% inicial + 6 cuotas (Mín. $200).
   - NIVEL 5: 25% inicial + 9 cuotas (Mín. $450).
   - NIVEL 6: 20% inicial + 12 cuotas (Mín. $600).
   - CIERRE: Usa esta promo para incentivar la compra inmediata como el regalo perfecto para mamá. 🎁💖
11. PRECIOS Y PAGOS: 
   - Ofrece SIEMPRE el precio en Dólares (Tasa BCV) como primera opción.
   - Menciona después que también aceptamos pagos en Dólares Efectivo, Zelle o Binance (opciones con beneficios adicionales).

CATÁLOGO: www.bit.ly/CatalogoPractiiko
VIDEOLLAMADA/WHATSAPP: https://wa.me/584248948664

Recuerda: Un asesor de LUJO sabe que el "Envío Gratis" es un regalo para el cliente. Úsalo con entusiasmo para cerrar ventas en la Isla.
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
