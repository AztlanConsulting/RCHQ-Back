const authService = require("../../service/auth/auth.service");
const passwordService = require("../../service/auth/password.service");
const { getClientIp } = require("../../utils/ip");

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
};

exports.loginFunction = async (req, res) => {
    try {
        const result = await authService.login(req);
        if (result.status === 200 && result.body.data?.refreshToken) {
            res.cookie("refreshToken", result.body.data.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 1 * 24 * 60 * 60 * 1000, // 1 día
            });
            delete result.body.data.refreshToken;
        }
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

        if (result.status === 200 && result.body.data?.refreshToken) {
            res.cookie("refreshToken", result.body.data.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 1 * 24 * 60 * 60 * 1000, // 1 día
            });
            delete result.body.data.refreshToken;
        }
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
        console.error("Error en la configuración del factor de dos pasos:", error);
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
        console.error("Error al verificar el factor de dos pasos:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.validateTwoFactorAuth = async (req, res) => {
    try {
        const result = await authService.validateTwoFactorAuth(req);
        if (result.status === 200 && result.body.data?.refreshToken) {
            res.cookie("refreshToken", result.body.data.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 1 * 24 * 60 * 60 * 1000, // 1 día
            });
            delete result.body.data.refreshToken;
        }
        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error("Error al validar el factor de dos pasos:", error);
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
        console.error("Error al obtener el estado del factor de dos pasos:", error);
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
        console.error("Error al deshabilitar el factor de dos pasos:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        const ipAddress = getClientIp(req);
        const result = await authService.refreshSession(token, ipAddress);

        if (result.status === 200 && result.body.data?.refreshToken) {
            res.cookie("refreshToken", result.body.data.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 1 * 24 * 60 * 60 * 1000, // 1 día
            });
            delete result.body.data.refreshToken;
        } else if (result.status === 401 || result.status === 403) {
            res.clearCookie("refreshToken", COOKIE_OPTIONS);
        }
        return res.status(result.status).json(result.body);
    } catch (err) {
        console.error("Refresh token error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        const result = await authService.logout(token);
        res.clearCookie("refreshToken", COOKIE_OPTIONS);
        return res.status(result.status).json(result.body);
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
