import { query } from "./src/lib/db.js";

async function migrate() {
  try {
    console.log("Iniciando migración para pausar bot...");
    
    // 1. Añadir columna a instagram_customers
    await query(`
      ALTER TABLE instagram_customers 
      ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;
    `);
    console.log("- Columna ai_enabled añadida a instagram_customers");

    // 2. Añadir columna a whatsapp_customers
    await query(`
      ALTER TABLE whatsapp_customers 
      ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;
    `);
    console.log("- Columna ai_enabled añadida a whatsapp_customers");

    console.log("¡Migración completada con éxito!");
    process.exit(0);
  } catch (e) {
    console.error("Error en la migración:", e);
    process.exit(1);
  }
}

migrate();
