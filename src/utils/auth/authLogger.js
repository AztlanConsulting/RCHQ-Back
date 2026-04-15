const User = require("../../model/user.model");
const { LOG_ACTIONS } = require("../logActions");

async function logLoginFailed(employeeId, ipAddress) {
    await User.createLog(employeeId, LOG_ACTIONS.LOGIN_FAILED, ipAddress);
}

async function logAccountBlocked(employeeId, ipAddress) {
    await User.createLog(employeeId, LOG_ACTIONS.ACCOUNT_BLOCKED, ipAddress);
}

async function logLoginSuccess(employeeId, ipAddress) {
    await User.createLog(employeeId, LOG_ACTIONS.LOGIN_SUCCESS, ipAddress);
}

async function logInactiveAccess(employeeId, ipAddress) {
    await User.createLog(employeeId, LOG_ACTIONS.INACTIVE_ACCESS_DENIED, ipAddress);
}

async function logFirstLoginPendingPasswordChange(employeeId, ipAddress) {
    await User.createLog(
        employeeId,
        LOG_ACTIONS.FIRST_LOGIN_PENDING_PASSWORD_CHANGE,
        ipAddress
    );
}

module.exports = {
    logLoginFailed,
    logAccountBlocked,
    logLoginSuccess,
    logInactiveAccess,
    logFirstLoginPendingPasswordChange,
};