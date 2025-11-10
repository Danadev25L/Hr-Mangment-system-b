/**
 * Password Strength Validator
 * Ensures passwords meet security requirements
 */

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @throws {Error} If password doesn't meet requirements
 * @returns {boolean} True if password is valid
 */
export const validatePasswordStrength = (password) => {
    const errors = [];
    
    // Minimum length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    // Maximum length check (prevent DoS)
    if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }
    
    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    // Number check
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    // Special character check
    if (!/[@$!%*?&^#()]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&^#())');
    }
    
    // If there are errors, throw them
    if (errors.length > 0) {
        throw new Error(errors.join('. ') + '.');
    }
    
    return true;
};

/**
 * Checks if password is in common passwords list
 * @param {string} password - The password to check
 * @throws {Error} If password is too common
 * @returns {boolean} True if password is not common
 */
export const checkCommonPasswords = (password) => {
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty', 'qwerty123',
        'admin', 'admin123', 'welcome', 'Welcome1!', 'Password1!',
        'Password@1', 'Qwerty1!', 'Abc123!@#', 'letmein', 'monkey',
        '111111', '123123', '1234567890', 'password1', 'Pass@123',
        'Admin@123', 'Password123!', 'Welcome@123'
    ];
    
    // Case-insensitive comparison
    const lowerPassword = password.toLowerCase();
    
    if (commonPasswords.some(common => lowerPassword === common.toLowerCase())) {
        throw new Error('This password is too common. Please choose a stronger, more unique password.');
    }
    
    return true;
};

/**
 * Validates password with all checks
 * @param {string} password - The password to validate
 * @returns {object} Validation result with success flag and message
 */
export const validatePassword = (password) => {
    try {
        validatePasswordStrength(password);
        checkCommonPasswords(password);
        
        return {
            success: true,
            message: 'Password meets all security requirements'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

/**
 * Middleware for password validation
 */
export const passwordValidationMiddleware = (req, res, next) => {
    const password = req.body.password || req.body.newPassword;
    
    if (!password) {
        return next(); // Skip if no password field
    }
    
    try {
        validatePasswordStrength(password);
        checkCommonPasswords(password);
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export default {
    validatePasswordStrength,
    checkCommonPasswords,
    validatePassword,
    passwordValidationMiddleware
};
