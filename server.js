const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const https = require("https");
https.globalAgent.options.secureProtocol = "TLSv1_2_method";
https.globalAgent.options.honorCipherOrder = true;

console.log("WORKING DIR:", process.cwd());
console.log("ENV PATH:", require("path").resolve(".env"));

require("dotenv").config();

const buildEbayHtml = require("./services/ebayTemplate");
const express = require("express");
const app = express();

// Log requests
app.use((req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.url);
  next();
});

/* ==========================================================================
   EBAY MARKETPLACE ACCOUNT DELETION ENDPOINT
   ========================================================================== */

// 🔥 MUST support GET WITH challenge_code
app.get("/ebay/notification", (req, res) => {
  const challenge = req.query.challenge_code;

  if (challenge) {
    console.log("✔️ Responding to eBay challenge:", challenge);
    return res.status(200).type("text/plain").send(challenge);
  }

  // normal GET fallback
  res.status(200).send("OK");
});

// 🔥 MUST use express.text BEFORE express.json
app.post("/ebay/notification", express.text({ type: "*/*" }), (req, res) => {
  console.log("📩 POST Notification received:", req.body);
  res.status(200).send("OK");
});

/* ==========================================================================
   OTHER MIDDLEWARE
   ========================================================================== */

app.use(express.json());

console.log("Loaded routes!");

/* ==========================================================================
   SHOPIFY API
   ========================================================================== */

const {
  getProduct,
  getVariant,
  getAllProducts,
  getProductImages,
  adjustInventory,
  updateInventory
} = require("./services/shopify");

/* ==========================================================================
   DATABASE
   ========================================================================== */

const { saveMapping, findByVariant } = require("./db/mapping");

/* ==========================================================================
   EBAY TEMPLATE PREVIEW
   ========================================================================== */

app.get("/preview-ebay/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const version = parseInt(req.query.v) || 1;

    const product = await getProduct(productId);
    const html = await buildEbayHtml(product, { templateVersion: version });

    res.send(html);
  } catch (err) {
    console.error("🔥 Preview Error:", err);
    res.status(500).send("Error generating preview");
  }
});

/* ==========================================================================
   SHOPIFY DEBUG
   ========================================================================== */

app.get("/test-shopify", async (req, res) => {
  try {
    const product = await getProduct("15513484460419");
    res.json(product);
  } catch (err) {
    console.error("🔥 Shopify Error:", err.response?.data || err.message);
    res.status(500).send("Shopify error");
  }
});

app.get("/env-debug", (req, res) => {
  res.json({
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_ADMIN_API_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
      ? "LOADED"
      : "MISSING",
    SHOPIFY_LOCATION_ID: process.env.SHOPIFY_LOCATION_ID || "NOT SET"
  });
});

/* ==========================================================================
   DB TEST
   ========================================================================== */

app.get("/test-db", (req, res) => {
  try {
    saveMapping({
      shopify_product_id: "111",
      shopify_variant_id: "222",
      sku: "TEST-SKU",
      ebay_item_id: "333"
    });

    const row = findByVariant("222");
    res.json(row);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).send("DB error");
  }
});

/* ==========================================================================
   EBAY TRADING API
   ========================================================================== */

const { callEbay } = require("./services/ebayTrading");
const { buildAddFixedPriceItemXML } = require("./services/ebayAddItem");

app.post("/ebay/test-listing", async (req, res) => {
  try {
    const product = {
      title: "Test Blueseal Bearing",
      description: "This is a test listing.",
      categoryId: "179985",
      price: "9.99",
      condition: "1000",
      quantity: "1",
      paypal: "your-paypal@example.com"
    };

    const xml = buildAddFixedPriceItemXML(product);
    const result = await callEbay("AddFixedPriceItem", xml);

    res.send(result);
  } catch (err) {
    console.error("❌ eBay Listing Error:", err);
    res.status(500).send("Error creating listing");
  }
});

/* ==========================================================================
   AUTH TEST
   ========================================================================== */

const { testAuth } = require("./services/ebayTest");

app.get("/ebay/test-auth", async (req, res) => {
  try {
    const response = await testAuth();

    res.type("text/plain").send(
`=== EBAY AUTH TEST ===
Status: ${response.status}

Headers:
${JSON.stringify(response.headers, null, 2)}

Body:
${response.data}
`
    );
  } catch (err) {
    res.type("text/plain").send(
`EBAY AUTH ERROR:
MESSAGE: ${err.message}
CODE: ${err.code || "none"}
STATUS: ${err.response?.status || "none"}

RESPONSE:
${err.response?.data || "none"}
`
    );
  }
});

/* ==========================================================================
   ROOT
   ========================================================================== */

app.get("/", (req, res) => {
  res.send("Shopify ↔ eBay Sync App Running");
});

/* ==========================================================================
   START SERVER
   ========================================================================== */

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
