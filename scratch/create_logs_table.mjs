import { query } from "../src/lib/db.js";

async function createLogsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        event_type TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Tabla webhook_logs creada.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

createLogsTable();
