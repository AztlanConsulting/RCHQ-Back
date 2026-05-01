// src/controller/profile.controller.js
const profileService = require("../../service/user/profile.service");
const RESPONSES = require("../../utils/responses");

exports.getUserProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const result = await profileService.getUserProfile(employeeId);

    if (result.code === RESPONSES.PROFILE.NOT_FOUND) {
      return res.status(404).json({
        success: false,
        message: "Perfil no encontrado",
      });
    } else if (result.code === RESPONSES.PROFILE.FOUND) {
      return res.status(200).json({
        success: true,
        message: "Perfil encontrado",
        data: result.data,
      });
    }
  } catch (err) {
    console.error("getUserData error:", err);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el perfil del usuario",
    });
  }
};
