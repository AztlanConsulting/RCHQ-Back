const jwt = require("jsonwebtoken");
const User = require("../model/auth/auth.model");
const {
    buildSessionTimestamps,
    isSessionRenewable,
} = require("../utils/auth/sessionPolicy");

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
            const session = await User.findSessionById(decoded.sessionId);

            if (
                !session ||
                session.employeeId !== employeeId ||
                !isSessionRenewable(session) ||
                !session.employee?.isActive
            ) {
                return res
                    .status(401)
                    .json({ success: false, message: "Sesión no activa" });
            }

            await User.touchSession(
                session.sessionId,
                buildSessionTimestamps(),
            );
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
