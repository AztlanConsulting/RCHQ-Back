const User = require("../../model/user.model");

function isBlockedUntil(dateValue) {
    return dateValue && new Date(dateValue) > new Date();
}

function isExpiredBlock(dateValue) {
    return dateValue && new Date(dateValue) <= new Date();
}

async function clearExpiredLoginBlock(employee) {
    if (isExpiredBlock(employee.blockeduntil)) {
        await User.clearLoginSecurityState(employee.employeeid);
        employee.failedloginattempts = 0;
        employee.blockeduntil = null;
    }
}

async function clearExpired2FABlock(employee) {
    if (isExpiredBlock(employee.twofablockeduntil)) {
        await User.clear2FASecurityState(employee.employeeid);
        employee.failed2faattempts = 0;
        employee.twofablockeduntil = null;
    }
}

module.exports = {
    isBlockedUntil,
    clearExpiredLoginBlock,
    clearExpired2FABlock,
};