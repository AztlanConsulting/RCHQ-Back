const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.tokenType !== "SESSION") {
      return res
        .status(403)
        .json({ success: false, message: "Token de sesión inválido" });
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
