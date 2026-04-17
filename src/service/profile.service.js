const profile = require("../model/profile.model");

async function getUserProfile(req) {
  const employeeId = req.user.id;

  const employee = await profile.findEmployeeProfile(employeeId);

  if (!employee) {
    return {
      status: 404,
      body: {
        success: false,
        message: "Profile not found",
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      data: employee,
    },
  };
}

module.exports = { getUserProfile };