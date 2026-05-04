import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const dbRes = await query("SELECT NOW() as db_now, CURRENT_SETTING('TIMEZONE') as db_timezone");
  const serverNow = new Date();
  
  return NextResponse.json({
    server_time: serverNow.toISOString(),
    server_local: serverNow.toString(),
    db_now: dbRes.rows[0].db_now,
    db_timezone: dbRes.rows[0].db_timezone,
    caracas_test: serverNow.toLocaleString('es-VE', { timeZone: 'America/Caracas' })
  });
}
