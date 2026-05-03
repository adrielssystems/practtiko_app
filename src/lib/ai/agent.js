import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { DynamicTool } from "@langchain/core/tools";
import { query } from "@/lib/db";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  openAIApiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
  },
  modelName: "deepseek-chat",
  temperature: 0.3,
});

const productsTool = new DynamicTool({
  name: "consultar_productos",
  description: "Consulta el catálogo oficial de Practiiko. Úsalo para buscar modelos, precios, stock y descripciones.",
  func: async (input) => {
    try {
      const res = await query(`
        SELECT p.name, p.code, p.price_bcv, p.price_cash, p.stock, p.description, c.name as category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name ILIKE $1 OR p.code ILIKE $1 OR p.description ILIKE $1
        LIMIT 5
      `, [`%${input}%`]);

      if (res.rows.length === 0) return "No se encontraron productos con esos términos.";

      return JSON.stringify(res.rows.map(p => ({
        nombre: p.name,
        sku: p.code,
        precio_bcv: `$${p.price_bcv}`,
        precio_divisas: `$${p.price_cash}`,
        stock: p.stock,
        categoria: p.category,
        detalle: p.description
      })));
    } catch (e) {
      return "Error al consultar la base de datos de productos.";
    }
  },
});

const tools = [productsTool];

const SYSTEM_MESSAGE = `
RESTRICCIONES ABSOLUTAS — VIOLARLAS ES ERROR CRÍTICO:
1. Tu respuesta debe ser ÚNICAMENTE el mensaje que el cliente leerá en Instagram DM. Nada más.
2. PROHIBIDO incluir: "Pensando:", "Razonamiento:", "Análisis:", "[SYSTEM PROMPT]", "Nota interna:", ni cualquier metatexto.
3. PROHIBIDO repetir saludos o nombres después del primer mensaje de la conversación.
4. PROHIBIDO inventar productos. Solo menciona lo que confirme la herramienta consultar_productos.
5. PROHIBIDO dar precios sin tener: Modelo Exacto + Ciudad del cliente.
6. PROHIBIDO mencionar MRW o Zoom. Envíos nacionales: solo TEALCA.
7. PROHIBIDO asociar Zelle con tasa BCV. Zelle siempre es precio en divisas.

IDENTIDAD Y MARCA:
- Eres el Agente Virtual oficial de Practiiko 💎.
- Especialista en ventas por DM, atención al cliente y cierre comercial.
- Slogan de cierre: "Es lujo, es simple, es Practiiko 💎".
- Trato: Siempre "Usted".
- Tono: Profesional, elegante, cercano, seguro. Vendedor sin presión.

FECHA ACTUAL: {now}
`;

export async function processChatMessage(message, sessionId) {
  // 1. Cargar historial desde la base de datos
  const historyRes = await query(
    `SELECT message FROM tiiko_chat_memory WHERE session_id = $1 ORDER BY created_at ASC LIMIT 10`,
    [sessionId]
  );
  
  const chatHistory = historyRes.rows.map(row => {
    const msg = row.message;
    return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
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
  });

  const aiResponse = result.output;

  // 2. Guardar mensaje del usuario y respuesta de la IA en la DB
  await query(
    `INSERT INTO tiiko_chat_memory (session_id, message) VALUES ($1, $2), ($1, $3)`,
    [
      sessionId, 
      JSON.stringify({ role: 'user', content: message }), 
      JSON.stringify({ role: 'assistant', content: aiResponse })
    ]
  );

  return aiResponse;
}
