module.exports = {
  getAuthToken() {
    const token = process.env.EBAY_AUTH_TOKEN;
    if (!token) {
      throw new Error("EBAY_AUTH_TOKEN is missing from .env");
    }
    return token;
  },

  getTradingHeaders(callName) {
    return {
      "X-EBAY-API-SITEID": process.env.EBAY_SITE_ID,
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1147",
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-APP-NAME": process.env.EBAY_APP_ID,
      "X-EBAY-API-DEV-NAME": process.env.EBAY_DEV_ID,
      "X-EBAY-API-CERT-NAME": process.env.EBAY_CERT_ID,
      "X-EBAY-API-REQUEST-ENCODING": "XML",
      "Content-Type": "text/xml"
    };
  }
};
