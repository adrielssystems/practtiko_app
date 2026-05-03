import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tiiko_chat_memory (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        message JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabla tiiko_chat_memory creada o verificada correctamente.");
  } catch (e) {
    console.error("Error al crear la tabla:", e);
  } finally {
    await pool.end();
    process.exit();
  }
}

setup();
