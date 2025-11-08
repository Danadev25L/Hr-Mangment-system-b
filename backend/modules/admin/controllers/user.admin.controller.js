import { eq, count as drizzleCount, and, desc, sql, or } from 'drizzle-orm';
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
    departmentAnnouncements,
    announcementRecipients,
    jobApplications,
    leaveRequests
} from '../../../db/schema.js';
import { validatePasswordStrength, checkCommonPasswords } from '../../../utils/passwordValidator.js';
import { generateEmployeeCode } from '../../../utils/employeeCodeGenerator.js';
import { 
    notifyExpenseApproved, 
    notifyExpenseRejected, 
    notifyExpensePaid 
} from '../../../services/notification.enhanced.service.js';

// Admin: Create new user
export const createUser = async (req, res) => {
    try {
        console.log('📝 Create user request body:', JSON.stringify(req.body, null, 2));

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
            console.log('❌ Validation failed: Username is missing');
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!req.body.password) {
            console.log('❌ Validation failed: Password is missing');
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (!req.body.fullName) {
            console.log('❌ Validation failed: Full name is missing');
            return res.status(400).json({
                success: false,
                message: "Full name is required"
            });
        }

        if (!req.body.email) {
            console.log('❌ Validation failed: Email is missing');
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        let hash = null;
        if (req.body.password) {
            // Validate password strength before hashing
            try {
                console.log('🔐 Validating password strength...');
                validatePasswordStrength(req.body.password);
                checkCommonPasswords(req.body.password);
                console.log('✅ Password validation passed');
            } catch (validationError) {
                console.log('❌ Password validation failed:', validationError.message);
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

        // Check if email already exists
        const existingEmail = await db.select()
            .from(users)
            .where(eq(users.email, req.body.email))
            .limit(1);

        if (existingEmail.length > 0) {
            return res.status(403).json({
                success: false,
                message: "Email already exists"
            });
        }

        const roleToUse = req.body.role && req.body.role.length > 0 ? req.body.role : 'ROLE_EMPLOYEE';
        const prefix = roleToUse === 'ROLE_ADMIN' ? 'ADM' : roleToUse === 'ROLE_MANAGER' ? 'MGR' : 'EMP';
        
        // Security: Only admins can create other admins (extra check)
        if (roleToUse === 'ROLE_ADMIN') {
            console.log(`⚠️ SECURITY ALERT: Admin ${adminUser.username} is creating another admin account: ${req.body.username}`);
            // Log this critical action for audit purposes
        }

        // CRITICAL SECURITY: Prevent role escalation
        // No one can change their own role to admin or create admins unless they already are admin
        if (roleToUse === 'ROLE_ADMIN' && adminUser.role !== 'ROLE_ADMIN') {
            console.error(`🚨 SECURITY BREACH ATTEMPT: User ${adminUser.username} (Role: ${adminUser.role}) tried to create an admin account!`);
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only administrators can create admin accounts"
            });
        }

        // Validation: Admin should not have a department
        if (roleToUse === 'ROLE_ADMIN' && req.body.departmentId) {
            console.log(`⚠️ Attempting to assign department to admin - this will be ignored`);
            req.body.departmentId = null; // Force null for admins
        }

        // Validation: Require department for non-admin users
        if (roleToUse !== 'ROLE_ADMIN' && !req.body.departmentId) {
            return res.status(400).json({
                success: false,
                message: "Department is required for employees and managers"
            });
        }

        // Validation: Require gender field (Male or Female only)
        if (!req.body.gender) {
            return res.status(400).json({
                success: false,
                message: "Gender is required"
            });
        }

        if (req.body.gender !== 'Male' && req.body.gender !== 'Female') {
            return res.status(400).json({
                success: false,
                message: "Gender must be either 'Male' or 'Female'"
            });
        }

        // Validation: Require base salary (standard wages)
        if (!req.body.baseSalary || parseInt(req.body.baseSalary) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid base salary is required"
            });
        }

        // Validation: Check if department already has a manager (if creating a manager)
        if (roleToUse === 'ROLE_MANAGER' && req.body.departmentId) {
            console.log(`🔍 Checking for existing manager in department ${req.body.departmentId}...`);
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
                console.log(`❌ Department already has manager: ${existingManager[0].fullName} (ID: ${existingManager[0].id})`);
                return res.status(400).json({
                    success: false,
                    message: `This department already has a manager: ${existingManager[0].fullName}. A department can only have one active manager.`,
                    existingManager: {
                        id: existingManager[0].id,
                        fullName: existingManager[0].fullName,
                        employeeCode: existingManager[0].employeeCode
                    }
                });
            } else {
                console.log('✅ No existing manager found in department');
            }
        }

        // Auto-generate unique employee code (always generated, not optional)
        const employeeCode = await generateEmployeeCode(roleToUse);

        console.log('💾 Attempting to insert user into database...');

        const [user] = await db.insert(users)
            .values({
                username: req.body.username,
                password: hash,
                fullName: req.body.fullName,
                employeeCode: employeeCode,
                jobTitle: req.body.jobTitle || null,
                role: roleToUse,
                active: true,
                // Admin users should NOT have a department
                departmentId: roleToUse === 'ROLE_ADMIN' ? null : (req.body.departmentId ? parseInt(req.body.departmentId) : null),
                jobId: req.body.jobId ? parseInt(req.body.jobId) : null,
                baseSalary: req.body.baseSalary ? parseInt(req.body.baseSalary) : 0,

                // New comprehensive employee fields
                employmentType: req.body.employmentType || 'Full-time',
                workLocation: req.body.workLocation || 'Office',
                startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
                endDate: req.body.endDate ? new Date(req.body.endDate) : null,

                // Contact Information
                email: req.body.email,
                phone: req.body.phone || null,
                address: req.body.address || null,
                city: req.body.city || null,
                country: req.body.country || null,

                // Personal Information
                dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
                gender: req.body.gender || null,
                maritalStatus: req.body.maritalStatus || null,
                emergencyContact: req.body.emergencyContact || null,
                emergencyPhone: req.body.emergencyPhone || null,

                updatedBy: adminId // Track who created this user
            })
            .returning();

        console.log('✅ User successfully inserted into database');

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
        console.log('Create user error:', error);
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

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const roleFilter = req.query.role;
        const statusFilter = req.query.status;
        const departmentFilter = req.query.department ? parseInt(req.query.department) : null;
        const startDateFilter = req.query.startDate;
        const endDateFilter = req.query.endDate;
        const offset = (page - 1) * limit;
        
        // DEBUG: Log search parameters
        console.log('🔍 SEARCH DEBUG - Admin Users:', {
            search,
            page,
            limit,
            userRole
        });
        
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

            // Build search conditions
            let whereConditions = [eq(users.departmentId, manager.departmentId)];

            if (search) {
                whereConditions.push(
                    or(
                        sql`${users.fullName} ILIKE ${'%' + search + '%'}`,
                        sql`${users.username} ILIKE ${'%' + search + '%'}`,
                        sql`${users.employeeCode} ILIKE ${'%' + search + '%'}`,
                        sql`${users.jobTitle} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.firstName} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.lastName} ILIKE ${'%' + search + '%'}`
                    )
                );
            }

            // Add filter conditions
            if (roleFilter) {
                whereConditions.push(eq(users.role, roleFilter));
            }
            if (statusFilter !== undefined) {
                const isActive = statusFilter === 'active' || statusFilter === 'true';
                whereConditions.push(eq(users.active, isActive));
            }
            if (startDateFilter) {
                whereConditions.push(sql`users."startDate" >= ${startDateFilter}`);
            }
            if (endDateFilter) {
                whereConditions.push(sql`users."startDate" <= ${endDateFilter}`);
            }

            // Get only employees in manager's department with search and pagination
            allUsers = await db.select({
                // User fields
                id: users.id,
                username: users.username,
                fullName: users.fullName,
                employeeCode: users.employeeCode,
                jobTitle: users.jobTitle,
                role: users.role,
                active: users.active,
                departmentId: users.departmentId,
                jobId: users.jobId,
                baseSalary: users.baseSalary,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                updatedBy: users.updatedBy,

                // New comprehensive employee fields
                employmentType: users.employmentType,
                workLocation: users.workLocation,
                startDate: users.startDate,
                endDate: users.endDate,
                probationEnd: users.probationEnd,
                email: users.email,
                phone: users.phone,
                address: users.address,
                city: users.city,
                country: users.country,
                dateOfBirth: users.dateOfBirth,
                gender: users.gender,
                maritalStatus: users.maritalStatus,
                emergencyContact: users.emergencyContact,
                emergencyPhone: users.emergencyPhone,
                skills: users.skills,
                experience: users.experience,
                lastLogin: users.lastLogin,

                // Related fields
                personalInformation: personalInformation,
                department: departments
            })
            .from(users)
            .leftJoin(personalInformation, eq(users.id, personalInformation.userId))
            .leftJoin(departments, eq(users.departmentId, departments.id))
            .where(and(...whereConditions))
            .limit(limit)
            .offset(offset);
        } else {
            // Build search conditions for admin
            let whereConditions = [];

            if (search) {
                whereConditions.push(
                    or(
                        sql`${users.fullName} ILIKE ${'%' + search + '%'}`,
                        sql`${users.username} ILIKE ${'%' + search + '%'}`,
                        sql`${users.employeeCode} ILIKE ${'%' + search + '%'}`,
                        sql`${users.jobTitle} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.firstName} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.lastName} ILIKE ${'%' + search + '%'}`
                    )
                );
            }

            // Add filter conditions
            if (roleFilter) {
                whereConditions.push(eq(users.role, roleFilter));
            }
            if (statusFilter !== undefined) {
                const isActive = statusFilter === 'active' || statusFilter === 'true';
                whereConditions.push(eq(users.active, isActive));
            }
            if (departmentFilter) {
                whereConditions.push(eq(users.departmentId, departmentFilter));
            }
            if (startDateFilter) {
                whereConditions.push(sql`users."startDate" >= ${startDateFilter}`);
            }
            if (endDateFilter) {
                whereConditions.push(sql`users."startDate" <= ${endDateFilter}`);
            }

            // Admin can see all users with search and pagination
            allUsers = await db.select({
                // User fields
                id: users.id,
                username: users.username,
                fullName: users.fullName,
                employeeCode: users.employeeCode,
                jobTitle: users.jobTitle,
                role: users.role,
                active: users.active,
                departmentId: users.departmentId,
                jobId: users.jobId,
                baseSalary: users.baseSalary,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                updatedBy: users.updatedBy,

                // New comprehensive employee fields
                employmentType: users.employmentType,
                workLocation: users.workLocation,
                startDate: users.startDate,
                endDate: users.endDate,
                probationEnd: users.probationEnd,
                email: users.email,
                phone: users.phone,
                address: users.address,
                city: users.city,
                country: users.country,
                dateOfBirth: users.dateOfBirth,
                gender: users.gender,
                maritalStatus: users.maritalStatus,
                emergencyContact: users.emergencyContact,
                emergencyPhone: users.emergencyPhone,
                skills: users.skills,
                experience: users.experience,
                lastLogin: users.lastLogin,

                // Related fields
                personalInformation: personalInformation,
                department: departments
            })
            .from(users)
            .leftJoin(personalInformation, eq(users.id, personalInformation.userId))
            .leftJoin(departments, eq(users.departmentId, departments.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : sql`1=1`)
            .limit(limit)
            .offset(offset);
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

        // Get total count for pagination
        let totalCountQuery;
        if (userRole === 'ROLE_MANAGER') {
            const [manager] = await db.select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            let countWhereConditions = [eq(users.departmentId, manager.departmentId)];
            if (search) {
                countWhereConditions.push(
                    or(
                        sql`${users.fullName} ILIKE ${'%' + search + '%'}`,
                        sql`${users.username} ILIKE ${'%' + search + '%'}`,
                        sql`${users.employeeCode} ILIKE ${'%' + search + '%'}`,
                        sql`${users.jobTitle} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.firstName} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.lastName} ILIKE ${'%' + search + '%'}`
                    )
                );
            }
            if (roleFilter) {
                countWhereConditions.push(eq(users.role, roleFilter));
            }
            if (statusFilter !== undefined) {
                const isActive = statusFilter === 'active' || statusFilter === 'true';
                countWhereConditions.push(eq(users.active, isActive));
            }
            if (startDateFilter) {
                countWhereConditions.push(sql`users."startDate" >= ${startDateFilter}`);
            }
            if (endDateFilter) {
                countWhereConditions.push(sql`users."startDate" <= ${endDateFilter}`);
            }
            totalCountQuery = db.select({ count: drizzleCount() })
                .from(users)
                .leftJoin(personalInformation, eq(users.id, personalInformation.userId))
                .where(and(...countWhereConditions));
        } else {
            let countWhereConditions = [];
            if (search) {
                countWhereConditions.push(
                    or(
                        sql`${users.fullName} ILIKE ${'%' + search + '%'}`,
                        sql`${users.username} ILIKE ${'%' + search + '%'}`,
                        sql`${users.employeeCode} ILIKE ${'%' + search + '%'}`,
                        sql`${users.jobTitle} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.firstName} ILIKE ${'%' + search + '%'}`,
                        sql`${personalInformation.lastName} ILIKE ${'%' + search + '%'}`
                    )
                );
            }
            if (roleFilter) {
                countWhereConditions.push(eq(users.role, roleFilter));
            }
            if (statusFilter !== undefined) {
                const isActive = statusFilter === 'active' || statusFilter === 'true';
                countWhereConditions.push(eq(users.active, isActive));
            }
            if (departmentFilter) {
                countWhereConditions.push(eq(users.departmentId, departmentFilter));
            }
            if (startDateFilter) {
                countWhereConditions.push(sql`users."startDate" >= ${startDateFilter}`);
            }
            if (endDateFilter) {
                countWhereConditions.push(sql`users."startDate" <= ${endDateFilter}`);
            }
            totalCountQuery = db.select({ count: drizzleCount() })
                .from(users)
                .leftJoin(personalInformation, eq(users.id, personalInformation.userId))
                .where(countWhereConditions.length > 0 ? and(...countWhereConditions) : sql`1=1`);
        }

        const totalCountResult = await totalCountQuery;
        const totalCount = totalCountResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        // Prepare response with metadata
        res.json({
            success: true,
            data: usersWithCompleteData,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                offset
            },
            filters: {
                search: search || null,
                role: roleFilter || null,
                status: statusFilter || null,
                department: departmentFilter || null,
                startDate: startDateFilter || null,
                endDate: endDateFilter || null
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestedBy: userRole,
                resultCount: usersWithCompleteData.length
            }
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while retrieving users.",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        // Get updater information if updatedBy is set
        let updaterName = null;
        if (user.updatedBy) {
            const [updater] = await db.select({
                id: users.id,
                fullName: users.fullName,
                username: users.username
            })
                .from(users)
                .where(eq(users.id, user.updatedBy))
                .limit(1);
            
            if (updater) {
                updaterName = `${updater.fullName} (@${updater.username})`;
            }
        }

        // Get jobs
        const userJobs = await db.select()
            .from(jobs)
            .where(eq(jobs.userId, id));
        
        // Ensure consistent response format
        const userWithCompleteData = {
            ...user,
            updatedByName: updaterName,
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

// Admin: Get new employees this month
export const getNewEmployeesThisMonth = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await db.select({ count: drizzleCount() })
            .from(users)
            .where(and(
                sql`${users.createdAt} >= ${startOfMonth}`,
                sql`${users.createdAt} <= ${endOfMonth}`
            ));
        
        const count = result[0]?.count || 0;
        
        res.json({ count });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving new employees count."
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
            // CRITICAL SECURITY: Prevent role escalation to admin by non-admin
            if (req.body.role === 'ROLE_ADMIN' && targetUser.role !== 'ROLE_ADMIN') {
                console.log(`🚨 CRITICAL: Admin ${requester.username} is promoting ${targetUser.username} to ADMIN role`);
                // This is allowed but logged heavily for audit
            }

            // Prevent admin from removing their own admin role
            if (id === requesterId && req.body.role && req.body.role !== 'ROLE_ADMIN') {
                console.error(`🚨 SECURITY ALERT: Admin ${requester.username} attempted to remove own admin privileges!`);
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot change your own admin role. This action requires another administrator."
                });
            }

            // Prevent admin from deactivating themselves
            if (id === requesterId && req.body.active === false) {
                console.error(`🚨 SECURITY ALERT: Admin ${requester.username} attempted to deactivate own account!`);
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot deactivate your own account. This action requires another administrator."
                });
            }

            // Admin role should not have department
            if (req.body.role === 'ROLE_ADMIN') {
                req.body.departmentId = null;
                console.log(`✓ Enforcing no-department rule for admin role`);
            }
        } else {
            // NON-ADMIN USERS: Absolutely cannot change roles
            if (req.body.role) {
                console.error(`🚨 SECURITY BREACH ATTEMPT: Non-admin user ${requester.username} (${requesterRole}) tried to change role!`);
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Only administrators can modify user roles"
                });
            }
        }

        // Validation: Gender must be Male or Female if provided
        if (req.body.gender && req.body.gender !== 'Male' && req.body.gender !== 'Female') {
            return res.status(400).json({
                success: false,
                message: "Gender must be either 'Male' or 'Female'"
            });
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
                console.log(`❌ Department already has manager: ${existingManager[0].fullName} (ID: ${existingManager[0].id})`);
                return res.status(400).json({
                    success: false,
                    message: `This department already has a manager: ${existingManager[0].fullName}. A department can only have one active manager.`,
                    existingManager: {
                        id: existingManager[0].id,
                        fullName: existingManager[0].fullName,
                        employeeCode: existingManager[0].employeeCode
                    }
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
        if (req.body.jobId) updateData.jobId = parseInt(req.body.jobId);
        if (req.body.baseSalary !== undefined) updateData.baseSalary = parseInt(req.body.baseSalary);

        // New comprehensive employee fields
        if (req.body.employmentType !== undefined) updateData.employmentType = req.body.employmentType;
        if (req.body.workLocation !== undefined) updateData.workLocation = req.body.workLocation;
        if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
        if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;

        // Contact Information
        if (req.body.email !== undefined) updateData.email = req.body.email;
        if (req.body.phone !== undefined) updateData.phone = req.body.phone;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.city !== undefined) updateData.city = req.body.city;
        if (req.body.country !== undefined) updateData.country = req.body.country;

        // Personal Information
        if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
        if (req.body.gender !== undefined) updateData.gender = req.body.gender;
        if (req.body.maritalStatus !== undefined) updateData.maritalStatus = req.body.maritalStatus;
        if (req.body.emergencyContact !== undefined) updateData.emergencyContact = req.body.emergencyContact;
        if (req.body.emergencyPhone !== undefined) updateData.emergencyPhone = req.body.emergencyPhone;

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
        
        console.log(`🗑️ Starting deletion process for user with id: ${id}`);

        // Check if user exists first
        const [userToDelete] = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: `Cannot delete User with id=${id}. User was not found!`
            });
        }

        console.log(`✓ User found: ${userToDelete.username} (${userToDelete.role})`);

        // Set nullable foreign keys to null
        console.log('Step 1: Updating nullable foreign key references...');
        await db.update(users).set({ updatedBy: null }).where(eq(users.updatedBy, id));
        await db.update(jobs).set({ createdBy: null }).where(eq(jobs.createdBy, id));
        await db.update(applications).set({ approvedBy: null }).where(eq(applications.approvedBy, id));
        await db.update(jobApplications).set({ reviewedBy: null }).where(eq(jobApplications.reviewedBy, id));
        await db.update(salaryRecords).set({ approvedBy: null }).where(eq(salaryRecords.approvedBy, id));
        await db.update(overtimeRecords).set({ approvedBy: null }).where(eq(overtimeRecords.approvedBy, id));
        await db.update(payrollRecords).set({ approvedBy: null }).where(eq(payrollRecords.approvedBy, id));
        await db.update(payrollRecords).set({ paidBy: null }).where(eq(payrollRecords.paidBy, id));
        await db.update(departmentAnnouncements).set({ createdBy: null }).where(eq(departmentAnnouncements.createdBy, id));

        // Delete dependent records with foreign keys to users
        console.log('Step 2: Deleting dependent records...');
        
        // Helper function to safely delete from tables that might not exist
        const safeDelete = async (deleteFn, tableName) => {
            try {
                await deleteFn();
            } catch (error) {
                if (error.cause?.code === '42P01') {
                    console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
                } else {
                    throw error; // Re-throw if it's not a "table doesn't exist" error
                }
            }
        };
        
        await safeDelete(() => db.delete(personalInformation).where(eq(personalInformation.userId, id)), 'personalInformation');
        await safeDelete(() => db.delete(payments).where(eq(payments.userId, id)), 'payments');
        await safeDelete(() => db.delete(expenses).where(eq(expenses.userId, id)), 'expenses');
        await safeDelete(() => db.delete(daysWorking).where(eq(daysWorking.userId, id)), 'daysWorking');
        await safeDelete(() => db.delete(personalEvents).where(eq(personalEvents.userId, id)), 'personalEvents');
        await safeDelete(() => db.delete(applications).where(eq(applications.userId, id)), 'applications');
        await safeDelete(() => db.delete(messages).where(or(eq(messages.fromUserId, id), eq(messages.toUserId, id))), 'messages');
        await safeDelete(() => db.delete(salaryRecords).where(eq(salaryRecords.userId, id)), 'salaryRecords');
        await safeDelete(() => db.delete(overtimeRecords).where(eq(overtimeRecords.userId, id)), 'overtimeRecords');
        await safeDelete(() => db.delete(payrollRecords).where(eq(payrollRecords.employeeId, id)), 'payrollRecords');
        await safeDelete(() => db.delete(payrollAdjustments).where(or(eq(payrollAdjustments.employeeId, id), eq(payrollAdjustments.createdBy, id))), 'payrollAdjustments');
        await safeDelete(() => db.delete(payrollBonuses).where(or(eq(payrollBonuses.employeeId, id), eq(payrollBonuses.createdBy, id))), 'payrollBonuses');
        await safeDelete(() => db.delete(notifications).where(eq(notifications.userId, id)), 'notifications');
        await safeDelete(() => db.delete(announcementRecipients).where(eq(announcementRecipients.userId, id)), 'announcementRecipients');
        await safeDelete(() => db.delete(leaveRequests).where(eq(leaveRequests.userId, id)), 'leaveRequests');
        // Note: jobApplications doesn't have userId, only reviewedBy which we already set to null above
        
        // Delete jobs created by user (if jobs table has userId field)
        console.log('Step 3: Deleting user-created jobs...');
        await db.delete(jobs).where(eq(jobs.userId, id));
        
        // Finally delete the user
        console.log('Step 4: Deleting user record...');
        const [deletedUser] = await db.delete(users)
            .where(eq(users.id, id))
            .returning();
        
        console.log(`✓ User ${deletedUser.username} deleted successfully!`);
        
        res.json({
            success: true,
            message: "User deleted successfully!",
            data: {
                id: deletedUser.id,
                username: deletedUser.username
            }
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint
        });
        
        res.status(500).json({
            success: false,
            message: `Could not delete User with id=${req.params.id}`,
            error: error.message,
            detail: error.detail || 'Check server logs for more details'
        });
    }
};

