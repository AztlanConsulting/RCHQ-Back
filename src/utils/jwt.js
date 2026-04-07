const jwt = require('jsonwebtoken');
const { role } = require('../model/user.model');
const jwtSecret = process.env.JWT_SECRET;
const expiresIn = '1h';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      privileges: user.privileges,
    },
    jwtSecret,
    {expiresIn: expiresIn}
  );
};

const decodeToken = (token) => {
  if (!token || !jwtSecret) {
    return null;
  }
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

module.exports = {
  generateToken,
  decodeToken
};
