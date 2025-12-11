
const axios = require("axios");

async function testConnection() {
  const xml = `
  <?xml version="1.0" encoding="utf-8"?>
  <GeteBayOfficialTimeRequest xmlns="urn:ebay:apis:eBLBaseComponents">
    <RequesterCredentials>
      <eBayAuthToken>${process.env.EBAY_AUTH_TOKEN}</eBayAuthToken>
    </RequesterCredentials>
  </GeteBayOfficialTimeRequest>
  `;

  console.log("=== XML SENT TO EBAY ===");
  console.log(xml);

  try {
    const response = await axios.post(process.env.EBAY_TRADING_ENDPOINT, xml, {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-CALL-NAME": "GeteBayOfficialTime",
        "X-EBAY-API-SITEID": "3",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1149"
      }
    });

    console.log("SUCCESS:", response.data);

  } catch (error) {
    console.log("ERROR:", error.message);
    if (error.response) console.log("RESPONSE:", error.response.data);
  }
}

testConnection();
