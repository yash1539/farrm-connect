// Simple in-memory rate limiter
// In production, consider using Redis or Firebase Realtime Database

const rateLimitStore = new Map();

const clearExpiredEntries = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.expiresAt < now) {
      rateLimitStore.delete(key);
    }
  }
};

// Clean up expired entries every 5 minutes
setInterval(clearExpiredEntries, 5 * 60 * 1000);

const checkRateLimit = (key, maxAttempts, windowMs) => {
  clearExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, {
      attempts: 1,
      expiresAt: now + windowMs
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.expiresAt < now) {
    rateLimitStore.set(key, {
      attempts: 1,
      expiresAt: now + windowMs
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.attempts >= maxAttempts) {
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter: Math.ceil((entry.expiresAt - now) / 1000)
    };
  }

  entry.attempts += 1;
  return { 
    allowed: true, 
    remaining: maxAttempts - entry.attempts 
  };
};

const rateLimitMiddleware = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // Use IP address or phone number as key
    const key = req.body.phoneNumber || req.ip || 'unknown';
    const result = checkRateLimit(key, maxAttempts, windowMs);

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        error: 'Too many attempts. Please try again later.',
        retryAfter: result.retryAfter
      });
    }

    // Add rate limit headers
    res.set('X-RateLimit-Limit', maxAttempts);
    res.set('X-RateLimit-Remaining', result.remaining);
    
    next();
  };
};

module.exports = {
  rateLimitMiddleware,
  checkRateLimit
};

