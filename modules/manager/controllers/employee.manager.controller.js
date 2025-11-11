import { eq, and, or, desc, sql, count as drizzleCount } from 'drizzle-orm';

import bcrypt from 'bcrypt';

import { db } from '../../../db/index.js';
import { 
    users, 
    payrollRecords, 
    payrollAdjustments, 
    payrollBonuses, 
    overtimeRecords,
    notifications,
    personalInformation,
    departments
} from '../../../db/schema.js';
import { generateEmployeeCode } from '../../../utils/employeeCodeGenerator.js';
import { validatePasswordStrength, checkCommonPasswords } from '../../../utils/passwordValidator.js';

// Manager: Create new employee (restricted to their department and ROLE_EMPLOYEE only)
export const createDepartmentEmployee = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const managerId = userData.id;
        
        // Get manager details
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, managerId))
            .limit(1);
        
        if (!manager || !manager.departmentId) {
            return res.status(404).json({
                success: false,
                message: "Manager has no department assigned."
            });
        }
        
        const { 
            username, 
            password, 
            fullName, 
            jobTitle,
            baseSalary,
            email,
            phone,
            dateOfBirth,
            address,
            city,
            country
        } = req.body;
        
        // Validate required fields
        if (!username || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: "Username, password, and full name are required"
            });
        }
        
        // Check password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Password does not meet security requirements",
                errors: passwordValidation.errors
            });
        }
        
        // Check for common passwords
        if (checkCommonPasswords(password)) {
            return res.status(400).json({
                success: false,
                message: "Password is too common. Please choose a more secure password."
            });
        }
        
        // Check if username already exists
        const [existingUser] = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate employee code
        const employeeCode = await generateEmployeeCode();
        
        // Create user - FORCE department and role
        const [newUser] = await db.insert(users).values({
            username,
            password: hashedPassword,
            fullName,
            employeeCode,
            jobTitle: jobTitle || null,
            role: 'ROLE_EMPLOYEE', // ALWAYS employee, managers can't create admins/managers
            departmentId: manager.departmentId, // ALWAYS manager's department
            baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        
        // Create personal information if provided
        if (email || phone || dateOfBirth || address) {
            await db.insert(personalInformation).values({
                userId: newUser.id,
                email: email || '',
                phone: phone || '',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                address: address || '',
                city: city || '',
                country: country || '',
                firstName: fullName.split(' ')[0] || '',
                lastName: fullName.split(' ').slice(1).join(' ') || ''
            });
        }
        
        // Create notification for new employee
        await db.insert(notifications).values({
            userId: newUser.id,
            title: 'Welcome to the Team!',
            message: `Welcome ${fullName}! Your account has been created by your manager.`,
            type: 'info'
        });
        
        res.status(201).json({
            success: true,
            message: "Employee created successfully!",
            data: {
                id: newUser.id,
                username: newUser.username,
                fullName: newUser.fullName,
                employeeCode: newUser.employeeCode,
                role: newUser.role,
                departmentId: newUser.departmentId,
                jobTitle: newUser.jobTitle,
                baseSalary: newUser.baseSalary
            }
        });
        
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while creating employee."
        });
    }
};

