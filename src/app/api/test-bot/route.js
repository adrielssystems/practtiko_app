import { NextResponse } from "next/server";
import { processChatMessage } from "@/lib/ai/agent";

export async function GET() {
  try {
    const testMessage = "Hola, qué modelos de camas tienen disponibles y qué precio tienen?";
    const sessionId = "test-user-" + Date.now();
    
    console.log("[TEST BOT] Iniciando prueba con mensaje:", testMessage);
    
    const response = await processChatMessage(testMessage, sessionId);
    
    return NextResponse.json({
      success: true,
      input: testMessage,
      bot_response: response
    });
  } catch (error) {
    console.error("[TEST BOT ERROR]:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    const { message, testId } = await req.json();
    const sessionId = testId || "test-user-" + Date.now();
    
    console.log("[TEST BOT] Procesando mensaje de prueba:", message);
    
    const response = await processChatMessage(message, sessionId);
    
    return NextResponse.json({
      success: true,
      bot_response: response
    });
  } catch (error) {
    console.error("[TEST BOT ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
