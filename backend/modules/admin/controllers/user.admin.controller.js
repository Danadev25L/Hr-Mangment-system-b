import { eq, count as drizzleCount, and, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../../../db/index.js';
import { 
    users, 
    personalInformation, 
    departments, 
    jobs, 
    payments, 
    expenses, 
    daysHoliday, 
    daysWorking, 
    personalEvents, 
    messages,
    applications,
    salaryRecords,
    overtimeRecords,
    payrollRecords,
    payrollAdjustments,
    payrollBonuses,
    notifications,
    departmentAnnouncements
} from '../../../db/schema.js';
import { validatePasswordStrength, checkCommonPasswords } from '../../../utils/passwordValidator.js';

// Admin: Create new user
export const createUser = async (req, res) => {
    try {
        // SECURITY: Verify the requester is actually an admin by checking database
        const adminData = JSON.parse(req.headers.user || '{}');
        const adminId = adminData.id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin authentication required"
            });
        }

        // Verify admin exists in database and has ROLE_ADMIN
        const [adminUser] = await db.select()
            .from(users)
            .where(eq(users.id, adminId))
            .limit(1);

        if (!adminUser) {
            console.warn(`⚠️ Security Alert: Non-existent user ID ${adminId} attempted to create user`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Invalid admin credentials"
            });
        }

        if (adminUser.role !== 'ROLE_ADMIN') {
            console.warn(`⚠️ Security Alert: User ${adminUser.username} (ID: ${adminId}, Role: ${adminUser.role}) attempted to create user without admin privileges`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only administrators can create user accounts"
            });
        }

        if (!adminUser.active) {
            console.warn(`⚠️ Security Alert: Inactive admin ${adminUser.username} attempted to create user`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Admin account is inactive"
            });
        }

        // Log admin action for audit trail
        console.log(`✅ Admin ${adminUser.username} (ID: ${adminId}) is creating a new user account`);

        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Content cannot be empty!"
            });
        }

        // Validate required fields
        if (!req.body.username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (!req.body.fullname) {
            return res.status(400).json({
                success: false,
                message: "Full name is required"
            });
        }

        let hash = null;
        if (req.body.password) {
            // Validate password strength before hashing
            try {
                validatePasswordStrength(req.body.password);
                checkCommonPasswords(req.body.password);
            } catch (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError.message
                });
            }
            
            hash = bcrypt.hashSync(req.body.password.toString(), 10);
        }

        const existingUser = await db.select()
            .from(users)
            .where(eq(users.username, req.body.username))
            .limit(1);

        if (existingUser.length > 0) {
            return res.status(403).json({
                success: false,
                message: "Username already exists"
            });
        }

        const roleToUse = req.body.role && req.body.role.length > 0 ? req.body.role : 'ROLE_EMPLOYEE';
        
        // Security: Only admins can create other admins (extra check)
        if (roleToUse === 'ROLE_ADMIN') {
            console.log(`⚠️ Admin ${adminUser.username} is creating another admin account: ${req.body.username}`);
        }

        // Validation: Check if department already has a manager (if creating a manager)
        if (roleToUse === 'ROLE_MANAGER' && req.body.departmentId) {
            const existingManager = await db.select()
                .from(users)
                .where(
                    and(
                        eq(users.departmentId, parseInt(req.body.departmentId)),
                        eq(users.role, 'ROLE_MANAGER'),
                        eq(users.active, true)
                    )
                )
                .limit(1);

            if (existingManager.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `This department already has a manager: ${existingManager[0].fullName}. A department can only have one active manager.`
                });
            }
        }

        // Generate unique employee code
        const lastUser = await db.select()
            .from(users)
            .where(eq(users.role, roleToUse))
            .orderBy(desc(users.id))
            .limit(1);

        let employeeCode;
        const prefix = roleToUse === 'ROLE_ADMIN' ? 'ADM' : roleToUse === 'ROLE_MANAGER' ? 'MGR' : 'EMP';
        
        if (lastUser.length > 0 && lastUser[0].employeeCode) {
            // Extract number from last code and increment
            const lastNumber = parseInt(lastUser[0].employeeCode.split('-')[1]) || 0;
            employeeCode = `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
        } else {
            // First user of this role
            employeeCode = `${prefix}-0001`;
        }

        // Ensure uniqueness
        const existingCode = await db.select()
            .from(users)
            .where(eq(users.employeeCode, employeeCode))
            .limit(1);

        if (existingCode.length > 0) {
            // Generate a unique code based on total user count
            const totalUsers = await db.select({ count: drizzleCount() }).from(users);
            employeeCode = `${prefix}-${String((totalUsers[0]?.count || 0) + 1).padStart(4, '0')}`;
        }

        const [user] = await db.insert(users)
            .values({
                username: req.body.username,
                password: hash,
                fullName: req.body.fullname,
                employeeCode: employeeCode,
                jobTitle: req.body.jobTitle || null,
                role: roleToUse,
                active: true,
                // Admin users should NOT have a department
                departmentId: roleToUse === 'ROLE_ADMIN' ? null : (req.body.departmentId ? parseInt(req.body.departmentId) : null),
                organizationId: req.body.organizationId ? parseInt(req.body.organizationId) : null,
                jobId: req.body.jobId ? parseInt(req.body.jobId) : null,
                baseSalary: req.body.baseSalary ? parseInt(req.body.baseSalary) : 0,
                updatedBy: adminId // Track who created this user
            })
            .returning();

        // Log successful creation
        console.log(`✅ Admin ${adminUser.username} successfully created user: ${user.username} (${employeeCode}) with role: ${user.role}`);

        res.json({
            success: true,
            message: "User created successfully",
            user: {
                id: user.id,
                username: user.username,
                employeeCode: user.employeeCode,
                fullName: user.fullName,
                role: user.role,
                active: user.active
            }
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while creating user."
        });
    }
};

// Admin: Get all users with full details
export const getAllUsers = async (req, res) => {
    try {
        const userRole = req.authData?.role;
        const userId = req.authData?.id;
        
        let allUsers;
        
        // If manager, only show employees in their department
        if (userRole === 'ROLE_MANAGER') {
            // Get manager's department
            const [manager] = await db.select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);
            
            if (!manager || !manager.departmentId) {
                return res.status(400).json({
                    message: "Manager must be assigned to a department"
                });
            }
            
            // Get only employees in manager's department
            allUsers = await db.query.users.findMany({
                where: eq(users.departmentId, manager.departmentId),
                with: {
                    personalInformation: true,
                    department: true,
                    organization: true
                }
            });
        } else {
            // Admin can see all users
            allUsers = await db.query.users.findMany({
                with: {
                    personalInformation: true,
                    department: true,
                    organization: true
                }
            });
        }
        
        const usersWithCompleteData = allUsers.map(user => ({
            ...user,
            personalInformation: user.personalInformation || {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                country: '',
                dateOfBirth: null,
                gender: '',
                maritalStatus: ''
            }
        }));
        
        res.json(usersWithCompleteData);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving users."
        });
    }
};

// Admin: Get user by ID
export const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        // Get user basic info
        const [user] = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        
        if (!user) {
            return res.status(404).json({
                message: `User with id=${id} not found.`
            });
        }

        // Get personal information
        const [personalInfo] = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, id))
            .limit(1);

        // Get department
        let department = null;
        if (user.departmentId) {
            [department] = await db.select()
                .from(departments)
                .where(eq(departments.id, user.departmentId))
                .limit(1);
        }

        // Get jobs
        const userJobs = await db.select()
            .from(jobs)
            .where(eq(jobs.userId, id));
        
        // Ensure consistent response format
        const userWithCompleteData = {
            ...user,
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
            department: department,
            jobs: userJobs || []
        };
        
        res.json({ data: userWithCompleteData });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({
            message: error.message || `Error retrieving user with id=${req.params.id}`
        });
    }
};

// Admin: Get user statistics
export const getUserStatistics = async (req, res) => {
    try {
        const result = await db.select({ count: drizzleCount() })
            .from(users);
        
        const total = result[0]?.count || 0;
        
        const roleStats = await db.select({
            role: users.role,
            count: drizzleCount()
        })
        .from(users)
        .groupBy(users.role);
        
        res.json({ 
            total,
            byRole: roleStats
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving user statistics."
        });
    }
};

// Admin: Update user details
export const updateUser = async (req, res) => {
    try {
        // Get requester data
        const userData = JSON.parse(req.headers.user || '{}');
        const requesterId = userData.id;
        const requesterRole = req.authData?.role;

        if (!requesterId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Authentication required"
            });
        }

        // Verify requester exists and is active
        const [requester] = await db.select()
            .from(users)
            .where(eq(users.id, requesterId))
            .limit(1);

        if (!requester || !requester.active) {
            console.warn(`⚠️ Security Alert: Unauthorized user update attempt by user ID ${requesterId}`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only active users can update accounts"
            });
        }

        const id = parseInt(req.params.id);

        // Check if target user exists
        const [targetUser] = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // MANAGER RESTRICTION: Managers can only edit employees in their department
        if (requesterRole === 'ROLE_MANAGER') {
            if (!requester.departmentId) {
                return res.status(400).json({
                    success: false,
                    message: "Manager must be assigned to a department"
                });
            }
            
            if (targetUser.departmentId !== requester.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Managers can only edit employees in their own department"
                });
            }
            
            // Managers cannot change roles or department assignments
            if (req.body.role || req.body.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Managers cannot change roles or department assignments"
                });
            }
        }

        // ADMIN ONLY: Security checks for admin operations
        if (requesterRole === 'ROLE_ADMIN') {
            // Prevent admin from removing their own admin role
            if (id === requesterId && req.body.role && req.body.role !== 'ROLE_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot change your own admin role"
                });
            }

            // Prevent admin from deactivating themselves
            if (id === requesterId && req.body.active === false) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot deactivate your own account"
                });
            }
        }

        // Validation: Check if changing to manager and department already has a manager
        if (req.body.role === 'ROLE_MANAGER' && req.body.departmentId) {
            const existingManager = await db.select()
                .from(users)
                .where(
                    and(
                        eq(users.departmentId, parseInt(req.body.departmentId)),
                        eq(users.role, 'ROLE_MANAGER'),
                        eq(users.active, true),
                        // Exclude the current user being updated
                        sql`${users.id} != ${id}`
                    )
                )
                .limit(1);

            if (existingManager.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `This department already has a manager: ${existingManager[0].fullName}. A department can only have one active manager.`
                });
            }
        }
        
        let updateData = {};
        
        if (req.body.username) updateData.username = req.body.username;
        if (req.body.fullName) updateData.fullName = req.body.fullName;
        if (req.body.jobTitle !== undefined) updateData.jobTitle = req.body.jobTitle;
        if (req.body.role && requesterRole === 'ROLE_ADMIN') {
            // Log role changes
            if (targetUser.role !== req.body.role) {
                console.log(`⚠️ Admin ${requester.username} is changing user ${targetUser.username}'s role from ${targetUser.role} to ${req.body.role}`);
            }
            updateData.role = req.body.role;
        }
        if (req.body.active !== undefined && requesterRole === 'ROLE_ADMIN') {
            // Log account status changes
            if (targetUser.active !== req.body.active) {
                console.log(`⚠️ Admin ${requester.username} is ${req.body.active ? 'activating' : 'deactivating'} user ${targetUser.username}`);
            }
            updateData.active = req.body.active;
        }
        if (req.body.departmentId && requesterRole === 'ROLE_ADMIN') updateData.departmentId = parseInt(req.body.departmentId);
        if (req.body.organizationId) updateData.organizationId = parseInt(req.body.organizationId);
        if (req.body.jobId) updateData.jobId = parseInt(req.body.jobId);
        if (req.body.baseSalary !== undefined) updateData.baseSalary = parseInt(req.body.baseSalary);
        
        if (req.body.password) {
            // Validate password strength before hashing
            try {
                validatePasswordStrength(req.body.password);
                checkCommonPasswords(req.body.password);
            } catch (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError.message
                });
            }
            
            updateData.password = bcrypt.hashSync(req.body.password.toString(), 10);
        }
        
        updateData.updatedAt = new Date();
        updateData.updatedBy = requesterId; // Track who updated this user
        
        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();
        
        if (!updatedUser) {
            return res.status(404).json({
                message: `Cannot update User with id=${id}. User was not found!`
            });
        }
        
        res.json({
            message: "User updated successfully.",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            message: `Error updating User with id=${req.params.id}`
        });
    }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        await db.update(users)
            .set({ jobId: null })
            .where(eq(users.id, id));
        
        await db.delete(personalInformation).where(eq(personalInformation.userId, id));
        await db.delete(payments).where(eq(payments.userId, id));
        await db.delete(expenses).where(eq(expenses.userId, id));
        await db.delete(daysHoliday).where(eq(daysHoliday.userId, id));
        await db.delete(daysWorking).where(eq(daysWorking.userId, id));
        await db.delete(personalEvents).where(eq(personalEvents.userId, id));
        await db.delete(applications).where(eq(applications.userId, id));
        await db.delete(messages).where(eq(messages.fromUserId, id));
        await db.delete(messages).where(eq(messages.toUserId, id));
        await db.delete(salaryRecords).where(eq(salaryRecords.userId, id));
        await db.delete(overtimeRecords).where(eq(overtimeRecords.userId, id));
        await db.delete(payrollRecords).where(eq(payrollRecords.employeeId, id));
        await db.delete(payrollAdjustments).where(eq(payrollAdjustments.employeeId, id));
        await db.delete(payrollBonuses).where(eq(payrollBonuses.employeeId, id));
        await db.delete(notifications).where(eq(notifications.userId, id));
        
        const userJobs = await db.select().from(jobs).where(eq(jobs.userId, id));
        
        for (const job of userJobs) {
            await db.update(users)
                .set({ jobId: null })
                .where(eq(users.jobId, job.id));
        }
        
        await db.delete(jobs).where(eq(jobs.userId, id));
        
        const [deletedUser] = await db.delete(users)
            .where(eq(users.id, id))
            .returning();
        
        if (!deletedUser) {
            return res.status(404).json({
                message: `Cannot delete User with id=${id}. User was not found!`
            });
        }
        
        res.json({
            message: "User deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: `Could not delete User with id=${req.params.id}`,
            error: error.message
        });
    }
};

