const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { decodeToken } = require("./jwt");

exports.apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    skip: (req) => process.env.NODE_ENV === "test",
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
                    const decoded = decodeToken(token);

                if (
                    decoded &&
                    decoded.tokenType === "SESSION" &&
                    (decoded.id || decoded.employeeId)
                ) {
                    return decoded.id || decoded.employeeId;
                }
            } catch (error) {}
        }
        return req.ip;

        //return ipKeyGenerator(req, res); // Quitar comentario en produccion
    },
});

exports.authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    skip: (req) => process.env.NODE_ENV === "test",
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
                const decoded = decodeToken(token);
                if (decoded && (decoded.id || decoded.employeeId)) {
                    return decoded.id || decoded.employeeId;
                }
            } catch (error) {}
        }

        return req.ip;
        //return ipKeyGenerator(req, res); // Quitar comentario en produccion
    },
});
