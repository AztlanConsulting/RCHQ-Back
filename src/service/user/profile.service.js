const profile = require("../../model/user/profile.model");
const RESPONSES = require("../../utils/responses");

async function getUserProfile(employeeId) {
  const employee = await profile.findEmployeeProfile(employeeId);

  if (!employee) {
    return {
      code: RESPONSES.PROFILE.NOT_FOUND,
    };
  }
  return {
    code: RESPONSES.PROFILE.FOUND,
    data: employee,
  };
}

module.exports = { getUserProfile };