// Manager: Get employees in their department
export const getMyDepartmentEmployees = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const managerUserId = userData.id;
        const managerRole = userData.role;
        
        if (!['ROLE_MANAGER', 'ROLE_ADMIN'].includes(managerRole)) {
            return res.status(403).json({
                message: "Only managers and admins can access this endpoint.",
            });
        }
        
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, managerUserId))
            .limit(1);
        
        if (!manager) {
            return res.status(404).json({
                message: "Manager not found.",
            });
        }
        
        if (!manager.departmentId) {
            return res.status(404).json({
                message: "Manager has no department assigned.",
            });
        }

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const roleFilter = req.query.role || '';
        const statusFilter = req.query.status || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const offset = (page - 1) * limit;
        
        // DEBUG: Log search parameters
        console.log('🔍 SEARCH DEBUG - Manager Employees:', {
            search,
            page,
            limit,
            departmentId: manager.departmentId
        });
        
        // Build search conditions
        let whereConditions = [
            eq(users.departmentId, manager.departmentId),
            eq(users.role, 'ROLE_EMPLOYEE')
        ];

        // Search filter
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

        // Role filter (though in manager view, it's always ROLE_EMPLOYEE)
        if (roleFilter && roleFilter !== 'all') {
            whereConditions.push(eq(users.role, roleFilter));
        }

        // Status filter
        if (statusFilter) {
            if (statusFilter === 'active') {
                whereConditions.push(eq(users.active, true));
            } else if (statusFilter === 'inactive') {
                whereConditions.push(eq(users.active, false));
            }
        }

        // Date range filter
        if (startDate && endDate) {
            whereConditions.push(
                sql`users.createdAt >= ${new Date(startDate)} AND users.createdAt <= ${new Date(endDate)}`
            );
        }
        
        // Query employees with proper joins
        const employees = await db.select({
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

            // Comprehensive employee fields
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
        
        // DEBUG: Log search results
        console.log('✅ SEARCH RESULTS:', {
            foundCount: employees.length,
            searchTerm: search,
            sampleNames: employees.slice(0, 3).map(e => ({
                fullName: e.fullName,
                firstName: e.personalInformation?.firstName,
                lastName: e.personalInformation?.lastName
            }))
        });
        
        const employeesWithCompleteData = employees.map(employee => ({
            ...employee,
            personalInformation: employee.personalInformation || {
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
        const totalCountResult = await db.select({ count: drizzleCount() })
            .from(users)
            .where(and(...whereConditions));
        const totalCount = totalCountResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);
        
        res.json({
            success: true,
            data: employeesWithCompleteData,
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
                startDate: startDate || null,
                endDate: endDate || null,
                departmentId: manager.departmentId
            },
            meta: {
                timestamp: new Date().toISOString(),
                departmentName: manager.department || null,
                managerId: managerUserId,
                resultCount: employeesWithCompleteData.length
            }
        });
    } catch (error) {
        console.error("Error in getMyDepartmentEmployees:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while retrieving employees for manager.",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Manager: Get department payroll overview
export const getDepartmentPayroll = async (req, res) => {
    try {
        const { month, year } = req.params;
        const userData = JSON.parse(req.headers.user || '{}');
        const managerId = userData.id;
        
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, managerId))
            .limit(1);
        
        if (!manager || !manager.departmentId) {
            return res.status(404).json({
                message: "Manager department not found"
            });
        }
        
        const departmentEmployees = await db.select()
            .from(users)
            .where(eq(users.departmentId, manager.departmentId));
        
        const employeeIds = departmentEmployees.map(emp => emp.id);
        
        if (employeeIds.length === 0) {
            return res.json({
                records: [],
                summary: {
                    totalEmployees: 0,
                    totalPayroll: 0,
                    departmentName: manager.department || 'Unknown'
                }
            });
        }
        
        const records = await db.select()
            .from(payrollRecords)
            .where(and(
                eq(payrollRecords.month, parseInt(month)),
                eq(payrollRecords.year, parseInt(year))
            ));
        
        const departmentRecords = records.filter(record => 
            employeeIds.includes(record.employeeId)
        );
        
        const summary = {
            totalEmployees: departmentRecords.length,
            totalPayroll: departmentRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0),
            totalGrossPayroll: departmentRecords.reduce((sum, record) => sum + (record.grossSalary || 0), 0),
            totalOvertimePay: departmentRecords.reduce((sum, record) => sum + (record.overtimePay || 0), 0),
            totalBonuses: departmentRecords.reduce((sum, record) => sum + (record.bonuses || 0), 0),
            avgSalary: departmentRecords.length > 0 ? 
                departmentRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0) / departmentRecords.length : 0,
            departmentName: manager.department || 'Unknown',
            month: parseInt(month),
            year: parseInt(year)
        };
        
        res.json({
            records: departmentRecords,
            summary: summary,
            departmentInfo: {
                id: manager.departmentId,
                name: manager.department,
                managerId: managerId,
                managerName: manager.fullName
            }
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while fetching department payroll.",
            records: [],
            summary: {}
        });
    }
};

// Manager: Add overtime for department employees
export const addEmployeeOvertime = async (req, res) => {
    try {
        const { employeeId, date, hoursWorked, description } = req.body;
        const userData = JSON.parse(req.headers.user || '{}');
        
        if (!employeeId || !date || !hoursWorked) {
            return res.status(400).json({
                message: "Employee ID, date, and hours worked are required!"
            });
        }

        // Verify manager can manage this employee
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, userData.id))
            .limit(1);

        const [employee] = await db.select()
            .from(users)
            .where(eq(users.id, parseInt(employeeId)))
            .limit(1);

        if (!employee || employee.departmentId !== manager.departmentId) {
            return res.status(403).json({
                message: "You can only manage employees in your department."
            });
        }
        
        const overtimeData = {
            userId: parseInt(employeeId),
            date: new Date(date),
            hoursWorked: parseFloat(hoursWorked),
            description: description || '',
            status: 'approved',
            approvedBy: userData.id,
            approvedAt: new Date()
        };
        
        await db.insert(overtimeRecords).values(overtimeData);
        
        await db.insert(notifications).values({
            userId: parseInt(employeeId),
            title: 'Overtime Added',
            message: `${hoursWorked} hours of overtime for ${new Date(date).toLocaleDateString()} has been recorded and approved by your manager`,
            type: 'info'
        });
        
        res.json({
            message: "Overtime added successfully!",
            overtime: overtimeData
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while adding overtime."
        });
    }
};

