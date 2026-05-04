import { query } from "../src/lib/db.js";

async function list() {
  try {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("TABLES:", res.rows.map(r => r.table_name));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

list();
