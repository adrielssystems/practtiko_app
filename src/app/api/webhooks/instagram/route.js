import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { processChatMessage } from "@/lib/ai/agent";
import { query } from "@/lib/db";

// GET: Verificación de Webhook para Meta (Instagram)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

  console.log(`[DEBUG] Validando Webhook. Recibido: ${token}, Esperado: ${VERIFY_TOKEN}`);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// POST: Recepción de mensajes y comentarios de Instagram
export async function POST(req) {
  try {
    const body = await req.json();

    if (body.object === "instagram") {
      for (const entry of body.entry) {
        // --- 1. PROCESAR MENSAJES (DMs) ---
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            if (messaging.message && !messaging.message.is_echo) {
              const senderId = messaging.sender.id;
              const userMessage = messaging.message.text;

              console.log(`[INSTAGRAM DM] Nuevo mensaje de ${senderId}: ${userMessage}`);

              // Obtener info del usuario y guardar en DB
              const userInfo = await getInstagramUserInfo(senderId);
              if (userInfo) {
                await query(
                  `INSERT INTO instagram_customers (id, username, full_name, last_seen) 
                   VALUES ($1, $2, $3, NOW()) 
                   ON CONFLICT (id) DO UPDATE SET username = $2, full_name = $3, last_seen = NOW()`,
                  [senderId, userInfo.username, userInfo.name || userInfo.username]
                );
              }

              const aiResponse = await processChatMessage(userMessage, senderId, 'dm');
              await sendInstagramMessage(senderId, aiResponse);
            }
          }
        }

        // --- 2. PROCESAR COMENTARIOS ---
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "comments") {
              const commentId = change.value.id;
              const userMessage = change.value.text;
              const senderId = change.value.from.id;
              const username = change.value.from.username;

              console.log(`[INSTAGRAM COMMENT] Nuevo de @${username} en ${commentId}: ${userMessage}`);

              // Guardar cliente
              await query(
                `INSERT INTO instagram_customers (id, username, full_name, last_seen) 
                 VALUES ($1, $2, $3, NOW()) 
                 ON CONFLICT (id) DO UPDATE SET username = $2, full_name = $3, last_seen = NOW()`,
                [senderId, username, username]
              );

              const aiResponse = await processChatMessage(userMessage, senderId, 'comment', commentId);
              await replyToInstagramComment(commentId, aiResponse);
            }
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

// Función para responder a un comentario de Instagram
async function replyToInstagramComment(commentId, text) {
  const PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!PAGE_ACCESS_TOKEN) return;

  const url = `https://graph.instagram.com/v21.0/${commentId}/replies?message=${encodeURIComponent(text)}&access_token=${PAGE_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();
    if (data.error) {
      console.error("[ERROR REPLY COMMENT]:", data.error);
    }
  } catch (e) {
    console.error("[EXCEPTION REPLY COMMENT]:", e);
  }
}

async function getInstagramUserInfo(userId) {
  const PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!PAGE_ACCESS_TOKEN) return null;

  try {
    const url = `https://graph.instagram.com/v21.0/${userId}?fields=username,name&access_token=${PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      console.error("[ERROR FETCH USER]:", data.error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("[FETCH USER EXCEPTION]:", e);
    return null;
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
