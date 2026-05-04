const { query } = require('./src/lib/db');

async function checkTime() {
  try {
    const res = await query("SELECT NOW() as db_now, CURRENT_SETTING('TIMEZONE') as db_timezone");
    console.log("DB NOW (UTC?):", res.rows[0].db_now);
    console.log("DB TIMEZONE:", res.rows[0].db_timezone);
    
    const testConv = await query("SELECT created_at FROM whatsapp_messages ORDER BY created_at DESC LIMIT 1");
    if (testConv.rows[0]) {
        console.log("ULTIMO MENSAJE (raw):", testConv.rows[0].created_at);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkTime();