// Admin: Get users by department
export const getUsersByDepartment = async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);

        const allUsers = await db.query.users.findMany({
            where: eq(users.departmentId, departmentId),
            with: {
                personalInformation: true,
                department: true,
                organization: true
            }
        });
        
        const usersWithCompleteData = allUsers.map(user => ({
            ...user,
            personalInformation: user.personalInformation || {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                country: '',
                dateOfBirth: null,
                gender: '',
                maritalStatus: ''
            }
        }));
        
        res.json(usersWithCompleteData);
    } catch (error) {
        res.status(500).json({
            message: error.message || `Error retrieving users from department with Id: ${req.params.id}`
        });
    }
};

// Admin: Bulk delete users by department
export const deleteUsersByDepartment = async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);
        
        const deletedUsers = await db.delete(users)
            .where(eq(users.departmentId, departmentId))
            .returning();
        
        res.json({ 
            message: `${deletedUsers.length} users from department ${departmentId} deleted successfully!` 
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while deleting users by department."
        });
    }
};

// Admin: Create employee personal information
export const createEmployeePersonalInfo = async (req, res) => {
    try {
        // SECURITY: Verify the requester is actually an admin
        const adminData = JSON.parse(req.headers.user || '{}');
        const adminId = adminData.id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin authentication required"
            });
        }

        // Verify admin exists and has ROLE_ADMIN
        const [adminUser] = await db.select()
            .from(users)
            .where(eq(users.id, adminId))
            .limit(1);

        if (!adminUser || adminUser.role !== 'ROLE_ADMIN' || !adminUser.active) {
            console.warn(`⚠️ Security Alert: Unauthorized personal info creation attempt by user ID ${adminId}`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only active administrators can create employee personal information"
            });
        }

        if (!req.body || !req.body.userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const userId = parseInt(req.body.userId);

        // Verify target user exists
        const [targetUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user not found"
            });
        }

        // Check if personal information already exists
        const existing = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, userId))
            .limit(1);

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Personal information already exists for this user. Use update instead."
            });
        }

        if (!req.body.firstName || !req.body.lastName) {
            return res.status(400).json({
                success: false,
                message: "First name and last name are required!"
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

        console.log(`✅ Admin ${adminUser.username} created personal information for user ID ${userId}`);

        res.json({
            success: true,
            message: "Personal information created successfully!",
            data: info
        });
    } catch (error) {
        console.error('❌ Error creating employee personal information:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error creating personal information"
        });
    }
};

