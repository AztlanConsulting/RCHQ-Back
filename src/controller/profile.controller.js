const authService = require("../service/auth.service");
const profileService = require("../service/profile.service");

exports.getUserProfile = async (req, res) => {
  try {
    const result = await profileService.getUserProfile(req);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("getUserData error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};