const User = require("../../model/auth/auth.model");

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

async function clearExpiredTwoFactorAuthBlock(employee) {
  if (
    employee.twoFaBlockedUntil &&
    new Date(employee.twoFaBlockedUntil) <= new Date()
  ) {
    await User.clearTwoFactorAuthSecurityState(employee.employeeId);
  }
}

module.exports = {
  isBlockedUntil,
  clearExpiredLoginBlock,
  clearExpiredTwoFactorAuthBlock,
};