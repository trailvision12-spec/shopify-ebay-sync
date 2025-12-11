
const axios = require("axios");
const fs = require("fs");
const readline = require("readline");

////////////////////////////////////////////////////////////////////////////////
// SHOPIFY CLIENT
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
  return new Promise(resolve => setTimeout(resolve, ms));
}

////////////////////////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////////////////////////

function getSeoScore(product) {
  const title = product.seo?.title || product.metafields_global_title_tag || "";
  const desc  = product.seo?.description || product.metafields_global_description_tag || "";
  return (title ? 1 : 0) + (desc ? 1 : 0);
}

function isActive(product) {
  if (product.status) return product.status === "active";
  return !!product.published_at;
}

////////////////////////////////////////////////////////////////////////////////
// RESOLVE REST PRODUCT ID FROM 14-DIGIT SHOPIFY ID
////////////////////////////////////////////////////////////////////////////////

async function resolveRestProductId(id) {
  try {
    const res = await shopify.get(`/products/${id}.json`);
    return res.data.product.id;
  } catch (err) {
    console.log(`  ⚠️ REST lookup failed for ${id}: Not a valid REST ID`);
    return null;
  }
}

////////////////////////////////////////////////////////////////////////////////
// DELETE PRODUCT
////////////////////////////////////////////////////////////////////////////////

async function deleteProduct(restId) {
  try {
    await shopify.delete(`/products/${restId}.json`);
    console.log(`  ❌ Deleted product ${restId}`);
  } catch (err) {
    console.log("  Delete failed:", err.response?.data || err.message);
  }
}

////////////////////////////////////////////////////////////////////////////////
// CREATE REDIRECT
////////////////////////////////////////////////////////////////////////////////

async function createRedirect(fromHandle, toHandle) {
  try {
    await shopify.post(`/redirects.json`, {
      redirect: {
        path: `/products/${fromHandle}`,
        target: `/products/${toHandle}`
      }
    });
    console.log(`  ↳ Redirect created: ${fromHandle} → ${toHandle}`);
  } catch (err) {
    console.log("  Redirect failed:", err.response?.data || err.message);
  }
}

////////////////////////////////////////////////////////////////////////////////
// FETCH PRODUCTS
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
    await sleep(300);
  }

  return all;
}

////////////////////////////////////////////////////////////////////////////////
// FETCH ORDERS
////////////////////////////////////////////////////////////////////////////////

async function fetchAllOrders() {
  let all = [];
  let lastId = 0;

  while (true) {
    const res = await shopify.get(`/orders.json`, {
      params: {
        limit: 250,
        since_id: lastId,
        status: "any",
        fields: "id,line_items"
      }
    });

    const batch = res.data.orders;
    if (!batch.length) break;

    all = all.concat(batch);
    lastId = batch[batch.length - 1].id;

    console.log(`Fetched ${all.length} orders...`);
    await sleep(300);
  }

  return all;
}

////////////////////////////////////////////////////////////////////////////////
// ORDER PRODUCT SET
////////////////////////////////////////////////////////////////////////////////

function buildOrderProductSet(orders) {
  const set = new Set();
  for (const order of orders) {
    for (const line of order.line_items) {
      if (line.product_id) set.add(line.product_id);
    }
  }
  return set;
}

////////////////////////////////////////////////////////////////////////////////
// SKU GROUPING
////////////////////////////////////////////////////////////////////////////////

function buildSkuMap(products) {
  const map = {};
  for (const product of products) {
    for (const v of product.variants) {
      const sku = (v.sku || "").trim();
      if (!sku) continue;
      if (!map[sku]) map[sku] = [];
      map[sku].push({ product, variant: v });
    }
  }
  return map;
}

////////////////////////////////////////////////////////////////////////////////
// CSV HELPERS
////////////////////////////////////////////////////////////////////////////////

function toCsvValue(v) {
  if (v === null || v === undefined) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

// IMPORTANT: Clean Excel ="15513500000000"
function cleanExcelId(id) {
  if (!id) return "";
  return id.replace(/^="?/, "").replace(/"$/, "");
}

function writeCsv(filename, rows) {
  const header = [
    "sku",
    "product_id",
    "handle",
    "title",
    "orders",
    "inventory",
    "is_active",
    "seo_score",
    "recommend",
    "your_decision"
  ];

  const out = [header.join(",")];

  for (const r of rows) {
    const line = header.map(h => toCsvValue(r[h])).join(",");
    out.push(line);
  }

  fs.writeFileSync(filename, out.join("\n"), "utf8");
}

async function readCsv(filename) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filename),
    crlfDelay: Infinity
  });

  const rows = [];
  let header = null;

  for await (const line of rl) {
    if (!header) {
      header = splitCsv(line);
      continue;
    }
    const parts = splitCsv(line);
    if (!parts.length) continue;

    const row = {};
    header.forEach((h, i) => (row[h] = parts[i]));
    rows.push(row);
  }

  return rows;
}

