const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const sessionExpiresIn = "1h";
const firstLoginExpiresIn = "15m";
const pre2faExpiresIn = "10m";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      privileges: user.privileges,
      tokenType: "SESSION",
    },
    jwtSecret,
    { expiresIn: sessionExpiresIn },
  );
};

const generateFirstLoginToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      purpose: "FIRST_LOGIN_CHANGE_PASSWORD",
      tokenType: "FIRST_LOGIN",
    },
    jwtSecret,
    { expiresIn: firstLoginExpiresIn },
  );
};

const generatePre2faToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      purpose: "LOGIN_2FA_PENDING",
      tokenType: "PRE_2FA",
    },
    jwtSecret,
    { expiresIn: pre2faExpiresIn },
  );
}

const decodeToken = (token) => {
  if (!token || !jwtSecret) {
    return null;
  }
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
};

module.exports = {
  generateToken,
  decodeToken,
  generateFirstLoginToken,
  generatePre2faToken,
};
