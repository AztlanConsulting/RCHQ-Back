const { encryptValue, decryptValue } = require("./password");

const isLegacyHashedIp = (value) =>
    /^[0-9a-f]{64}$/i.test(String(value || "").trim());

exports.encryptLogIp = (ipAddress) => {
    const normalizedIp = String(ipAddress || "").trim();

    if (!normalizedIp) {
        return "";
    }

    return encryptValue(normalizedIp);
};

exports.readLogIp = (storedValue) => {
    const normalizedValue = String(storedValue || "").trim();

    if (!normalizedValue) {
        return "";
    }

    if (isLegacyHashedIp(normalizedValue)) {
        return normalizedValue;
    }

    const decryptedValue = decryptValue(normalizedValue);

    return decryptedValue || normalizedValue;
};
