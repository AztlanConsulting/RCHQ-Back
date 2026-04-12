const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hashedPassword) {
    if(!plainPassword || !hashedPassword) {
        return false;
    }

    return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
    hashPassword,
    verifyPassword,
};