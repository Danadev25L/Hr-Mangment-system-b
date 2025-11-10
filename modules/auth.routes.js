import express from 'express';

import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users } from '../db/schema.js';

const router = express.Router();

// Public authentication routes (no auth required)

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user by username
        const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        const user = userRecord[0];

        // Use generic error message to prevent username enumeration
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check if user is active
        if (!user.active && user.active !== undefined) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password' // Don't reveal account status
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Verify JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET not configured!');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                departmentId: user.departmentId,
                            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response (no sensitive data)
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                fullname: user.fullName, // For compatibility
                role: user.role,
                departmentId: user.departmentId,
                                active: user.active
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, email } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and full name are required'
            });
        }

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate employee code
        const lastUser = await db
            .select()
            .from(users)
            .orderBy(users.id)
            .limit(1);

        let employeeCode = 'EMP-0001';
        if (lastUser.length > 0 && lastUser[0].employeeCode) {
            const lastNumber = parseInt(lastUser[0].employeeCode.split('-')[1]) || 0;
            employeeCode = `EMP-${String(lastNumber + 1).padStart(4, '0')}`;
        }

        // Create new user
        const [newUser] = await db
            .insert(users)
            .values({
                username,
                password: hashedPassword,
                fullName,
                employeeCode,
                role: 'ROLE_EMPLOYEE',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET not configured!');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                departmentId: newUser.departmentId,
                            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                fullName: newUser.fullName,
                fullname: newUser.fullName,
                role: newUser.role,
                departmentId: newUser.departmentId,
                organizationId: newUser.organizationId,
                active: newUser.active
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    // For JWT tokens, logout is mainly a client-side operation
    // The token will expire on its own and can't be revoked from the server
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

export default router;