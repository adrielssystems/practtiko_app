import { query } from "../src/lib/db.js";

async function listProducts() {
  try {
    const res = await query("SELECT name FROM products LIMIT 10");
    console.log("Productos en DB:", res.rows.map(r => r.name));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

listProducts();
