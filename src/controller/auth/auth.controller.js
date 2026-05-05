// const { generateToken, generateFirstLoginToken, generatePre2faToken } = require("../utils/jwt");
// const { canAccess } = require("../middleware/abac");
// const { adminPolicy } = require("../policies/user.policies");
// const {verifyPassword, hashPassword} = require("../utils/password");
const authService = require("../../service/auth/auth.service");
const passwordService = require("../../service/auth/password.service");
const { getClientIp } = require("../../utils/ip");

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

exports.changePasswordFirstLogin = async (req, res) => {
    try {
        const employeeId = req.user?.id || req.user?.employeeId;
        const { newPassword } = req.body || {};
        const ipAddress = getClientIp(req);

        const result = await passwordService.changePasswordFirstLogin({
            employeeId,
            newPassword,
            ipAddress,
        });

        return res.status(result.status).json(result.body);
    } catch (err) {
        console.error("First login password change error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const employeeId = req.user?.id || req.user?.employeeId;
        const { currentPassword, newPassword } = req.body || {};
        const ipAddress = getClientIp(req);

        const result = await passwordService.changePassword({
            employeeId,
            currentPassword,
            newPassword,
            ipAddress,
        });

        return res.status(result.status).json(result.body);
    } catch (err) {
        console.error("Change password error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.setupTwoFactorAuth = async (req, res) => {
    try {
        const employeeId = req.user?.id || req.user?.employeeId;
        const ipAddress = getClientIp(req);

        const result = await authService.setupTwoFactorAuth({
            employeeId,
            ipAddress,
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error("Error en el setUp de TwoFactorAuth:", error);
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
        console.error("Error para verificar el TwoFactorAuth:", error);
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
        console.error("Error para validar el TwoFactorAuth:", error);
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
        console.error("Error al obtener estado del TwoFactorAuth:", error);
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
        console.error("Error para quitar el TwoFactorAuth:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
};
