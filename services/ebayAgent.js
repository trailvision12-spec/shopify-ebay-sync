const https = require("https");

const FORCED_IP = "151.101.2.206";

// Fully defensive lookup wrapper for Node 16 → 24+
function safeLookup(hostname, options, callback) {

  console.log("🔍 RAW lookup args:", { hostname, optionsType: typeof options, callbackType: typeof callback });

  // CASE 1 — Node passed (hostname, callback)
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  // CASE 2 — Node passed (hostname, {}, callback)
  if (typeof callback !== "function") {
    console.log("⚠️ callback missing — fixing");
    callback = () => {};
  }

  console.log(`🔍 Forcing DNS for ${hostname} -> ${FORCED_IP}`);

  // Always return valid IPv4 address
  return callback(null, FORCED_IP, 4);
}

function getEbayAgent() {
  return new https.Agent({
    keepAlive: false,
    servername: "api.ebay.com",
    lookup: safeLookup
  });
}

module.exports = { getEbayAgent };
