const axios = require("axios");
const ebayAuth = require("./ebayAuth");

async function callEbay(callName, xmlBody) {
  try {
    const response = await axios({
      method: "POST",
      url: "https://api.ebay.com/ws/api.dll",
      headers: ebayAuth.getTradingHeaders(callName),
      data: xmlBody,
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    return response;
  } catch (err) {
    console.error("❌ callEbay ERROR:", err);
    throw err;
  }
}

module.exports = { callEbay };