// Admin: Update employee personal information
export const updateEmployeePersonalInfo = async (req, res) => {
    try {
        // SECURITY: Verify the requester is actually an admin
        const adminData = JSON.parse(req.headers.user || '{}');
        const adminId = adminData.id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin authentication required"
            });
        }

        // Verify admin exists and has ROLE_ADMIN
        const [adminUser] = await db.select()
            .from(users)
            .where(eq(users.id, adminId))
            .limit(1);

        if (!adminUser || adminUser.role !== 'ROLE_ADMIN' || !adminUser.active) {
            console.warn(`⚠️ Security Alert: Unauthorized personal info update attempt by user ID ${adminId}`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only active administrators can update employee personal information"
            });
        }

        const userId = parseInt(req.params.userId);

        // Verify target user exists
        const [targetUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user not found"
            });
        }

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
            // Update existing personal information
            const [updatedInfo] = await db.update(personalInformation)
                .set(updateData)
                .where(eq(personalInformation.userId, userId))
                .returning();

            console.log(`✅ Admin ${adminUser.username} updated personal information for user ID ${userId}`);

            res.json({
                success: true,
                message: "Personal information updated successfully!",
                data: updatedInfo
            });
        } else {
            // Create new personal information
            updateData.userId = userId;
            const [newInfo] = await db.insert(personalInformation)
                .values(updateData)
                .returning();

            console.log(`✅ Admin ${adminUser.username} created personal information for user ID ${userId}`);

            res.json({
                success: true,
                message: "Personal information created successfully!",
                data: newInfo
            });
        }
    } catch (error) {
        console.error('❌ Error updating employee personal information:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating personal information"
        });
    }
};

