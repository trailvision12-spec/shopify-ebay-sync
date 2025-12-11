const { callEbay } = require("./ebayTrading");
const ebayAuth = require("./ebayAuth");

function buildTimeRequestXML() {
  return `<?xml version="1.0" encoding="utf-8"?>
<GeteBayOfficialTimeRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${ebayAuth.getAuthToken()}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_GB</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
  <Version>1147</Version>
</GeteBayOfficialTimeRequest>`;
}

async function testAuth() {
  const response = await callEbay("GeteBayOfficialTime", buildTimeRequestXML());

  return {
    status: response.status,
    headers: response.headers,
    body: response.data
  };
}

module.exports = { testAuth };
