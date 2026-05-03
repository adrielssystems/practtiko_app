import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    let sql = "SELECT id, event_type, payload, created_at FROM webhook_logs";
    let params = [];

    if (filter !== "all") {
      sql += " WHERE event_type = $1";
      params.push(filter);
    }

    sql += " ORDER BY created_at DESC LIMIT 50";

    const res = await query(sql, params);
    return NextResponse.json({ logs: res.rows });
  } catch (error) {
    console.error("[LOGS API ERROR]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
