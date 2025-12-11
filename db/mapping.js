const db = require("./database");

// Insert or update mapping
function saveMapping({ shopify_product_id, shopify_variant_id, sku, ebay_item_id }) {
  const stmt = db.prepare(`
    INSERT INTO product_map (shopify_product_id, shopify_variant_id, sku, ebay_item_id, last_sync)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(shopify_variant_id)
    DO UPDATE SET 
      ebay_item_id = excluded.ebay_item_id,
      last_sync = datetime('now')
  `);

  stmt.run(shopify_product_id, shopify_variant_id, sku, ebay_item_id);
}

// Find mapping by SKU
function findBySku(sku) {
  return db.prepare(`SELECT * FROM product_map WHERE sku = ?`).get(sku);
}

// Find mapping by Shopify variant ID
function findByVariant(variantId) {
  return db.prepare(`SELECT * FROM product_map WHERE shopify_variant_id = ?`).get(variantId);
}

// Find mapping by eBay Item ID
function findByEbayId(ebayId) {
  return db.prepare(`SELECT * FROM product_map WHERE ebay_item_id = ?`).get(ebayId);
}

module.exports = {
  saveMapping,
  findBySku,
  findByVariant,
  findByEbayId
};
