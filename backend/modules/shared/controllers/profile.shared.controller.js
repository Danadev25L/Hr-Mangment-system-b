import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { users, personalInformation, departments } from '../../../db/schema.js';

// Get current user profile (works for any authenticated user)
export const getCurrentUserProfile = async (req, res) => {
    try {
        const authData = req.authData;

        if (!authData || !authData.id) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        // Get user basic info
        const [user] = await db.select()
            .from(users)
            .where(eq(users.id, authData.id))
            .limit(1);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get personal information
        const [personalInfo] = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, user.id))
            .limit(1);

        // Get department if assigned
        let department = null;
        if (user.departmentId) {
            [department] = await db.select()
                .from(departments)
                .where(eq(departments.id, user.departmentId))
                .limit(1);
        }

        // Format response
        const userProfile = {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            employeeCode: user.employeeCode,
            jobTitle: user.jobTitle,
            role: user.role,
            active: user.active,
            departmentId: user.departmentId,
            department: department,
                        jobId: user.jobId,
            baseSalary: user.baseSalary,
            personalInformation: personalInfo || {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                country: '',
                dateOfBirth: null,
                gender: '',
                maritalStatus: ''
            },
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            data: userProfile
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while retrieving user profile."
        });
    }
};