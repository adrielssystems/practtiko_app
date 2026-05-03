import { NextResponse } from "next/server";
import { processChatMessage } from "@/lib/ai/agent";
import { query } from "@/lib/db";

// GET: Verificación de Webhook para Meta (Instagram)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

  console.log("--- INTENTO DE VALIDACIÓN DE WEBHOOK ---");
  console.log("Token esperado (Easypanel):", VERIFY_TOKEN);
  console.log("Token recibido (Meta):", token);
  console.log("Modo:", mode);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Validado con éxito");
    return new Response(challenge, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.error("❌ Fallo en la validación del Webhook: Tokens no coinciden");
  return new Response("Forbidden", { status: 403 });
}

// POST: Recepción de mensajes de Instagram
export async function POST(req) {
  try {
    const body = await req.json();

    // Verificamos que sea un mensaje de Instagram
    if (body.object === "instagram") {
      for (const entry of body.entry) {
        for (const messaging of entry.messaging) {
          if (messaging.message && !messaging.message.is_echo) {
            const senderId = messaging.sender.id;
            const userMessage = messaging.message.text;

            console.log(`[INSTAGRAM] Nuevo mensaje de ${senderId}: ${userMessage}`);

            // 1. (Opcional) Obtener historial de la tabla tiiko_chat_memory
            // Por ahora procesamos directamente para validar el flujo
            
            // 2. Procesar con la IA (DeepSeek + Herramientas de DB)
            const aiResponse = await processChatMessage(userMessage, senderId);

            // 3. Enviar respuesta a Instagram
            await sendInstagramMessage(senderId, aiResponse);
          }
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[ERROR WEBHOOK]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Función para enviar mensajes vía API de Instagram (Graph API)
async function sendInstagramMessage(recipientId, text) {
  const PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error("Falta INSTAGRAM_PAGE_ACCESS_TOKEN en las variables de entorno.");
    return;
  }

  const url = `https://graph.instagram.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text },
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error("[ERROR INSTAGRAM API]:", data.error);
    }
  } catch (e) {
    console.error("[ERROR SENDING MESSAGE]:", e);
  }
}
