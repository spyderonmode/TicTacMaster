const fs = require("fs");

const FILE = process.argv[2] || "users.json";

const users = JSON.parse(fs.readFileSync(FILE, "utf8"));
if (!Array.isArray(users)) {
  console.error("users.json must be an array");
  process.exit(1);
}

const cleaned = users.filter(u => u?.isGuest !== true);

fs.writeFileSync(FILE, JSON.stringify(cleaned, null, 2));
console.log(`Removed ${users.length - cleaned.length} guest users. Remaining: ${cleaned.length}`);
