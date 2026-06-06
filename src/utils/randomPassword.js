const crypto = require("node:crypto");

const DEFAULT_PASSWORD_LENGTH = 12;
const PASSWORD_CHARS =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?";

exports.DEFAULT_PASSWORD_LENGTH = DEFAULT_PASSWORD_LENGTH;

exports.generateRandomPassword = (length = DEFAULT_PASSWORD_LENGTH) => {
    if (!Number.isInteger(length) || length <= 0) {
        throw new Error(
            "La longitud de la contraseña debe ser un entero positivo",
        );
    }

    const bytes = crypto.randomBytes(length);
    return Array.from(
        bytes,
        (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length],
    ).join("");
};