// Admin: Get users by department
export const getUsersByDepartment = async (req, res) => {
    try {
        const departmentId = parseInt(req.params.id);

        const allUsers = await db.select({
            // User fields
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            employeeCode: users.employeeCode,
            jobTitle: users.jobTitle,
            role: users.role,
            active: users.active,
            departmentId: users.departmentId,
                        jobId: users.jobId,
            baseSalary: users.baseSalary,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            updatedBy: users.updatedBy,
            // Related fields
            personalInformation: personalInformation,
            department: departments
        })
        .from(users)
        .leftJoin(personalInformation, eq(users.id, personalInformation.userId))
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .where(eq(users.departmentId, departmentId));
        
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
// Admin: Get all expenses with pagination and filters
export const getAllExpenses = async (req, res) => {
    try {
        // Get pagination and filter parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const departmentId = req.query.department || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const offset = (page - 1) * limit;

        // Build where conditions
        let whereConditions = [];

        // Search filter (reason or user name)
        if (search) {
            whereConditions.push(
                sql`(${expenses.reason} ILIKE ${'%' + search + '%'} OR ${users.fullName} ILIKE ${'%' + search + '%'})`
            );
        }

        // Status filter
        if (status && status !== 'all') {
            whereConditions.push(eq(expenses.status, status));
        }

        // Department filter
        if (departmentId && departmentId !== 'all') {
            if (departmentId === '0' || departmentId === 'null') {
                // Company-wide expenses (no department)
                whereConditions.push(sql`${expenses.departmentId} IS NULL`);
            } else {
                whereConditions.push(eq(expenses.departmentId, parseInt(departmentId)));
            }
        }

        // Date range filter
        if (startDate && endDate) {
            whereConditions.push(
                sql`${expenses.date} >= ${new Date(startDate)} AND ${expenses.date} <= ${new Date(endDate)}`
            );
        }

        // Build the query
        let query = db.select({
            id: expenses.id,
            userId: expenses.userId,
            itemName: expenses.itemName,
            amount: expenses.amount,
            reason: expenses.reason,
            status: expenses.status,
            date: expenses.date,
            createdAt: expenses.createdAt,
            updatedAt: expenses.updatedAt,
            userName: users.fullName,
            userRole: users.role,
            departmentId: expenses.departmentId,
            departmentName: departments.departmentName,
            approvedBy: expenses.approvedBy,
            approvedAt: expenses.approvedAt,
            rejectedBy: expenses.rejectedBy,
            rejectedAt: expenses.rejectedAt,
            paidBy: expenses.paidBy,
            paidAt: expenses.paidAt,
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.userId, users.id))
        .leftJoin(departments, eq(expenses.departmentId, departments.id))
        .orderBy(desc(expenses.createdAt))
        .limit(limit)
        .offset(offset);

        // Apply where conditions if any
        if (whereConditions.length > 0) {
            query = query.where(and(...whereConditions));
        }

        const allExpenses = await query;

        // Get total count for pagination
        let countQuery = db.select({ count: sql`count(*)` })
            .from(expenses)
            .leftJoin(users, eq(expenses.userId, users.id))
            .leftJoin(departments, eq(expenses.departmentId, departments.id));

        if (whereConditions.length > 0) {
            countQuery = countQuery.where(and(...whereConditions));
        }

        const countResult = await countQuery;
        const totalCount = parseInt(countResult[0]?.count || 0);
        const totalPages = Math.ceil(totalCount / limit);

        // Replace admin names with "Admin"
        const formattedExpenses = allExpenses.map(expense => ({
            ...expense,
            userName: expense.userRole === 'ROLE_ADMIN' ? 'Admin' : expense.userName,
            departmentName: expense.departmentName || 'Company-wide'
        }));

        res.json({
            success: true,
            data: formattedExpenses,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: {
                search: search || null,
                status: status || null,
                department: departmentId || null,
                startDate: startDate || null,
                endDate: endDate || null
            }
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
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

// Admin: Get expense by ID with full details
export const getExpenseById = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);

        // Query expense with all user details
        const result = await db
            .select({
                id: expenses.id,
                userId: expenses.userId,
                itemName: expenses.itemName,
                amount: expenses.amount,
                reason: expenses.reason,
                status: expenses.status,
                date: expenses.date,
                createdAt: expenses.createdAt,
                updatedAt: expenses.updatedAt,
                departmentId: expenses.departmentId,
                departmentName: departments.departmentName,
                approvedBy: expenses.approvedBy,
                approvedAt: expenses.approvedAt,
                rejectedBy: expenses.rejectedBy,
                rejectedAt: expenses.rejectedAt,
                paidBy: expenses.paidBy,
                paidAt: expenses.paidAt,
                userName: users.fullName,
                userEmail: users.email,
                userRole: users.role,
            })
            .from(expenses)
            .leftJoin(users, eq(expenses.userId, users.id))
            .leftJoin(departments, eq(expenses.departmentId, departments.id))
            .where(eq(expenses.id, expenseId))
            .limit(1);

        if (result.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const expense = result[0];

        // Fetch approver details if exists
        if (expense.approvedBy) {
            const approver = await db.select({
                fullName: users.fullName,
                email: users.email
            })
            .from(users)
            .where(eq(users.id, expense.approvedBy))
            .limit(1);
            
            if (approver.length > 0) {
                expense.approvedByName = approver[0].fullName;
                expense.approvedByEmail = approver[0].email;
            }
        }

        // Fetch rejecter details if exists
        if (expense.rejectedBy) {
            const rejecter = await db.select({
                fullName: users.fullName,
                email: users.email
            })
            .from(users)
            .where(eq(users.id, expense.rejectedBy))
            .limit(1);
            
            if (rejecter.length > 0) {
                expense.rejectedByName = rejecter[0].fullName;
                expense.rejectedByEmail = rejecter[0].email;
            }
        }

        // Fetch payer details if exists
        if (expense.paidBy) {
            const payer = await db.select({
                fullName: users.fullName,
                email: users.email
            })
            .from(users)
            .where(eq(users.id, expense.paidBy))
            .limit(1);
            
            if (payer.length > 0) {
                expense.paidByName = payer[0].fullName;
                expense.paidByEmail = payer[0].email;
            }
        }

        // Format response
        const formattedExpense = {
            ...expense,
            userName: expense.userRole === 'ROLE_ADMIN' ? 'Admin' : expense.userName,
            departmentName: expense.departmentName || 'Company-wide'
        };

        res.json({
            success: true,
            data: formattedExpense
        });
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({
            message: error.message || "Error fetching expense"
        });
    }
};

// Admin: Update expense status
export const updateExpenseStatus = async (req, res) => {
    try {
        const expenseId = parseInt(req.params.id);
        const { status, adminNote } = req.body;
        const adminId = req.userId; // Get admin ID from auth middleware

        if (!status) {
            return res.status(400).json({
                message: "Status is required!"
            });
        }

        // First, get the expense details before updating
        const existingExpense = await db.select()
            .from(expenses)
            .where(eq(expenses.id, expenseId))
            .limit(1);

        if (existingExpense.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const expense = existingExpense[0];

        // Prepare update data based on status
        const updateData = { 
            status: status,
            updatedAt: new Date()
        };

        // Add admin note if provided
        if (adminNote) {
            updateData.adminNote = adminNote;
        }

        // Track who approved/rejected/paid and when
        if (status === 'approved') {
            updateData.approvedBy = adminId;
            updateData.approvedAt = new Date();
        } else if (status === 'rejected') {
            updateData.rejectedBy = adminId;
            updateData.rejectedAt = new Date();
        } else if (status === 'paid') {
            updateData.paidBy = adminId;
            updateData.paidAt = new Date();
        }

        const result = await db.update(expenses)
            .set(updateData)
            .where(eq(expenses.id, expenseId))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        // Send notifications based on status change
        try {
            const amount = parseFloat(expense.amount);
            const itemName = expense.itemName || 'expense item';
            const userId = expense.userId || expense.createdBy;

            if (status === 'approved') {
                await notifyExpenseApproved(userId, expenseId, itemName, amount, adminId);
            } else if (status === 'rejected') {
                const rejectionReason = adminNote || 'No reason provided';
                await notifyExpenseRejected(userId, expenseId, itemName, amount, adminId, rejectionReason);
            } else if (status === 'paid') {
                await notifyExpensePaid(userId, expenseId, itemName, amount, adminId);
            }
        } catch (notificationError) {
            // Log but don't fail the request if notification fails
            console.error('Error sending expense notification:', notificationError);
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
