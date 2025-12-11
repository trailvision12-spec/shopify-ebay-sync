require("dotenv").config();

const token = process.env.EBAY_AUTH_TOKEN;

console.log("======== TOKEN DEBUG ========");
console.log("Loaded token length:", token ? token.length : "NULL");
console.log("Loaded token start:", token ? JSON.stringify(token.slice(0, 20)) : "NULL");
console.log("Loaded token end:", token ? JSON.stringify(token.slice(-20)) : "NULL");

console.log("Full token (escaped):", JSON.stringify(token));
