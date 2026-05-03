import { query } from "../src/lib/db.js";

async function updateSchema() {
  try {
    await query(`
      ALTER TABLE instagram_messages 
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'dm',
      ADD COLUMN IF NOT EXISTS comment_id TEXT;
    `);
    console.log("Esquema de instagram_messages actualizado.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

updateSchema();
