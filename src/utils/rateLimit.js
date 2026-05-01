const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const jwt = require("jsonwebtoken");

exports.apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message:
            "Estás haciendo demasiadas consultas muy rápido. Inténtalo más tarde.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false },

    keyGenerator: (req, res) => {
        const authHeader =
            req.headers.authorization || req.headers.Authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];

            try {
                const decoded = jwt.decode(token);

                if (
                    decoded &&
                    decoded.tokenType === "SESSION" &&
                    decoded.employeeId
                ) {
                    return decoded.employeeId;
                }
            } catch (error) {}
        }
        // Solo para es para las pruebas
        if (process.env.NODE_ENV === "test") {
            return req.ip;
        }
        return req.ip;

        //return ipKeyGenerator(req, res); // Quitar comentario en produccion
    },
});

exports.authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message:
            "Estás haciendo demasiadas consultas muy rápido. Inténtalo más tarde.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false },

    keyGenerator: (req) => {
        if (req.body && req.body.email) {
            return req.body.email;
        }

        const authHeader =
            req.headers.authorization || req.headers.Authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.email) {
                    return decoded.email;
                }
            } catch (error) {}
        }

        if (process.env.NODE_ENV === "test") {
            return req.ip;
        }

        return req.ip;
        //return ipKeyGenerator(req, res); // Quitar comentario en produccion
    },
});
