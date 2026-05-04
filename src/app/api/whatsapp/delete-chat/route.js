import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(req) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Falta el ID de sesión" }, { status: 400 });
    }

    console.log(`[DB DELETE WHATSAPP] Borrando conversación: ${sessionId}`);
    
    // Borrar mensajes de WhatsApp
    await query("DELETE FROM whatsapp_messages WHERE session_id = $1", [sessionId]);
    
    // También borrar el registro de cliente si se desea limpiar el board completamente
    // await query("DELETE FROM whatsapp_customers WHERE id = $1", [sessionId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE WHATSAPP ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
