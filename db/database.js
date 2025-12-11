const Database = require("better-sqlite3");

// Create or open the database file
const db = new Database("sync.db");

// Create the product_map table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS product_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shopify_product_id TEXT NOT NULL,
    shopify_variant_id TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL,
    ebay_item_id TEXT,
    last_sync TEXT,
    template_version INTEGER DEFAULT 1
  )
`);

// Migration: ensure template_version exists
const pragma = db.prepare(`PRAGMA table_info(product_map);`).all();
const hasTemplateVersion = pragma.some(col => col.name === "template_version");

if (!hasTemplateVersion) {
  db.exec(`
    ALTER TABLE product_map
    ADD COLUMN template_version INTEGER DEFAULT 1;
  `);
  console.log("Added template_version column to product_map");
}

/*
|--------------------------------------------------------------------------
| ADD SUPPORT FOR ebay_tokens TABLE
|--------------------------------------------------------------------------
*/
db.exec(`
  CREATE TABLE IF NOT EXISTS ebay_tokens (
    user_id TEXT PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    expires_in INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/*
|--------------------------------------------------------------------------
| ADD run(), get(), all() HELPERS for ebayAuth.js compatibility
|--------------------------------------------------------------------------
*/
module.exports = {
  // standard db object (if you need raw access)
  raw: db,

  run(sql, params = []) {
    return db.prepare(sql).run(params);
  },

  get(sql, params = []) {
    return db.prepare(sql).get(params);
  },

  all(sql, params = []) {
    return db.prepare(sql).all(params);
  }
};
