import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';

dotenv.config();

/**
 * Generates a JWT token for a user
 * @param {Object} user - The user object to encode in the token
 * @returns {string} - The JWT token
 */
export function generateToken(user) {
  // Remove sensitive information like password
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName
  };
  
  // Sign the token with the secret key and set expiration
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Token expires in 24 hours
  });
}

/**
 * Verifies a JWT token
 * @param {string} token - The token to verify
 * @returns {Object|null} - The decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}