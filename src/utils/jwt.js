const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const sessionExpiresIn = "1h";
const firstLoginExpiresIn = "15m";
const preTwoFactorAuthExpiresIn = "10m";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      houseId: user.houseId,
      privileges: user.privileges || [],
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

const generatePreTwoFactorAuthToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tokenType: "PRE_TwoFactorAuth",
    },
    jwtSecret,
    { expiresIn: preTwoFactorAuthExpiresIn },
  );
};

const decodeToken = (token) => {
  if (!token) {
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
  generatePreTwoFactorAuthToken,
};
