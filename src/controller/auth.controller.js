// const { generateToken, generateFirstLoginToken, generatePre2faToken } = require("../utils/jwt");
// const { canAccess } = require("../middleware/abac");
// const { adminPolicy } = require("../policies/user.policies");
// const {verifyPassword, hashPassword} = require("../utils/password");
const authService = require("../service/auth.service");

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
    console.error("Error in Two Factor Auth setup:", error);
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
    console.error("Two Factor Auth verify setup error:", error);
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
    console.error("Two Factor Auth validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getTwoFactorAuthStatus = async (req, res) => {
  try {
    const result = await authService.getTwoFactorAuthStatus(req);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Two Factor Auth validation error:", error);
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
    console.error("TwoFactorAuth disable error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