// Manager: Approve overtime requests from their department
export const approveOvertimeRequest = async (req, res) => {
    try {
        const overtimeId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        
        const [overtimeRecord] = await db.select()
            .from(overtimeRecords)
            .where(eq(overtimeRecords.id, overtimeId))
            .limit(1);
        
        if (!overtimeRecord) {
            return res.status(404).json({
                message: "Overtime record not found!"
            });
        }

        // Verify manager can approve this employee's overtime
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, userData.id))
            .limit(1);

        const [employee] = await db.select()
            .from(users)
            .where(eq(users.id, overtimeRecord.userId))
            .limit(1);

        if (!employee || employee.departmentId !== manager.departmentId) {
            return res.status(403).json({
                message: "You can only approve overtime for employees in your department."
            });
        }
        
        await db.update(overtimeRecords)
            .set({
                status: 'approved',
                approvedBy: userData.id,
                approvedAt: new Date()
            })
            .where(eq(overtimeRecords.id, overtimeId));
        
        await db.insert(notifications).values({
            userId: overtimeRecord.userId,
            title: 'Overtime Approved',
            message: `Your overtime request for ${overtimeRecord.hoursWorked} hours has been approved by your manager`,
            type: 'success'
        });
        
        res.json({
            message: "Overtime approved successfully!"
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while approving overtime."
        });
    }
};

// Manager: Get employee by ID (only in their department)
export const getDepartmentEmployeeById = async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const managerId = userData.id;
        
        // Get manager details
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, managerId))
            .limit(1);
        
        if (!manager || !manager.departmentId) {
            return res.status(404).json({
                success: false,
                message: "Manager has no department assigned."
            });
        }
        
        // Get employee with full details
        const [employee] = await db.select({
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

            // Comprehensive employee fields
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
        .where(and(
            eq(users.id, employeeId),
            eq(users.departmentId, manager.departmentId),
            eq(users.role, 'ROLE_EMPLOYEE')
        ))
        .limit(1);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found or not in your department."
            });
        }
        
        res.json({
            success: true,
            data: {
                ...employee,
                personalInformation: employee.personalInformation || {
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
            }
        });
        
    } catch (error) {
        console.error('Error getting department employee:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while retrieving employee."
        });
    }
};

