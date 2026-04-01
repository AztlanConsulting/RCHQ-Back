const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if(authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];

    if(!token) {
      return res.status(401).json({message: 'No token provided'});
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(400).json({message: 'Invalid token'});
    }
  }else {
    return res.status(401).json({message: 'No token provided'});
  }
};

module.exports = verifyToken;
