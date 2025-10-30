import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

import { db } from '../../../db/index.js';
import { personalInformation, users } from '../../../db/schema.js';
import { validatePasswordStrength, checkCommonPasswords } from '../../../utils/passwordValidator.js';

// Employee: Get own personal information
export const getMyPersonalInfo = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        const personalInfo = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, userId))
            .limit(1);

        if (personalInfo.length > 0) {
            res.json(personalInfo[0]);
        } else {
            // Return empty structure if no personal info exists yet
            res.json({
                userId: userId,
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                country: '',
                dateOfBirth: null,
                gender: '',
                maritalStatus: ''
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error retrieving personal information"
        });
    }
};

// Employee: Create personal information
export const createMyPersonalInfo = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                message: "Content cannot be empty!"
            });
        }

        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        if (!req.body.firstName || !req.body.lastName) {
            return res.status(400).json({
                message: "First name and last name are required!"
            });
        }

        const existing = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, userId))
            .limit(1);

        if (existing.length > 0) {
            return res.status(403).json({
                message: "Personal information already exists. Use update instead."
            });
        }

        const [info] = await db.insert(personalInformation)
            .values({
                userId: userId,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email?.trim() || null,
                address: req.body.address?.trim() || null,
                city: req.body.city?.trim() || null,
                country: req.body.country?.trim() || null,
                dateOfBirth: req.body.dateOfBirth && req.body.dateOfBirth.trim() ? new Date(req.body.dateOfBirth) : null,
                gender: req.body.gender?.trim() || null,
                maritalStatus: req.body.maritalStatus?.trim() || null
            })
            .returning();

        res.json({
            message: "Personal information created successfully!",
            data: info
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error creating personal information"
        });
    }
};

// Employee: Update own personal information
export const updateMyPersonalInfo = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        const existing = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, userId))
            .limit(1);

        const updateData = {};
        if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
        if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
        if (req.body.email !== undefined) updateData.email = req.body.email?.trim() || null;
        if (req.body.address !== undefined) updateData.address = req.body.address?.trim() || null;
        if (req.body.city !== undefined) updateData.city = req.body.city?.trim() || null;
        if (req.body.country !== undefined) updateData.country = req.body.country?.trim() || null;
        if (req.body.dateOfBirth !== undefined) {
            updateData.dateOfBirth = req.body.dateOfBirth && req.body.dateOfBirth.trim() ? new Date(req.body.dateOfBirth) : null;
        }
        if (req.body.gender !== undefined) updateData.gender = req.body.gender?.trim() || null;
        if (req.body.maritalStatus !== undefined) updateData.maritalStatus = req.body.maritalStatus?.trim() || null;

        updateData.updatedAt = new Date();

        if (existing.length > 0) {
            const [updatedInfo] = await db.update(personalInformation)
                .set(updateData)
                .where(eq(personalInformation.userId, userId))
                .returning();

            res.json({
                message: "Personal information updated successfully!",
                data: updatedInfo
            });
        } else {
            updateData.userId = userId;
            const [newInfo] = await db.insert(personalInformation)
                .values(updateData)
                .returning();

            res.json({
                message: "Personal information created successfully!",
                data: newInfo
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error updating personal information"
        });
    }
};

// Employee: Change own password
export const changeMyPassword = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Old and new password required" });
        }

        // Validate new password strength using our comprehensive validator
        try {
            validatePasswordStrength(newPassword);
            checkCommonPasswords(newPassword);
        } catch (validationError) {
            return res.status(400).json({ 
                message: validationError.message 
            });
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Use bcrypt to compare passwords
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Old password incorrect" });
        }

        // Hash the new password before storing
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: "Error changing password" });
    }
};