// const { generateToken, generateFirstLoginToken, generatePre2faToken } = require("../utils/jwt");
// const { canAccess } = require("../middleware/abac");
// const { adminPolicy } = require("../policies/user.policies");
// const {verifyPassword, hashPassword} = require("../utils/password");
// const authService = require("../service/auth.service");
const personnelService = require("../service/personnel.service");

exports.getEmployeeDetail = async (req, res) => {
    try {
        const result = await personnelService.getEmployeeDetail(req);
        return res.status(result.status).json(result.body);
    } catch (err) {
        console.error("Employee detail error:", err);
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        });
    }
}

exports.loginFunction = async (req, res) => {
  try {
    const result = await authService.login(req);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      employeeId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      privileges: req.user.privileges || [],
    },
  });
};

// exports.changePasswordFirstLogin = async (req, res) => {
//   try {
//     const result = await authService.changePasswordFirstLogin(req);
//     return res.status(result.status).json(result.body);
//   } catch (err) {
//     console.error("First login password change error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

exports.setupTwoFactorAuth = async (req, res) => {
  try {
    const result = await authService.setupTwoFactorAuth(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.verifyTwoFactorSetup = async (req, res) => {
  try {
    const result = await authService.verifyTwoFactorSetup(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("2FA verify setup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.validateTwoFactorAuth = async (req, res) => {
  try {
    const result = await authService.validateTwoFactorAuth(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("2FA validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getStatus2FA = async (req, res) => {
  try {
    const result = await authService.getStatus2FA(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("2FA validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.disableTwoFactorAuth = async (req, res) => {
  try {
    const result = await authService.disableTwoFactorAuth(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("2FA disable error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
