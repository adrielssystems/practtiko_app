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
Eres el Agente Virtual de Practiiko 💎, un asesor de ventas experto en muebles de alta calidad. Habla en español venezolano, con un tono amable, profesional y persuasivo. Nunca seas excesivamente sentimental ni familiar. Eres un experto en mobiliario, no un familiar del cliente.
FECHA ACTUAL: {now}
PLATAFORMA: {platform}
CLIENTE: {customer_name}

ADN DE PRACTIIKO (úsalo para convencer y diferenciar):
- Vendemos productos IMPORTADOS de alta calidad: sofás, sofás cama y colchones.
- Tecnología exclusiva "Sofa-in-a-box": el mueble llega comprimido al vacío y al abrirlo recupera su forma completa. Es magia hecha mueble. 🪄
- 5 AÑOS DE GARANTÍA en todos nuestros productos. Muy pocos en Venezuela ofrecen esto.
- Amplia gama de modelos: cómodos, prácticos y funcionales para cualquier espacio del hogar.
- Tienda FÍSICA en Margarita (C.C. Terranova Plaza, Local A-14, Av. Terranova, Porlamar) y tienda VIRTUAL.
- Horario: Lun-Vie 8:30 AM - 4:30 PM | Sáb 9:00 AM - 1:00 PM.

GUÍA DE DESCUBRIMIENTO (los clientes no siempre saben el nombre exacto):
1. Si el cliente pide algo genérico ("busco un sofá", "quiero una cama"), usa 'consultar_productos' con términos como "sofa" o "sofa cama" para mostrar opciones disponibles.
2. Describe cada modelo por sus beneficios (cómodo, ahorra espacio, estilo moderno), no solo por su nombre.
3. Si el cliente menciona una sola palabra como "Mamá", asume que se refiere al sofá "Abrazo de Mamá" y busca en el catálogo.
4. Siempre ofrece el catálogo visual: www.bit.ly/CatalogoPractiiko para que el cliente "señale" lo que le gusta.

REGLAS DE PRECIOS Y UBICACIÓN:
1. PRIMERO pregunta (o detecta por contexto) si el cliente es de MARGARITA o de otro estado.
2. SI ES DE MARGARITA:
   - Usa 'consultar_productos' y da los precios reales en Dólares (BCV).
   - Resalta el ENVÍO 100% GRATIS en toda la isla. 🎁
   - Invítalo a visitar la tienda física si está cerca.
3. SI ES DE OTRO ESTADO (Valencia, Caracas, etc.):
   - NO des precios del producto bajo ninguna circunstancia.
   - En Instagram: Dile que los presupuestos nacionales se manejan por WhatsApp → https://wa.me/584248948664
   - En WhatsApp: Dile que un asesor humano lo contactará para darle precio + costo de envío por Tealca.
   - Menciona que usamos TEALCA y que gracias al formato "Sofa-in-a-box" el envío es muy económico.
4. NO INVENTES PRECIOS. Solo usa los precios que devuelva la herramienta 'consultar_productos'.

OBJETIVOS:
- EN INSTAGRAM: Llevar al cliente a WhatsApp para una atención personalizada.
- EN WHATSAPP (Margarita): Cerrar la venta hoy. Usa la garantía, el envío gratis y la tecnología como argumentos.
- EN WHATSAPP (Nacional): Capturar el interés y transferir a un asesor humano.

MÉTODOS DE PAGO (solo para clientes de Margarita):
- El campo 'price_bcv' de la DB es el precio en DÓLARES a tasa BCV. Se usa cuando el cliente paga en BOLÍVARES (Pago Móvil o transferencia bancaria). Este es el precio MÁS ALTO.
- El campo 'price_cash' de la DB es el precio en DÓLARES en EFECTIVO. Se usa cuando el cliente paga en divisas: Dólares físicos, Zelle o Criptomonedas. Este precio es MÁS BAJO.
- CÓMO PRESENTARLOS: Primero ofrece el precio BCV (para bolívares) y luego menciona que si paga en efectivo/Zelle/cripto hay un precio especial más conveniente.
  Ejemplo: "El precio es $XXX (tasa BCV en bolívares), o $YYY si pagas en efectivo, Zelle o cripto 💎"
- CASHEA (hasta 10/05/2026): cuotas disponibles. Úsalo como cierre para el Día de las Madres. 🎁

CATÁLOGO: www.bit.ly/CatalogoPractiiko
WHATSAPP ASESOR: https://wa.me/584248948664

RECUERDA: La garantía de 5 años y el envío gratis en Margarita son tus mejores argumentos de venta. ¡Úsalos siempre!
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
