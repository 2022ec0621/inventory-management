import sqlite3 from "sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "inventory.db");

sqlite3.verbose();
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // PRODUCTS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      unit TEXT,
      category TEXT,
      brand TEXT,
      stock INTEGER,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // INVENTORY HISTORY TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      old_quantity INTEGER,
      new_quantity INTEGER,
      change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      user TEXT,
      remark TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  // USERS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // Seed default admin & client with hashed passwords
  const adminHash = bcrypt.hashSync("admin123", 10);
  const clientHash = bcrypt.hashSync("client123", 10);

  db.run(
    `
    INSERT OR IGNORE INTO users (id, username, password, role)
    VALUES
      (1, 'admin', ?, 'admin'),
      (2, 'client', ?, 'client')
    `,
    [adminHash, clientHash]
  );
});

export default db;
