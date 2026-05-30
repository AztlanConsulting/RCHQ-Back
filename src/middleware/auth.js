const jwt = require("jsonwebtoken");
const User = require("../model/auth/auth.model");
const { decodeToken } = require("../utils/jwt");

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tokenType !== "SESSION") {
            return res
                .status(403)
                .json({ success: false, message: "Token de sesión inválido" });
        }

        if (decoded.sessionId) {
            const employeeId = decoded.id || decoded.employeeId;
            const employee = await User.getEmployeeById(employeeId);
            const activeRefreshToken = decodeToken(employee?.refreshToken);

            if (
                !employee?.refreshToken ||
                activeRefreshToken?.sessionId !== decoded.sessionId
            ) {
                return res
                    .status(401)
                    .json({ success: false, message: "SesiÃ³n no activa" });
            }
        }

        req.user = decoded;
        next();
    } catch {
        return res
            .status(401)
            .json({ success: false, message: "Token inválido o expirado" });
    }
};

module.exports = verifyToken;
