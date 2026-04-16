const User = require("../model/user.model");

async function getUserData(req) {
  const employeeId = req.user.id;

  const employee = await User.findEmployeeProfile(employeeId);

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

module.exports = { getUserData };