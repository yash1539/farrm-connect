const { db, admin } = require('../firebase');
const bcrypt = require('bcrypt');
const { generateTokens } = require('../utils/jwt');
const { generateOTP, storeOTP, getAndVerifyOTP, checkOTPExists } = require('../utils/otp');

// Sign Up endpoint
exports.signup = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password, confirmPassword, userType } = req.body;

    // Check if user already exists by email
    const emailQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!emailQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        error: 'Email is already registered'
      });
    }

    // Check if user already exists by phone number
    const phoneQuery = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (!phoneQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        error: 'Phone number is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document
    const userData = {
      fullName,
      phoneNumber,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType: userType || 'farmer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isVerified: false
    };

    const userRef = await db.collection('users').add(userData);
    const userId = userRef.id;

    // Generate JWT token
    const tokens = generateTokens({
      userId,
      email: email.toLowerCase(),
      userType: userType || 'farmer'
    });

    // Return user data (without password)
    const userResponse = {
      userId,
      fullName,
      phoneNumber,
      email: email.toLowerCase(),
      userType: userType || 'farmer',
      isVerified: false
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: userResponse,
      token: tokens.accessToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Sign In endpoint
exports.signin = async (req, res) => {
  try {
    const { loginMethod, email, password, phoneNumber, otp } = req.body;

    if (loginMethod === 'email') {
      // Email/Password login
      const emailQuery = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (emailQuery.empty) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'Invalid email or password'
        });
      }

      const userDoc = emailQuery.docs[0];
      const userData = userDoc.data();

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: 'Invalid email or password'
        });
      }

      // Generate tokens
      const tokens = generateTokens({
        userId: userDoc.id,
        email: userData.email,
        userType: userData.userType
      });

      // Return user data (without password)
      const userResponse = {
        userId: userDoc.id,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        userType: userData.userType,
        isVerified: userData.isVerified || false
      };

      return res.status(200).json({
        success: true,
        message: 'Sign in successful',
        data: userResponse,
        token: tokens
      });
    } else if (loginMethod === 'phone') {
      // Phone/OTP login
      const phoneQuery = await db.collection('users')
        .where('phoneNumber', '==', phoneNumber)
        .limit(1)
        .get();

      if (phoneQuery.empty) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'Phone number not registered'
        });
      }

      // Verify OTP
      const otpVerification = await getAndVerifyOTP(phoneNumber, otp);
      if (!otpVerification.valid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid OTP',
          error: otpVerification.message
        });
      }

      const userDoc = phoneQuery.docs[0];
      const userData = userDoc.data();

      // Generate tokens
      const tokens = generateTokens({
        userId: userDoc.id,
        email: userData.email,
        userType: userData.userType
      });

      // Return user data (without password)
      const userResponse = {
        userId: userDoc.id,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        userType: userData.userType,
        isVerified: userData.isVerified || false
      };

      return res.status(200).json({
        success: true,
        message: 'Sign in successful',
        data: userResponse,
        token: tokens
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid login method',
        error: 'Login method must be either "email" or "phone"'
      });
    }
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Send OTP endpoint
exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Check if OTP already exists and is valid
    const otpExists = await checkOTPExists(phoneNumber);
    if (otpExists) {
      return res.status(429).json({
        success: false,
        message: 'OTP already sent',
        error: 'Please wait before requesting a new OTP'
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = await storeOTP(phoneNumber, otp);

    // In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
    // For now, we'll just log it (remove in production!)
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phoneNumber,
        otpExpiresIn: 300 // 5 minutes in seconds
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Verify OTP endpoint
exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Verify OTP
    const otpVerification = await getAndVerifyOTP(phoneNumber, otp);
    
    if (!otpVerification.valid) {
      return res.status(401).json({
        success: false,
        message: 'OTP verification failed',
        error: otpVerification.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Get Profile endpoint
exports.getProfile = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        error: 'userId query parameter is missing'
      });
    }

    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      });
    }

    const userData = doc.data();
    // Remove password from response
    delete userData.password;

    return res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};

// Update Consent endpoint
exports.updateConsent = async (req, res) => {
  try {
    const { userId, consent } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        error: 'userId is missing'
      });
    }

    if (typeof consent !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid consent value',
        error: 'consent must be a boolean'
      });
    }

    await db.collection('users').doc(userId).update({
      consent,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      message: 'Consent updated successfully'
    });
  } catch (error) {
    console.error('Update consent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message || 'Something went wrong on the server'
    });
  }
};
