import { query } from "./src/lib/db.js";

async function migrate() {
  try {
    console.log("Iniciando migración...");
    await query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        is_main BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT
    `);
    
    console.log("✅ Base de datos actualizada con éxito.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error en la migración:", e);
    process.exit(1);
  }
}

migrate();
