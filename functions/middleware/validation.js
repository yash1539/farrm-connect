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

// Validation for sell product
const validateSellProduct = (req, res, next) => {
  const errors = {};
  const {
    name,
    description,
    category,
    price,
    unit,
    quantity,
    stock,
    image
  } = req.body;

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.name = 'Product name is required';
  } else if (name.length > 200) {
    errors.name = 'Product name must be less than 200 characters';
  }

  // Description validation
  if (description && typeof description === 'string' && description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  // Category validation
  const validCategories = ['grains', 'vegetables', 'fruits', 'pulses', 'spices', 'other'];
  if (!category || typeof category !== 'string') {
    errors.category = 'Category is required';
  } else if (!validCategories.includes(category)) {
    errors.category = `Category must be one of: ${validCategories.join(', ')}`;
  }

  // Price validation
  if (price === undefined || price === null) {
    errors.price = 'Price is required';
  } else if (typeof price !== 'number' || price <= 0) {
    errors.price = 'Price must be a number greater than 0';
  }

  // Unit validation
  const validUnits = ['kg', 'quintal', 'ton', 'bag', 'piece'];
  if (!unit || typeof unit !== 'string') {
    errors.unit = 'Unit is required';
  } else if (!validUnits.includes(unit)) {
    errors.unit = `Unit must be one of: ${validUnits.join(', ')}`;
  }

  // Quantity validation
  if (quantity === undefined || quantity === null) {
    errors.quantity = 'Quantity is required';
  } else if (typeof quantity !== 'number' || quantity <= 0) {
    errors.quantity = 'Quantity must be a number greater than 0';
  }

  // Stock validation
  if (stock === undefined || stock === null) {
    errors.stock = 'Stock is required';
  } else if (typeof stock !== 'number' || stock <= 0) {
    errors.stock = 'Stock must be a number greater than 0';
  }

  // Image URL validation (if provided)
  if (image && typeof image === 'string') {
    try {
      new URL(image);
    } catch (e) {
      errors.image = 'Image must be a valid URL';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid input data',
      errors
    });
  }

  next();
};

// Validation for profile update
const validateProfileUpdate = (req, res, next) => {
  const errors = {};
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

  // Full Name validation (required)
  if (fullName !== undefined) {
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      errors.fullName = 'Full name is required and cannot be empty';
    } else if (fullName.length < 2 || fullName.length > 100) {
      errors.fullName = 'Full name must be between 2 and 100 characters';
    }
  }

  // Phone Number validation
  if (phoneNumber !== undefined) {
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(phoneNumber)) {
      errors.phoneNumber = 'Phone number must be 10 digits starting with 6-9';
    }
  }

  // Email validation
  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && typeof email === 'string' && !emailRegex.test(email)) {
      errors.email = 'Invalid email format';
    }
  }

  // PIN Code validation
  if (pinCode !== undefined) {
    const pinRegex = /^\d{6}$/;
    if (pinCode && typeof pinCode === 'string' && !pinRegex.test(pinCode)) {
      errors.pinCode = 'PIN code must be exactly 6 digits';
    }
  }

  // IFSC Code validation
  if (ifscCode !== undefined) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (ifscCode && typeof ifscCode === 'string') {
      const upperIfsc = ifscCode.toUpperCase();
      if (!ifscRegex.test(upperIfsc)) {
        errors.ifscCode = 'IFSC code must be 11 characters in format: AAAA0XXXXXX';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      errors
    });
  }

  next();
};

module.exports = {
  validateSignup,
  validateSignin,
  validateSendOTP,
  validateVerifyOTP,
  validateSellProduct,
  validateProfileUpdate
};
