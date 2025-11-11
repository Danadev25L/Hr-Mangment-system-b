import helmet from 'helmet';

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import slowDown from 'express-slow-down';

import validator from 'express-validator';

import mongoSanitize from 'express-mongo-sanitize';

import hpp from 'hpp';

/**
 * Security Middleware Configuration
 * Implements comprehensive security measures for the HRS API
 */

// 1. Security Headers with Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// 2. Rate Limiting for Login Attempts (Brute Force Protection)
export const loginRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' 
    ? parseInt(process.env.RATE_LIMIT_MAX) || 5 // 5 attempts in production
    : parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 attempts in development
  message: {
    error: 'Too many login attempts. Please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => ipKeyGenerator(req) + '-' + (req.body.username || 'anonymous')
});

// 3. General API Rate Limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 in dev, 100 in production
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. Slow Down Middleware (Progressive delays)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Use new recommended behavior
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  message: {
    error: 'Too many requests. Request processing delayed.',
    delay: '{{delay}}ms'
  }
});

// 5. Input Sanitization (NoSQL Injection Protection)
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential NoSQL injection attempt detected: ${key} from IP: ${req.ip}`);
  }
});

// 6. HTTP Parameter Pollution Protection
export const preventHPP = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'filter'] // Allow these parameters to have multiple values
});

// 7. Request Size Limiting
export const requestSizeLimit = {
  json: { limit: '10mb' }, // Reduce from 50mb to 10mb
  urlencoded: { limit: '10mb', extended: false }
};

// 8. CORS Security Configuration
export const corsOptions = {
  origin: (origin, callback) => {
    // Define allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://hr-mangment-system-f.vercel.app',
      'https://hr-mangment-system-6y8l5sy3y-bhjs-projects-7bb0cdc1.vercel.app'
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, be more permissive
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      // Allow any localhost origin in development
      console.log(`⚠️  DEV MODE: Allowing origin: ${origin}`);
      callback(null, true);
    } else if (origin.includes('vercel.app')) {
      // Allow all Vercel preview deployments
      console.log(`✅ Allowing Vercel deployment: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
};

// 9. Input Validation Helpers
export const validateInput = {
  // Email validation
  email: validator.body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation
  password: validator.body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),

  // Username validation
  username: validator.body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-30 characters, letters, numbers, dots, underscores and hyphens only'),

  // Numeric ID validation
  id: validator.param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),

  // Amount validation (for financial data)
  amount: validator.body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  // Date validation
  date: validator.body('date')
    .isISO8601()
    .withMessage('Please provide a valid date in ISO format')
};

// 10. Security Logging Middleware
export const securityLogger = (req, res, next) => {
  // Log security-relevant events
  const securityEvents = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  };

  // Log suspicious patterns
  if (req.originalUrl.includes('..') || 
      req.originalUrl.includes('<script>') || 
      req.originalUrl.includes('SELECT') ||
      req.originalUrl.includes('DROP')) {
    console.warn('🚨 Potential security threat detected:', securityEvents);
  }

  next();
};

// 11. Sensitive Data Filter (Remove passwords from responses)
export const filterSensitiveData = (req, res, next) => {
  // Skip filtering for auth endpoints that need to return tokens
  const skipPaths = ['/auth/login', '/auth/register', '/checkToken'];
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  const originalSend = res.send;
  
  res.send = function(body) {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        const filtered = removeSensitiveFields(parsed);
        return originalSend.call(this, JSON.stringify(filtered));
      } catch (e) {
        // If not JSON, return as is
        return originalSend.call(this, body);
      }
    }
    
    if (typeof body === 'object') {
      const filtered = removeSensitiveFields(body);
      return originalSend.call(this, JSON.stringify(filtered));
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Helper function to remove sensitive fields
const removeSensitiveFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeSensitiveFields(item));
  }
  
  const filtered = { ...obj };
  
  for (const field of sensitiveFields) {
    if (filtered[field]) {
      delete filtered[field];
    }
  }
  
  // Recursively filter nested objects
  Object.keys(filtered).forEach(key => {
    if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      filtered[key] = removeSensitiveFields(filtered[key]);
    }
  });
  
  return filtered;
};

// 12. JWT Security Validation
export const validateJWTSecurity = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Check for common JWT attacks
    const suspiciousPatterns = [
      'none', // Algorithm confusion
      'HS256', // If expecting RS256
      '..', // Path traversal
      '<', '>' // XSS attempts
    ];
    
    const tokenPayload = Buffer.from(token.split('.')[1] || '', 'base64').toString();
    
    for (const pattern of suspiciousPatterns) {
      if (tokenPayload.toLowerCase().includes(pattern.toLowerCase())) {
        console.warn('🚨 Suspicious JWT token detected:', { ip: req.ip, pattern });
        return res.status(401).json({ error: 'Invalid token format' });
      }
    }
  }
  
  next();
};

export default {
  securityHeaders,
  loginRateLimit,
  apiRateLimit,
  speedLimiter,
  sanitizeInput,
  preventHPP,
  requestSizeLimit,
  corsOptions,
  validateInput,
  securityLogger,
  filterSensitiveData,
  validateJWTSecurity
};