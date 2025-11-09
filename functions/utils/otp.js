// OTP generation and verification utilities

const bcrypt = require('bcrypt');
const { db, admin } = require('../firebase');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP before storing
const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

// Verify OTP
const verifyOTP = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};

// Store OTP in Firestore with expiration
const storeOTP = async (phoneNumber, otp) => {
  const hashedOTP = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const otpDoc = {
    phoneNumber,
    hashedOTP,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Store in 'otps' collection with phone number as document ID
  await db.collection('otps').doc(phoneNumber).set(otpDoc);
  
  return expiresAt;
};

// Get and verify OTP from Firestore
const getAndVerifyOTP = async (phoneNumber, otp) => {
  const otpDoc = await db.collection('otps').doc(phoneNumber).get();
  
  if (!otpDoc.exists) {
    return { valid: false, message: 'OTP not found or expired' };
  }

  const data = otpDoc.data();
  const now = new Date();
  const expiresAt = data.expiresAt.toDate();

  // Check if OTP expired
  if (now > expiresAt) {
    await db.collection('otps').doc(phoneNumber).delete();
    return { valid: false, message: 'OTP expired' };
  }

  // Check attempts (max 3)
  if (data.attempts >= 3) {
    await db.collection('otps').doc(phoneNumber).delete();
    return { valid: false, message: 'Maximum OTP verification attempts exceeded' };
  }

  // Verify OTP
  const isValid = await verifyOTP(otp, data.hashedOTP);
  
  if (isValid) {
    // Delete OTP after successful verification
    await db.collection('otps').doc(phoneNumber).delete();
    return { valid: true, message: 'OTP verified successfully' };
  } else {
    // Increment attempts
    await db.collection('otps').doc(phoneNumber).update({
      attempts: admin.firestore.FieldValue.increment(1)
    });
    return { valid: false, message: 'Invalid OTP' };
  }
};

// Check if OTP exists and is valid (for resend prevention)
const checkOTPExists = async (phoneNumber) => {
  const otpDoc = await db.collection('otps').doc(phoneNumber).get();
  
  if (!otpDoc.exists) {
    return false;
  }

  const data = otpDoc.data();
  const now = new Date();
  const expiresAt = data.expiresAt.toDate();

  return now <= expiresAt;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  storeOTP,
  getAndVerifyOTP,
  checkOTPExists
};

