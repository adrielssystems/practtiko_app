import { query } from "../src/lib/db.js";

async function setup() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS tiiko_customers (
        id TEXT PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        last_seen TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Tabla tiiko_customers lista.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

setup();