// Admin: Create employee job
export const createEmployeeJob = async (req, res) => {
    try {
        // SECURITY: Verify the requester is actually an admin
        const adminData = JSON.parse(req.headers.user || '{}');
        const adminId = adminData.id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin authentication required"
            });
        }

        // Verify admin exists and has ROLE_ADMIN
        const [adminUser] = await db.select()
            .from(users)
            .where(eq(users.id, adminId))
            .limit(1);

        if (!adminUser || adminUser.role !== 'ROLE_ADMIN' || !adminUser.active) {
            console.warn(`⚠️ Security Alert: Unauthorized job creation attempt by user ID ${adminId}`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only active administrators can create employee jobs"
            });
        }

        if (!req.body || !req.body.userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const userId = parseInt(req.body.userId);

        // Verify target user exists
        const [targetUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user not found"
            });
        }

        if (!req.body.jobTitle) {
            return res.status(400).json({
                success: false,
                message: "Job title is required!"
            });
        }

        const [job] = await db.insert(jobs)
            .values({
                userId: userId,
                jobTitle: req.body.jobTitle,
                startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
                endDate: req.body.endDate && req.body.endDate.trim() ? new Date(req.body.endDate) : null,
                description: req.body.description?.trim() || null,
                requirements: req.body.requirements?.trim() || null,
                location: req.body.location?.trim() || 'Remote',
                employmentType: req.body.employmentType?.trim() || 'Full-time',
                salary: req.body.salary ? parseInt(req.body.salary) : null,
                departmentId: targetUser.departmentId,
                organizationId: targetUser.organizationId,
                createdBy: adminId,
                isActive: true
            })
            .returning();

        console.log(`✅ Admin ${adminUser.username} created job for user ID ${userId}`);

        res.json({
            success: true,
            message: "Job created successfully!",
            data: job
        });
    } catch (error) {
        console.error('❌ Error creating employee job:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error creating job"
        });
    }
};

