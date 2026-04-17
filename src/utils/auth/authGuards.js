const User = require("../../model/user.model");

function isBlockedUntil(dateValue) {
    return dateValue && new Date(dateValue) > new Date();
}

function isExpiredBlock(dateValue) {
    return dateValue && new Date(dateValue) <= new Date();
}

async function clearExpiredLoginBlock(employee) {
    if (isExpiredBlock(employee.blockedUntil)) {
        await User.clearLoginSecurityState(employee.employeeId);
        employee.failedLoginAttempts = 0;
        employee.blockedUntil = null;
    }
}

async function clearExpired2FABlock(employee) {
    // TIENE que validar que la fecha exista antes de compararla
    if (employee.twoFaBlockedUntil && new Date(employee.twoFaBlockedUntil) <= new Date()) {
        await User.clear2FASecurityState(employee.employeeId);
    }
}

module.exports = {
    isBlockedUntil,
    clearExpiredLoginBlock,
    clearExpired2FABlock,
};