// Manager: Update employee (only in their department)
export const updateDepartmentEmployee = async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const managerId = userData.id;
        
        // Get manager details
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, managerId))
            .limit(1);
        
        if (!manager || !manager.departmentId) {
            return res.status(404).json({
                success: false,
                message: "Manager has no department assigned."
            });
        }
        
        // Verify employee exists and is in manager's department
        const [employee] = await db.select()
            .from(users)
            .where(and(
                eq(users.id, employeeId),
                eq(users.departmentId, manager.departmentId),
                eq(users.role, 'ROLE_EMPLOYEE')
            ))
            .limit(1);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found or not in your department."
            });
        }
        
        const { 
            username, 
            password,
            fullName, 
            jobTitle,
            baseSalary,
            email,
            phone,
            dateOfBirth,
            address,
            city,
            country,
            active,
            employmentType,
            workLocation,
            startDate,
            endDate,
            probationEnd,
            gender,
            maritalStatus,
            emergencyContact,
            emergencyPhone,
            skills,
            experience
        } = req.body;
        
        // Prepare user update data
        const userUpdateData = {
            updatedAt: new Date(),
            updatedBy: managerId
        };
        
        // Add fields that can be updated
        if (username) userUpdateData.username = username;
        if (fullName) userUpdateData.fullName = fullName;
        if (jobTitle !== undefined) userUpdateData.jobTitle = jobTitle;
        if (baseSalary !== undefined) userUpdateData.baseSalary = parseFloat(baseSalary);
        if (active !== undefined) userUpdateData.active = active;
        if (employmentType) userUpdateData.employmentType = employmentType;
        if (workLocation) userUpdateData.workLocation = workLocation;
        if (startDate) userUpdateData.startDate = new Date(startDate);
        if (endDate) userUpdateData.endDate = new Date(endDate);
        if (probationEnd) userUpdateData.probationEnd = new Date(probationEnd);
        if (email) userUpdateData.email = email;
        if (phone) userUpdateData.phone = phone;
        if (dateOfBirth) userUpdateData.dateOfBirth = new Date(dateOfBirth);
        if (address) userUpdateData.address = address;
        if (city) userUpdateData.city = city;
        if (country) userUpdateData.country = country;
        if (gender) userUpdateData.gender = gender;
        if (maritalStatus) userUpdateData.maritalStatus = maritalStatus;
        if (emergencyContact) userUpdateData.emergencyContact = emergencyContact;
        if (emergencyPhone) userUpdateData.emergencyPhone = emergencyPhone;
        if (skills) userUpdateData.skills = skills;
        if (experience) userUpdateData.experience = experience;
        
        // Handle password update
        if (password) {
            // Validate password strength
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: "Password does not meet security requirements",
                    errors: passwordValidation.errors
                });
            }
            
            // Check for common passwords
            if (checkCommonPasswords(password)) {
                return res.status(400).json({
                    success: false,
                    message: "Password is too common. Please choose a more secure password."
                });
            }
            
            userUpdateData.password = await bcrypt.hash(password, 10);
        }
        
        // Check username uniqueness if being changed
        if (username && username !== employee.username) {
            const [existingUser] = await db.select()
                .from(users)
                .where(eq(users.username, username))
                .limit(1);
            
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username already exists"
                });
            }
        }
        
        // Update user record
        await db.update(users)
            .set(userUpdateData)
            .where(eq(users.id, employeeId));
        
        // Update personal information if provided
        if (email || phone || dateOfBirth || address) {
            const [existingPersonalInfo] = await db.select()
                .from(personalInformation)
                .where(eq(personalInformation.userId, employeeId))
                .limit(1);
            
            const personalInfoData = {
                email: email || existingPersonalInfo?.email || '',
                phone: phone || existingPersonalInfo?.phone || '',
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingPersonalInfo?.dateOfBirth || null,
                address: address || existingPersonalInfo?.address || '',
                city: city || existingPersonalInfo?.city || '',
                country: country || existingPersonalInfo?.country || '',
                firstName: fullName ? fullName.split(' ')[0] : existingPersonalInfo?.firstName || '',
                lastName: fullName ? fullName.split(' ').slice(1).join(' ') : existingPersonalInfo?.lastName || ''
            };
            
            if (existingPersonalInfo) {
                await db.update(personalInformation)
                    .set(personalInfoData)
                    .where(eq(personalInformation.userId, employeeId));
            } else {
                await db.insert(personalInformation).values({
                    userId: employeeId,
                    ...personalInfoData
                });
            }
        }
        
        res.json({
            success: true,
            message: "Employee updated successfully!",
            data: {
                id: employeeId,
                ...userUpdateData
            }
        });
        
    } catch (error) {
        console.error('Error updating department employee:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error occurred while updating employee."
        });
    }
};

// Get users from manager's department for application selection (includes manager + employees)
export const getDepartmentUsersForApplications = async (req, res) => {
    try {
        const managerId = req.authData.id;
        
        // Get manager's department
        const [manager] = await db.select()
            .from(users)
            .where(eq(users.id, managerId))
            .limit(1);

        if (!manager || !manager.departmentId) {
            return res.status(403).json({
                message: 'Manager must be assigned to a department'
            });
        }

        // Get all users from the department (employees + manager)
        const departmentUsers = await db.select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            employeeCode: users.employeeCode,
            jobTitle: users.jobTitle,
            role: users.role,
            email: users.email,
            departmentId: users.departmentId,
            active: users.active,
        })
        .from(users)
        .where(
            and(
                eq(users.departmentId, manager.departmentId),
                eq(users.active, true),
                // Include both employees and the manager
                or(
                    eq(users.role, 'ROLE_EMPLOYEE'),
                    eq(users.id, managerId)
                )
            )
        )
        .orderBy(users.fullName);

        res.json({
            success: true,
            data: departmentUsers
        });
    } catch (error) {
        console.error('Error fetching department users for applications:', error);
        res.status(500).json({
            message: 'Error retrieving department users'
        });
    }
};