// Admin: Update employee job
export const updateEmployeeJob = async (req, res) => {
    try {
        // SECURITY: Verify the requester is actually an admin
        const adminData = JSON.parse(req.headers.user || '{}');
        const adminId = adminData.id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin authentication required"
            });
        }

        // Verify admin exists and has ROLE_ADMIN
        const [adminUser] = await db.select()
            .from(users)
            .where(eq(users.id, adminId))
            .limit(1);

        if (!adminUser || adminUser.role !== 'ROLE_ADMIN' || !adminUser.active) {
            console.warn(`⚠️ Security Alert: Unauthorized job update attempt by user ID ${adminId}`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only active administrators can update employee jobs"
            });
        }

        const jobId = parseInt(req.params.jobId);

        // Verify job exists
        const [existingJob] = await db.select()
            .from(jobs)
            .where(eq(jobs.id, jobId))
            .limit(1);

        if (!existingJob) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const updateData = {};
        if (req.body.jobTitle !== undefined) updateData.jobTitle = req.body.jobTitle;
        if (req.body.startDate !== undefined) {
            updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
        }
        if (req.body.endDate !== undefined) {
            updateData.endDate = req.body.endDate && req.body.endDate.trim() ? new Date(req.body.endDate) : null;
        }
        if (req.body.description !== undefined) updateData.description = req.body.description?.trim() || null;
        if (req.body.requirements !== undefined) updateData.requirements = req.body.requirements?.trim() || null;
        if (req.body.location !== undefined) updateData.location = req.body.location?.trim() || 'Remote';
        if (req.body.employmentType !== undefined) updateData.employmentType = req.body.employmentType?.trim() || 'Full-time';
        if (req.body.salary !== undefined) updateData.salary = req.body.salary ? parseInt(req.body.salary) : null;

        updateData.updatedAt = new Date();

        const [updatedJob] = await db.update(jobs)
            .set(updateData)
            .where(eq(jobs.id, jobId))
            .returning();

        console.log(`✅ Admin ${adminUser.username} updated job ID ${jobId}`);

        res.json({
            success: true,
            message: "Job updated successfully!",
            data: updatedJob
        });
    } catch (error) {
        console.error('❌ Error updating employee job:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating job"
        });
    }
};

