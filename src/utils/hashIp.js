const crypto = require("crypto");

const LOG_IP_HASH_SECRET = process.env.LOG_IP_HASH_SECRET;

if (!LOG_IP_HASH_SECRET) {
  throw new Error("LOG_IP_HASH_SECRET is not defined");
}

function hashIp(ipAddress) {
  const normalizedIp = String(ipAddress || "").trim();

  return crypto
    .createHmac("sha256", LOG_IP_HASH_SECRET)
    .update(normalizedIp)
    .digest("hex");
}

module.exports = { hashIp };
