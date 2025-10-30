import createError from 'http-errors';

import express from 'express';

import path from 'path';

import cookieParser from 'cookie-parser';

import logger from 'morgan';

import cors from 'cors';

import { fileURLToPath } from 'url';

import { dirname } from 'path';

import dotenv from 'dotenv';

import { checkToken, verifyToken } from './withAuth.js';

import {
  securityHeaders,
  apiRateLimit,
  speedLimiter,
  sanitizeInput,
  preventHPP,
  requestSizeLimit,
  corsOptions,
  securityLogger,
  filterSensitiveData,
  validateJWTSecurity
} from './middleware/security.js';
import authRoutes from './modules/auth.routes.js';
import moduleRoutes from './modules/index.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

// Trust proxy - required for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Security middleware - Apply FIRST
app.use(securityHeaders);
app.use(securityLogger);
app.use(validateJWTSecurity);

// CORS configuration with enhanced security
app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware setup with security enhancements
app.use(logger('combined')); // More comprehensive logging
app.use(express.json(requestSizeLimit.json));
app.use(express.urlencoded(requestSizeLimit.urlencoded));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Security middleware
app.use(sanitizeInput); // NoSQL injection protection
app.use(preventHPP); // HTTP parameter pollution protection
app.use(apiRateLimit); // General API rate limiting
app.use(speedLimiter); // Progressive delay middleware
app.use(filterSensitiveData); // Remove sensitive data from responses

// Public authentication routes (no auth required)
app.use('/auth', authRoutes);

// Token verification endpoint
app.get('/checkToken', checkToken);

// Protected API routes with proper role-based structure
// JWT authentication is applied to all API routes
app.use('/api', verifyToken, moduleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HRS API Server is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to HRS API',
    version: '2.0.0',
    endpoints: {
      admin: '/api/admin/*',
      manager: '/api/manager/*',
      employee: '/api/employee/*',
      shared: '/api/shared/*'
    }
  });
});

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

export default app;
