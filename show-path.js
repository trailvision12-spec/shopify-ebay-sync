const path = require("path");
const fs = require("fs");


console.log("Working directory:", process.cwd());
console.log("Looking for .env at:", path.join(process.cwd(), ".env"));

console.log("\nDoes .env exist here?");
console.log(fs.existsSync(path.join(process.cwd(), ".env")) ? "YES" : "NO");

console.log("\nEnvironment variables loaded:");
console.log(process.env);