// Admin: Get expense analytics by year
export const getExpenseAnalyticsByYear = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        
        if (isNaN(year) || year < 1900 || year > 2100) {
            return res.status(400).json({
                success: false,
                message: "Invalid year provided"
            });
        }

        // Use date strings for better compatibility
        const startDate = `${year}-01-01`;
        const endDate = `${year + 1}-01-01`;

        // Get all expenses for the year
        const yearExpenses = await db.select({
            amount: expenses.amount,
            expenseDate: expenses.expenseDate
        })
        .from(expenses)
        .where(
            and(
                expenses.expenseDate >= startDate,
                expenses.expenseDate < endDate
            )
        );

        // Group by month and calculate totals
        const monthlyTotals = {};
        for (let month = 0; month < 12; month++) {
            monthlyTotals[month] = 0;
        }

        yearExpenses.forEach(expense => {
            const expenseDate = new Date(expense.expenseDate);
            const monthIndex = expenseDate.getMonth();
            monthlyTotals[monthIndex] += parseFloat(expense.amount) || 0;
        });

        // Format response for chart consumption
        const monthlyData = Object.keys(monthlyTotals).map(month => ({
            month: parseInt(month) + 1,
            expenses: monthlyTotals[month].toFixed(2)
        }));

        res.json(monthlyData);

    } catch (error) {
        console.error('Error fetching expense analytics:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching expense analytics"
        });
    }
};

// Admin: Get all expenses (from all departments)
export const getAllExpenses = async (req, res) => {
    try {
        const allExpenses = await db.select({
            id: expenses.id,
            userId: expenses.userId,
            amount: expenses.amount,
            reason: expenses.reason,
            status: expenses.status,
            date: expenses.date,
            createdAt: expenses.createdAt,
            userName: users.fullName,
            userRole: users.role,
            departmentId: users.departmentId,
            departmentName: departments.departmentName
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.userId, users.id))
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .orderBy(desc(expenses.createdAt));

        // Replace admin names with "Admin"
        const formattedExpenses = allExpenses.map(expense => ({
            ...expense,
            userName: expense.userRole === 'ROLE_ADMIN' ? 'Admin' : expense.userName
        }));

        res.json(formattedExpenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            message: error.message || "Error fetching expenses"
        });
    }
};

// Admin: Create expense for any department
export const createExpense = async (req, res) => {
    try {
        const adminId = req.authData?.id;
        
        if (!req.body) {
            return res.status(400).json({
                message: "Content cannot be empty!"
            });
        }

        const { itemName, amount, date, reason, departmentId } = req.body;

        // Validate required fields
        if (!itemName || !amount || !date) {
            return res.status(400).json({
                message: "Item name, amount, and date are required!"
            });
        }

        // Department is REQUIRED for admin
        if (departmentId === undefined || departmentId === null || departmentId === '') {
            return res.status(400).json({
                message: "Department selection is required! Choose a department or 'Company-wide'."
            });
        }

        // Create enhanced reason with item name
        let enhancedReason = itemName;
        if (reason && reason !== itemName) {
            enhancedReason += ` - ${reason}`;
        }

        // Create expense
        // departmentId = 0 or '0' means company-wide (no specific department)
        const newExpense = {
            userId: adminId, // Admin user who created it
            departmentId: (departmentId === 0 || departmentId === '0' || departmentId === null || departmentId === '') ? null : parseInt(departmentId),
            amount: parseInt(amount),
            reason: enhancedReason,
            status: 'pending', // Admin-created expenses start as pending
            date: new Date(date)
        };

        const result = await db.insert(expenses)
            .values(newExpense)
            .returning();
        
        res.json({
            message: "Expense created successfully",
            expense: result[0]
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            message: error.message || "Error creating expense"
        });
    }
};

