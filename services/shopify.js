console.log("LOAD PATH:", __dirname);

console.log("DEBUG SHOPIFY DOMAIN:", process.env.SHOPIFY_STORE_DOMAIN);


const axios = require("axios");

// Create Shopify API client with correct env variables
const shopify = axios.create({
  baseURL: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10`,
  headers: {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    "Content-Type": "application/json"
  }
});

// GET PRODUCT
async function getProduct(productId) {
  const res = await shopify.get(`/products/${productId}.json`);
  return res.data.product;
}

// GET VARIANT
async function getVariant(variantId) {
  const res = await shopify.get(`/variants/${variantId}.json`);
  return res.data.variant;
}

// GET ALL PRODUCTS
async function getAllProducts(limit = 250, since_id = 0) {
  const res = await shopify.get(`/products.json`, {
    params: { limit, since_id }
  });
  return res.data.products;
}

// GET IMAGES
async function getProductImages(productId) {
  const res = await shopify.get(`/products/${productId}/images.json`);
  return res.data.images;
}

// ADJUST INVENTORY
async function adjustInventory(inventoryItemId, adjustment) {
  return shopify.post(`/inventory_levels/adjust.json`, {
    location_id: process.env.SHOPIFY_LOCATION_ID,
    inventory_item_id: inventoryItemId,
    available_adjustment: adjustment
  });
}

// SET INVENTORY
async function updateInventory(inventoryItemId, newQty) {
  return shopify.post(`/inventory_levels/set.json`, {
    location_id: process.env.SHOPIFY_LOCATION_ID,
    inventory_item_id: inventoryItemId,
    available: newQty
  });
}

module.exports = {
  getProduct,
  getVariant,
  getAllProducts,
  getProductImages,
  adjustInventory,
  updateInventory
};
