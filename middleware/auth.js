import jwt from 'jsonwebtoken';
import {JWT_SECRET} from '../config.js';

export const verifyToken = (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;

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

export default {verifyToken};