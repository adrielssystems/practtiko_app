import { query } from "../src/lib/db.js";

const sql = `
  CREATE TABLE IF NOT EXISTS whatsapp_customers (
    id TEXT PRIMARY KEY,
    push_name TEXT,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function createTables() {
  try {
    await query(sql);
    console.log("Tablas de WhatsApp creadas correctamente.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

createTables();
