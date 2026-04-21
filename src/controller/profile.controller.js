const profileService = require("../service/profile.service");

exports.getUserProfile = async (req, res) => {
  try {
    const result = await profileService.getUserProfile(req);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("getUserData error:", err);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el perfil del usuario",
    });
  }
};