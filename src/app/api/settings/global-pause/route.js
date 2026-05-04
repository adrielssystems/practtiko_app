import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await query("SELECT value FROM app_settings WHERE key = 'global_bot_enabled'");
    const isEnabled = res.rows.length > 0 ? res.rows[0].value === 'true' : true; // Default true
    return NextResponse.json({ enabled: isEnabled });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch global setting" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { enabled } = await req.json();
    await query(`
      INSERT INTO app_settings (key, value) 
      VALUES ('global_bot_enabled', $1) 
      ON CONFLICT (key) DO UPDATE SET value = $1
    `, [enabled ? 'true' : 'false']);
    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update global setting" }, { status: 500 });
  }
}
