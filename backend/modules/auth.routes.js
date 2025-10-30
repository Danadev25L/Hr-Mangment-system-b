import express from 'express';

import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

import { eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { users, } from '../db/schema.js';

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
                organizationId: user.organizationId
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
                organizationId: user.organizationId,
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

export default router;