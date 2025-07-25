import jwt from "jsonwebtoken";
import { jwtSecret, jwtExpiration } from "../config/db.js";


export const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { 
    expiresIn: jwtExpiration 
  });
};

export const verifyToken = (req, res, next) => {
  let token;
  let authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        status: 401, 
        message: "Access token is required" 
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      console.log('Token verified for user:', decoded.userId);
      next();
    } catch (err) {
      console.error('Token verification failed:', err.message); 
      return res.status(403).json({ 
        status: 403, 
        message: "Invalid or expired token" 
      });
    }
  } else {
    return res.status(401).json({ 
      status: 401, 
      message: "Authorization header must start with Bearer" 
    });
  }
};


export const requireAdmin = (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({
      status: 403,
      message: "Admin yetkisi gerekli. Sadece role_id: 1 olan kullanıcılar erişebilir."
    });
  }
  next();
};
