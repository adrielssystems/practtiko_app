import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(req) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Falta el ID de sesión" }, { status: 400 });
    }

    console.log(`[DB DELETE] Borrando conversación: ${sessionId}`);
    
    // Borrar mensajes
    await query("DELETE FROM instagram_messages WHERE session_id = $1", [sessionId]);
    
    // Opcional: Borrar cliente si se desea, pero mejor dejarlo por si vuelve a escribir
    // await query("DELETE FROM instagram_customers WHERE id = $1", [sessionId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
