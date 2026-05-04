import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const platform = searchParams.get('platform'); // 'instagram' or 'whatsapp'

  if (!id || !platform) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const table = platform === 'instagram' ? 'instagram_customers' : 'whatsapp_customers';
  
  try {
    const res = await query(`SELECT ai_enabled FROM ${table} WHERE id = $1`, [id]);
    return NextResponse.json({ ai_enabled: res.rows[0]?.ai_enabled ?? true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { id, platform, enabled } = await req.json();

    if (!id || !platform) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const table = platform === 'instagram' ? 'instagram_customers' : 'whatsapp_customers';
    
    await query(`
      UPDATE ${table} 
      SET ai_enabled = $1 
      WHERE id = $2
    `, [enabled, id]);

    return NextResponse.json({ success: true, ai_enabled: enabled });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
