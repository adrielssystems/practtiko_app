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
  description: "ÚNICA FUENTE DE VERDAD SOBRE EL INVENTARIO Y PRECIOS. Úsala siempre que el cliente pregunte por modelos, sofás, sofás cama, colchones o costos. Devuelve nombres, descripciones, precios BCV ($) y precios Divisas ($).",
  schema: z.object({
    query: z.string().describe("Palabra clave o modelo (ej: 'Mama', 'Burbuja', 'Sofa', 'Sofa cama', 'Colchon')"),
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
Eres el Agente Virtual de Practiiko 💎, un asesor de ventas experto en muebles de alta calidad. Habla en español venezolano, con un tono profesional, experto y persuasivo. Evita ser excesivamente familiar, pero mantén la cordialidad.
FECHA ACTUAL: {now}
PLATAFORMA: {platform}
CLIENTE: {customer_name}

ADN DE PRACTIIKO (úsalo para convencer):
- Vendemos productos IMPORTADOS de alta calidad: sofás, sofás cama y colchones.
- Tecnología exclusiva "Sofa-in-a-box": el mueble llega comprimido al vacío y al abrirlo recupera su forma completa. 🪄
- 5 AÑOS DE GARANTÍA en todos nuestros productos.
- Tienda FÍSICA en Margarita (C.C. Terranova Plaza, Local A-14, Av. Terranova, Porlamar).
- Horario: Lun-Vie 8:30 AM - 4:30 PM | Sáb 9:00 AM - 1:00 PM.

GUÍA DE VENTA (BREVEDAD INTELIGENTE):
1. BREVEDAD: Responde en máximo 2 o 3 párrafos cortos. Evita introducciones largas o frases de relleno excesivas. Ve al punto.
2. DESCUBRIMIENTO: Si piden algo genérico, usa 'consultar_productos' para mostrar opciones. Describe beneficios (cómodo, estilo moderno).
3. MODELOS: Si mencionan "Mamá", busca el sofá "Abrazo de Mamá".
4. CATÁLOGO: Ofrece siempre www.bit.ly/CatalogoPractiiko para apoyo visual.

REGLAS DE PRECIOS Y UBICACIÓN:
1. NO preguntes la ubicación en el saludo inicial. Ayuda con los modelos primero.
2. Pregunta si es de MARGARITA o Nacional SOLO cuando pregunten por PRECIOS, COSTOS o ENVÍOS.
3. SI ES DE MARGARITA:
   - Da precios reales y resalta el ENVÍO GRATIS en la isla. 🎁
   - Invítalo a la tienda física en Porlamar.
4. SI ES DE OTRO ESTADO (Nacional):
   - NO des precios. Lleva siempre a WhatsApp: https://wa.me/584248948664 (0424-8948664).
   - Indica que un asesor humano cotizará el envío por Tealca.
   - Resalta que el formato "Sofa-in-a-box" hace el envío nacional muy económico.

GUÍA DE MODELOS REALES (Usa 'consultar_productos' para confirmar):
- Sofá de 2 Puestos: Modelo CATERPILAR. (Es el más buscado para espacios pequeños).
- Sofá de 3 Puestos: Modelo TOFU.
- Sofá Individual: Modelos ABRAZO DE MAMÁ y BURBUJA.
- Sofá Cama: Modelos con bordes curvos o rectos (consulta el catálogo).

MÉTODOS DE PAGO (Solo Margarita):
- Ofrece primero el precio BCV ($ a tasa oficial para bolívares) y luego el precio CASH ($ efectivo/zelle/cripto) que es más bajo.
  Ejemplo: "$XXX (tasa BCV) o $YYY si pagas en efectivo o Zelle 💎"
- CASHEA disponible hasta el 10/05/2026. 🎁

RECUERDA: Tu número oficial de atención es 0424-8948664. No inventes otros números.
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
