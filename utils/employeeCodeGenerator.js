import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

/**
 * Generates a unique employee code based on role
 * @param {string} role - The user role (ROLE_ADMIN, ROLE_MANAGER, ROLE_EMPLOYEE)
 * @returns {Promise<string>} - A unique employee code
 */
export async function generateEmployeeCode(role = 'ROLE_EMPLOYEE') {
    const prefix = role === 'ROLE_ADMIN' ? 'ADM' : role === 'ROLE_MANAGER' ? 'MGR' : 'EMP';
    let attempts = 0;
    const maxAttempts = 10;

    do {
        // Get the last user with this role to determine the next number
        const lastUser = await db.select()
            .from(users)
            .where(eq(users.role, role))
            .orderBy(desc(users.id))
            .limit(1);

        let employeeCode;
        if (lastUser.length > 0 && lastUser[0].employeeCode) {
            // Extract number from last code and increment
            const lastNumber = parseInt(lastUser[0].employeeCode.split('-')[1]) || 0;
            employeeCode = `${prefix}-${String(lastNumber + 1 + attempts).padStart(4, '0')}`;
        } else {
            // First user of this role
            employeeCode = `${prefix}-0001`;
        }

        // Ensure uniqueness
        const existingCode = await db.select()
            .from(users)
            .where(eq(users.employeeCode, employeeCode))
            .limit(1);

        if (existingCode.length === 0) {
            console.log(`Generated employee code: ${employeeCode} for role: ${role}`);
            return employeeCode;
        }

        attempts++;
    } while (attempts < maxAttempts);

    // Fallback: generate a unique code based on timestamp if all else fails
    const timestamp = Date.now().toString().slice(-4);
    const fallbackCode = `${prefix}-${timestamp}`;
    console.log(`Generated fallback employee code: ${fallbackCode} for role: ${role}`);
    return fallbackCode;
}

/**
 * Validates an employee code format
 * @param {string} employeeCode - The employee code to validate
 * @returns {boolean} - Whether the code is valid
 */
export function validateEmployeeCode(employeeCode) {
    if (!employeeCode || typeof employeeCode !== 'string') {
        return false;
    }

    // Expected format: XXX-NNNN (where X is letter and N is number)
    const pattern = /^[A-Z]{3}-\d{4}$/;
    return pattern.test(employeeCode);
}

/**
 * Extracts role from employee code
 * @param {string} employeeCode - The employee code
 * @returns {string|null} - The role prefix or null if invalid
 */
export function extractRoleFromEmployeeCode(employeeCode) {
    if (!validateEmployeeCode(employeeCode)) {
        return null;
    }

    const prefix = employeeCode.split('-')[0];
    switch (prefix) {
        case 'ADM':
            return 'ROLE_ADMIN';
        case 'MGR':
            return 'ROLE_MANAGER';
        case 'EMP':
            return 'ROLE_EMPLOYEE';
        default:
            return null;
    }
}