function splitCsv(line) {
  const regex = /"([^"]*)"|([^,]+)/g;
  const out = [];
  let m;
  while ((m = regex.exec(line))) {
    out.push(m[1] || m[2] || "");
  }
  return out;
}

////////////////////////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////////////////////////

(async () => {

  ////////////////////////////////////////////////////////////////////////////
  // APPLY MODE
  ////////////////////////////////////////////////////////////////////////////

  if (APPLY_MODE) {
    console.log("🔧 APPLY MODE — Reading dedupe-review.csv...");

    const rows = await readCsv("dedupe-review.csv");

    const validRows = rows.filter(r =>
      r &&
      typeof r.sku !== "undefined" &&
      typeof r.product_id !== "undefined"
    );

    const groups = {};
    for (const r of validRows) {
      if (!groups[r.sku]) groups[r.sku] = [];
      groups[r.sku].push(r);
    }

    for (const [sku, entries] of Object.entries(groups)) {
      console.log(`\n=== SKU ${sku} ===`);

      const keeps = entries.filter(r => (r.your_decision || "").toLowerCase() === "keep");
      const deletes = entries.filter(r => (r.your_decision || "").toLowerCase() === "delete");

      if (keeps.length !== 1) {
        console.log(`⚠️  Skipping — EXACTLY ONE KEEP required for SKU ${sku}`);
        continue;
      }

      const keep = keeps[0];

      for (const del of deletes) {

        // redirect
        await createRedirect(del.handle, keep.handle);
        await sleep(600);

        // CLEAN the Excel ID
        const cleaned = cleanExcelId(del.product_id);

        // resolve rest ID
        const restId = await resolveRestProductId(cleaned);

        if (!restId) {
          console.log(`  ⚠️ Skipping delete for ${cleaned} (cannot resolve REST ID)`);
          continue;
        }

        // delete
        await deleteProduct(restId);
        await sleep(700);
      }

      console.log(`Finished SKU ${sku}, cooling down...`);
      await sleep(1200);
    }

    console.log("\n✅ APPLY COMPLETE\n");
    return;
  }

  ////////////////////////////////////////////////////////////////////////////
  // SCAN MODE
  ////////////////////////////////////////////////////////////////////////////

  console.log("🔍 SCANNING FOR DUPLICATES…");

  const products = await fetchAllProducts();
  const orders   = await fetchAllOrders();
  const orderSet = buildOrderProductSet(orders);
  const skuMap   = buildSkuMap(products);

  const rows = [];

  for (const [sku, group] of Object.entries(skuMap)) {
    if (group.length <= 1) continue;

    console.log(`Duplicate SKU found: ${sku}`);

    let best = null;

    for (const item of group) {
      const p = item.product;

      const score =
        (orderSet.has(p.id) ? 1000000 : 0) +
        p.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0) * 1000 +
        (isActive(p) ? 500 : 0) +
        getSeoScore(p) * 50 +
        (-p.handle.length) +
        (-new Date(p.created_at).getTime() / 1e10);

      item._score = score;
      if (!best || score > best._score) best = item;
    }

    for (const item of group) {
      const p = item.product;
      const inventory = p.variants.reduce(
        (sum, v) => sum + (v.inventory_quantity || 0),
        0
      );

      rows.push({
        sku,
        product_id: `="${p.id}"`,   // CRITICAL: TEXT FORMAT FOR EXCEL
        handle: p.handle,
        title: p.title,
        orders: orderSet.has(p.id) ? "yes" : "no",
        inventory,
        is_active: isActive(p) ? "yes" : "no",
        seo_score: getSeoScore(p),
        recommend: p.id === best.product.id ? "KEEP" : "DELETE",
        your_decision: ""
      });
    }
  }

  writeCsv("dedupe-review.csv", rows);
  console.log("\n📄 CSV created: dedupe-review.csv");
  console.log("➡️ Fill your_decision column with KEEP or DELETE");
  console.log("➡️ Then run: node dedupeBySku.js --apply\n");

})();
