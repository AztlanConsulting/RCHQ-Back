/**
 * Encrypt salary strings using the same encryptValue() as create/update APIs.
 * Run from rhcq_back: node scripts/encrypt-cli.js <value> [<value> ...]
 */
require("dotenv").config();
const { encryptValue } = require("../src/utils/password");

const salaries = process.argv.slice(2);
if (salaries.length === 0) {
  console.error("Usage: node scripts/encrypt-cli.js <salary> [<salary> ...]");
  console.error("Example: node scripts/encrypt-cli.js 12000 0");
  process.exit(1);
}

for (const salary of salaries) {
  console.log(`${salary}\t${encryptValue(salary)}`);
}
