// Custom error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('❌ Error occurred:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // Development error handler - will print stacktrace
  if (process.env.NODE_ENV !== 'production') {
    return res.status(err.status || 500).json({
      message: err.message,
      error: err,
      stack: err.stack,
      path: req.path
    });
  }

  // Production error handler - no stacktraces leaked to user
  return res.status(err.status || 500).json({
    message: err.message,
    error: {}
  });
};

// 404 error handler
export const notFoundHandler = (req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

// Database error handler
export class DatabaseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.status = 500;
    this.originalError = originalError;
  }
}

// Validation error handler
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

// Authentication error handler
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }
}

// Authorization error handler
export class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 403;
  }
}