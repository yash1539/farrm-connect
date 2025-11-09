// JWT token utilities

const jwt = require('jsonwebtoken');

// In production, use environment variables for secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

const generateAccessToken = (payload) => {
  return jwt.sign(
    { 
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { 
      userId: payload.userId,
      type: 'refresh' 
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const generateTokens = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer'
  };
};

const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken
};

