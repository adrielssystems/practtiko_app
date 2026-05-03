import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const res = await query("SELECT value FROM app_settings WHERE key = $1", [key]);
    return NextResponse.json({ value: res.rows[0]?.value || null });
  } catch (error) {
    console.error("[SETTINGS GET ERROR]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    await query(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2) 
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, value]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS API ERROR]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
