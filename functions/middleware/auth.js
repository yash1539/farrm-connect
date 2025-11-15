// Authentication middleware to verify JWT tokens

const { verifyToken } = require('../utils/jwt');
const { db } = require('../firebase');

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error.message || 'Invalid or expired token',
        details: process.env.NODE_ENV === 'development' ? {
          errorName: error.name,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        } : undefined
      });
    }

    // Get user details from database
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      fullName: userData.fullName || userData.name || 'Unknown'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

module.exports = {
  authenticate
};

