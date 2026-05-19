const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_ROUNDS = 10;

// ----- HASHING (one-way; bcrypt)

exports.hashValue = async (value) => bcrypt.hash(value, SALT_ROUNDS);

exports.verifyHashedValue = async (plainValue, hashedValue) => {
    if (!plainValue || !hashedValue) {
        return false;
    }
    return bcrypt.compare(plainValue, hashedValue);
};

exports.hashPassword = async (plainPassword) =>
    bcrypt.hash(plainPassword, SALT_ROUNDS);

exports.verifyPassword = async (plainPassword, hashedPassword) => {
    if (!plainPassword || !hashedPassword) {
        return false;
    }
    return bcrypt.compare(plainPassword, hashedPassword);
};

// ----- ENCRYPTION (reversible)

/** 32-byte key: 64 hex chars, or standard base64 of 32 raw bytes */
function getEncryptionKeyBuffer() {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw || typeof raw !== "string") {
        throw new Error(
            "ENCRYPTION_KEY is missing; set it in the environment.",
        );
    }

    let trimmed = raw.replace(/^\uFEFF/, "").trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        trimmed = trimmed.slice(1, -1).trim();
    }

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        return Buffer.from(trimmed, "hex");
    }

    const decoded = Buffer.from(trimmed, "base64");
    if (decoded.length === 32) {
        return decoded;
    }

    throw new Error(
        `ENCRYPTION_KEY must be 64 hex chars (32 bytes) or base64 that decodes to 32 bytes (got ${trimmed.length} chars, base64 decodes to ${decoded.length} bytes). Generate with: openssl rand -hex 32`,
    );
}

/** Returns base64: iv (12) + tag (16) + ciphertext — safe for a text column */
exports.encryptValue = (plainValue) => {
    if (plainValue === null || plainValue === undefined) {
        throw new Error("encryptValue requires a value");
    }

    const key = getEncryptionKeyBuffer();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const plaintext = Buffer.from(String(plainValue), "utf8");
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

exports.decryptValue = (storedValue) => {
    try {
        if (
            storedValue === null ||
            storedValue === undefined ||
            storedValue === ""
        ) {
            throw new Error("decryptValue requires stored ciphertext");
        }

        const key = getEncryptionKeyBuffer();
        const buf = Buffer.from(String(storedValue), "base64");
        const minLen = IV_LENGTH + TAG_LENGTH;
        if (buf.length <= minLen) {
            throw new Error("invalid encrypted payload");
        }

        const iv = buf.subarray(0, IV_LENGTH);
        const tag = buf.subarray(IV_LENGTH, minLen);
        const ciphertext = buf.subarray(minLen);
        const decipher = crypto.createDecipheriv(ALGO, key, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]).toString("utf8");
    } catch {
        return "";
    }
};
