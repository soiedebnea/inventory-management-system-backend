import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All inventory data lives in a single JSON file on disk.
// This keeps the project dependency-free (no database server to install)
// while still giving every record durability across restarts.
const DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

const defaultData = {
  suppliers: [],
  products: [],
  stockLogs: [],
};

const adapter = new JSONFile(DB_FILE);
export const db = new Low(adapter, defaultData);

export async function initDB() {
  await db.read();
  db.data ||= defaultData;
  db.data.suppliers ||= [];
  db.data.products ||= [];
  db.data.stockLogs ||= [];
  await db.write();
  console.log(`[db] Loaded ${DB_FILE}`);
  console.log(
    `[db] ${db.data.suppliers.length} suppliers, ${db.data.products.length} products, ${db.data.stockLogs.length} stock logs`
  );
}

export async function persist() {
  await db.write();
}