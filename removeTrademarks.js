
const axios = require("axios");

////////////////////////////////////////////////////////////////////////////////
// SHOPIFY REST CLIENT
////////////////////////////////////////////////////////////////////////////////

const shopify = axios.create({
  baseURL: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10`,
  headers: {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    "Content-Type": "application/json"
  }
});

const APPLY_MODE = process.argv.includes("--apply");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

////////////////////////////////////////////////////////////////////////////////
// FETCH ALL PRODUCTS
////////////////////////////////////////////////////////////////////////////////

async function fetchAllProducts() {
  let all = [];
  let lastId = 0;

  while (true) {
    const res = await shopify.get(`/products.json`, {
      params: { limit: 250, since_id: lastId }
    });

    const batch = res.data.products;
    if (!batch.length) break;

    all = all.concat(batch);
    lastId = batch[batch.length - 1].id;

    console.log(`Fetched ${all.length} products...`);
    await sleep(250);
  }

  return all;
}

////////////////////////////////////////////////////////////////////////////////
// CLEAN TITLE
////////////////////////////////////////////////////////////////////////////////

function cleanTitle(title) {
  if (!title) return title;

  // Remove ™ and ®
  return title.replace(/™/g, "").replace(/®/g, "").trim();
}

////////////////////////////////////////////////////////////////////////////////
// UPDATE PRODUCT TITLE
////////////////////////////////////////////////////////////////////////////////

async function updateTitle(productId, newTitle) {
  try {
    await shopify.put(`/products/${productId}.json`, {
      product: {
        id: productId,
        title: newTitle
      }
    });

    console.log(`  ✔ Updated title for product ${productId}`);
  } catch (e) {
    console.log(
      `  ✖ Failed updating ${productId}:`,
      e.response?.data || e.message
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////////////////////////

(async () => {
  console.log(APPLY_MODE ? "🛠 APPLY MODE" : "🔍 PREVIEW MODE");

  const products = await fetchAllProducts();

  let changedCount = 0;
  let totalExamined = 0;

  for (const p of products) {
    totalExamined++;

    const oldTitle = p.title;
    const newTitle = cleanTitle(oldTitle);

    if (oldTitle !== newTitle) {
      changedCount++;
      console.log(`\nProduct: ${p.id}`);
      console.log(`Old: ${oldTitle}`);
      console.log(`New: ${newTitle}`);

      if (APPLY_MODE) {
        await updateTitle(p.id, newTitle);
        await sleep(500); // avoid Shopify rate-limit
      }
    }
  }

  console.log("\n====================================");
  console.log(`Checked: ${totalExamined} products`);
  console.log(`Titles needing change: ${changedCount}`);
  console.log(`Mode: ${APPLY_MODE ? "APPLIED" : "PREVIEW ONLY"}`);
  console.log("====================================\n");
})();
