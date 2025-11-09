// Validation middleware for authentication endpoints

const validateSignup = (req, res, next) => {
  const errors = [];
  const { fullName, phoneNumber, email, password, confirmPassword, userType } = req.body;

  // Full Name validation
  if (!fullName || typeof fullName !== 'string') {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  } else if (fullName.length < 2 || fullName.length > 100) {
    errors.push({ field: 'fullName', message: 'Full name must be between 2 and 100 characters' });
  }

  // Phone Number validation
  const phoneRegex = /^[6-9][0-9]{9}$/;
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (!phoneRegex.test(phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be 10 digits starting with 6-9' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  // Confirm Password validation
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push({ field: 'confirmPassword', message: 'Confirm password is required' });
  } else if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  next();
};

const validateSignin = (req, res, next) => {
  const errors = [];
  const { loginMethod, email, password, phoneNumber, otp } = req.body;

  if (!loginMethod || !['email', 'phone'].includes(loginMethod)) {
    errors.push({ field: 'loginMethod', message: 'Login method must be either "email" or "phone"' });
  }

  if (loginMethod === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required for email login' });
    } else if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (!password || typeof password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required for email login' });
    }
  } else if (loginMethod === 'phone') {
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      errors.push({ field: 'phoneNumber', message: 'Phone number is required for phone login' });
    } else if (!phoneRegex.test(phoneNumber)) {
      errors.push({ field: 'phoneNumber', message: 'Phone number must be 10 digits starting with 6-9' });
    }
    if (!otp || typeof otp !== 'string') {
      errors.push({ field: 'otp', message: 'OTP is required for phone login' });
    } else if (!/^\d{4,6}$/.test(otp)) {
      errors.push({ field: 'otp', message: 'OTP must be 4-6 digits' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  next();
};

const validateSendOTP = (req, res, next) => {
  const errors = [];
  const { phoneNumber } = req.body;
  const phoneRegex = /^[6-9][0-9]{9}$/;

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (!phoneRegex.test(phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be 10 digits starting with 6-9' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  next();
};

const validateVerifyOTP = (req, res, next) => {
  const errors = [];
  const { phoneNumber, otp } = req.body;
  const phoneRegex = /^[6-9][0-9]{9}$/;

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else if (!phoneRegex.test(phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Phone number must be 10 digits starting with 6-9' });
  }

  if (!otp || typeof otp !== 'string') {
    errors.push({ field: 'otp', message: 'OTP is required' });
  } else if (!/^\d{4,6}$/.test(otp)) {
    errors.push({ field: 'otp', message: 'OTP must be 4-6 digits' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  next();
};

module.exports = {
  validateSignup,
  validateSignin,
  validateSendOTP,
  validateVerifyOTP
};