// Admin: Update expense
export const updateExpense = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);
        const { reason, amount, date, status } = req.body;

        if (!reason || !amount || !date) {
            return res.status(400).json({
                message: "Reason, amount, and date are required!"
            });
        }

        const updateData = {
            reason: reason,
            amount: parseInt(amount),
            date: new Date(date),
            status: status || 'approved'
        };

        const result = await db.update(expenses)
            .set(updateData)
            .where(eq(expenses.id, expenseId))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: "Expense updated successfully",
            expense: result[0]
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            message: error.message || "Error updating expense"
        });
    }
};

// Admin: Update expense status
export const updateExpenseStatus = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required!"
            });
        }

        const result = await db.update(expenses)
            .set({ status: status })
            .where(eq(expenses.id, expenseId))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: `Expense ${status} successfully`,
            expense: result[0]
        });
    } catch (error) {
        console.error('Error updating expense status:', error);
        res.status(500).json({
            message: error.message || "Error updating expense status"
        });
    }
};

// Admin: Delete expense
export const deleteExpense = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);

        const result = await db.delete(expenses)
            .where(eq(expenses.id, expenseId))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: "Expense deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({
            message: error.message || "Error deleting expense"
        });
    }
};

// Admin: Get personal events by user
export const getPersonalEventsByUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        const userEvents = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.userId, userId));

        res.json(userEvents);

    } catch (error) {
        console.error('Error fetching personal events:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching personal events"
        });
    }
};

// Admin: Get a personal event by ID
export const getPersonalEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        const event = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.id, eventId))
            .limit(1);

        if (event.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.json(event[0]);

    } catch (error) {
        console.error('Error fetching personal event:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching personal event"
        });
    }
};

// Admin: Create a personal event
export const createPersonalEvent = async (req, res) => {
    try {
        const {
            userId,
            eventTitle,
            eventDescription,
            eventStartDate,
            eventEndDate
        } = req.body;

        const newEvent = await db.insert(personalEvents)
            .values({
                userId: parseInt(userId),
                eventTitle,
                eventDescription,
                eventStartDate: new Date(eventStartDate),
                eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
                createdAt: new Date()
            })
            .returning();

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: newEvent[0]
        });

    } catch (error) {
        console.error('Error creating personal event:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error creating personal event"
        });
    }
};

// Admin: Update a personal event
export const updatePersonalEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const {
            eventTitle,
            eventDescription,
            eventStartDate,
            eventEndDate
        } = req.body;

        const updatedEvent = await db.update(personalEvents)
            .set({
                eventTitle,
                eventDescription,
                eventStartDate: new Date(eventStartDate),
                eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
                updatedAt: new Date()
            })
            .where(eq(personalEvents.id, eventId))
            .returning();

        if (updatedEvent.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.json({
            success: true,
            message: "Event updated successfully",
            event: updatedEvent[0]
        });

    } catch (error) {
        console.error('Error updating personal event:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating personal event"
        });
    }
};

// Admin: Delete a personal event
export const deletePersonalEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        const deletedEvent = await db.delete(personalEvents)
            .where(eq(personalEvents.id, eventId))
            .returning();

        if (deletedEvent.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting personal event:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error deleting personal event"
        });
    }
};

// Admin: Get recent department announcements
export const getRecentDepartmentAnnouncements = async (req, res) => {
    try {
        const recentAnnouncements = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            date: departmentAnnouncements.date,
            createdAt: departmentAnnouncements.createdAt,
            departmentId: departmentAnnouncements.departmentId,
            createdBy: departmentAnnouncements.createdBy,
            creator: {
                fullName: users.fullName,
                username: users.username
            },
            department: {
                departmentName: departments.departmentName
            }
        })
        .from(departmentAnnouncements)
        .leftJoin(users, eq(departmentAnnouncements.createdBy, users.id))
        .leftJoin(departments, eq(departmentAnnouncements.departmentId, departments.id))
        .orderBy(desc(departmentAnnouncements.createdAt))
        .limit(10);

        res.json(recentAnnouncements);

    } catch (error) {
        console.error('Error fetching recent announcements:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching recent announcements"
        });
    }
};