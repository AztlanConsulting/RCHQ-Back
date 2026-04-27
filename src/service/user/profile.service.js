// src/service/profile.service.js
const profile = require("../../model/user/profile.model");
const responses = require("../../utils/responses");

async function getUserProfile(employeeId) {
  const employee = await profile.findEmployeeProfile(employeeId);

  if (!employee) {
    return {
      code: responses.profile.notFound
    };
  }
  return {
    code: responses.profile.found,
    data: employee
  };
}

module.exports = { getUserProfile };