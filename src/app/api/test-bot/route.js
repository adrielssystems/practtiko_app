import { processChatMessage } from "@/lib/ai/agent";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { message, sessionId, customerName } = await req.json();
    
    const aiResponse = await processChatMessage(
      message, 
      sessionId || 'simul-user', 
      'dm', 
      null, 
      customerName || 'Explorador'
    );
    
    return NextResponse.json({ 
      success: true, 
      bot_response: aiResponse 
    });
  } catch (error) {
    console.error("Simulator API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error en el agente virtual" 
    }, { status: 500 });
  }
}
