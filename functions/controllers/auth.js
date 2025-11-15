const { db, admin } = require('../firebase');
const bcrypt = require('bcrypt');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { generateOTP, storeOTP, getAndVerifyOTP, checkOTPExists } = require('../utils/otp');

// Sign Up endpoint
exports.signup = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password, confirmPassword, userType, merchantType } = req.body;

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

    // Determine final user type
    const finalUserType = userType || 'farmer';

    // Create user document
    const userData = {
      fullName,
      phoneNumber,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType: finalUserType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isVerified: false
    };

    // Add merchant type if user is merchant
    if (finalUserType === 'merchant' && merchantType) {
      userData.merchantType = merchantType.toUpperCase(); // M1, M2, or M3
    }

    const userRef = await db.collection('users').add(userData);
    const userId = userRef.id;

    // Generate JWT token
    const tokens = generateTokens({
      userId,
      email: email.toLowerCase(),
      userType: finalUserType
    });

    // Return user data (without password)
    const userResponse = {
      userId,
      fullName,
      phoneNumber,
      email: email.toLowerCase(),
      userType: finalUserType,
      isVerified: false
    };

    // Add merchantType to response if merchant
    if (finalUserType === 'merchant' && merchantType) {
      userResponse.merchantType = merchantType.toUpperCase();
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: userResponse,
      token: tokens.accessToken, // Return access token directly
      tokens: tokens // Also return full tokens object
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
        token: tokens.accessToken, // Return access token directly for convenience
        tokens: tokens // Also return full tokens object
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
        token: tokens.accessToken, // Return access token directly
        tokens: tokens // Also return full tokens object
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

// Refresh Token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'Refresh token is missing'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken, true); // true indicates it's a refresh token
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: error.message || 'Refresh token verification failed'
      });
    }

    // Get user details
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      });
    }

    const userData = userDoc.data();

    // Generate new tokens
    const tokens = generateTokens({
      userId: decoded.userId,
      email: userData.email,
      userType: userData.userType
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: tokens.accessToken,
      tokens: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
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

// Get My Profile endpoint (authenticated user only)
exports.getMe = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
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

    // Format response data
    const responseData = {
      userId: doc.id,
      fullName: userData.fullName || '',
      phoneNumber: userData.phoneNumber || '',
      email: userData.email || '',
      pinCode: userData.pinCode || userData.pincode || '',
      village: userData.village || '',
      city: userData.city || '',
      state: userData.state || '',
      bankAccountNumber: userData.bankAccountNumber || userData.bankAccount || userData.accountNumber || '',
      bankAddress: userData.bankAddress || '',
      ifscCode: userData.ifscCode || userData.ifsc || '',
      kisanCardNumber: userData.kisanCardNumber || userData.kisanCard || '',
      userType: userData.userType || 'farmer',
      isVerified: userData.isVerified || false,
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || '',
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || ''
    };

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Get me error:', error);
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
    // If authenticated, use userId from token, otherwise use query parameter
    const userId = req.user?.userId || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        error: 'userId query parameter is missing or user not authenticated'
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

    // Format response data
    const responseData = {
      userId: doc.id,
      fullName: userData.fullName || '',
      phoneNumber: userData.phoneNumber || '',
      email: userData.email || '',
      pinCode: userData.pinCode || userData.pincode || '',
      village: userData.village || '',
      city: userData.city || '',
      state: userData.state || '',
      bankAccountNumber: userData.bankAccountNumber || userData.bankAccount || userData.accountNumber || '',
      bankAddress: userData.bankAddress || '',
      ifscCode: userData.ifscCode || userData.ifsc || '',
      kisanCardNumber: userData.kisanCardNumber || userData.kisanCard || '',
      userType: userData.userType || 'farmer',
      isVerified: userData.isVerified || false,
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || '',
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || ''
    };

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: responseData
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

// Update Profile endpoint
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      fullName,
      phoneNumber,
      email,
      pinCode,
      village,
      city,
      state,
      bankAccountNumber,
      bankAddress,
      ifscCode,
      kisanCardNumber
    } = req.body;

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'NOT_FOUND'
      });
    }

    // Prepare update data (only include provided fields)
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (fullName !== undefined) {
      updateData.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber;
    }

    if (email !== undefined) {
      updateData.email = email.toLowerCase().trim();
    }

    if (pinCode !== undefined) {
      updateData.pinCode = pinCode;
      updateData.pincode = pinCode; // Also store as pincode for backward compatibility
    }

    if (village !== undefined) {
      updateData.village = village.trim();
    }

    if (city !== undefined) {
      updateData.city = city.trim();
    }

    if (state !== undefined) {
      updateData.state = state.trim();
    }

    if (bankAccountNumber !== undefined) {
      updateData.bankAccountNumber = bankAccountNumber;
      updateData.bankAccount = bankAccountNumber; // Also store as bankAccount for backward compatibility
      updateData.accountNumber = bankAccountNumber; // Also store as accountNumber
    }

    if (bankAddress !== undefined) {
      updateData.bankAddress = bankAddress.trim();
    }

    if (ifscCode !== undefined) {
      updateData.ifscCode = ifscCode.toUpperCase();
      updateData.ifsc = ifscCode.toUpperCase(); // Also store as ifsc for backward compatibility
    }

    if (kisanCardNumber !== undefined) {
      updateData.kisanCardNumber = kisanCardNumber;
      updateData.kisanCard = kisanCardNumber; // Also store as kisanCard for backward compatibility
    }

    // Update user document
    await db.collection('users').doc(userId).update(updateData);

    // Get updated user data
    const updatedDoc = await db.collection('users').doc(userId).get();
    const updatedData = updatedDoc.data();

    // Remove sensitive data from response
    delete updatedData.password;

    // Prepare response data
    const responseData = {
      userId: updatedDoc.id,
      fullName: updatedData.fullName || '',
      phoneNumber: updatedData.phoneNumber || '',
      email: updatedData.email || '',
      pinCode: updatedData.pinCode || updatedData.pincode || '',
      village: updatedData.village || '',
      city: updatedData.city || '',
      state: updatedData.state || '',
      bankAccountNumber: updatedData.bankAccountNumber || updatedData.bankAccount || updatedData.accountNumber || '',
      bankAddress: updatedData.bankAddress || '',
      ifscCode: updatedData.ifscCode || updatedData.ifsc || '',
      kisanCardNumber: updatedData.kisanCardNumber || updatedData.kisanCard || '',
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Update profile error:', error);
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
