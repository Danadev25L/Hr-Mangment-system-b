import { eq, desc, and, count } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { departments, users, departmentAnnouncements, jobs, departmentPolicies, departmentAttendanceReports, expenses } from '../../../db/schema.js';

// Admin: Create new department
export const createDepartment = async (req, res) => {
    try {
        if (!req.body?.departmentName) {
            return res.status(400).json({
                message: "Department name is required!"
            });
        }

        const [department] = await db.insert(departments)
            .values({
                departmentName: req.body.departmentName,
                isActive: true
            })
            .returning();

        res.json(department);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while creating department."
        });
    }
};

// Admin: Get all departments with user counts
export const getAllDepartments = async (req, res) => {
    try {
        console.log('📊 Getting all departments with user counts...');
        
        // Admin should see all departments (active and inactive)
        const allDepartments = await db.select()
            .from(departments)
            .orderBy(desc(departments.createdAt));

        console.log(`📋 Found ${allDepartments.length} departments`);

        // Get user counts and users for each department
        const departmentsWithCount = await Promise.all(
            allDepartments.map(async (dept) => {
                console.log(`\n🔍 Processing department: ${dept.departmentName} (ID: ${dept.id})`);
                
                // Get count - including both active and inactive users
                const userCount = await db.select({ count: count() })
                    .from(users)
                    .where(eq(users.departmentId, dept.id));

                const totalCount = userCount[0]?.count || 0;
                console.log(`   👥 Total users in ${dept.departmentName}: ${totalCount}`);

                // Get users (limited to first few for display)
                const departmentUsers = await db.select({
                    id: users.id,
                    username: users.username,
                    fullName: users.fullName
                })
                    .from(users)
                    .where(eq(users.departmentId, dept.id))
                    .limit(5);

                console.log(`   📝 Fetched ${departmentUsers.length} users for display`);

                return {
                    ...dept,
                    employeeCount: totalCount,
                    users: departmentUsers
                };
            })
        );

        console.log('\n✅ Returning departments with counts');
        res.json(departmentsWithCount);
    } catch (error) {
        console.error('❌ Error fetching departments:', error);
        res.status(500).json({
            message: error.message || "Error occurred while retrieving departments."
        });
    }
};

// Admin: Get department details with users and announcements
export const getDepartmentById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const [department] = await db.select()
            .from(departments)
            .where(eq(departments.id, id))
            .limit(1);

        if (!department) {
            return res.status(404).json({
                message: `Department with id ${id} not found`
            });
        }

        // Get users in this department
        const departmentUsers = await db.select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
            active: users.active,
            jobTitle: users.jobTitle
        })
            .from(users)
            .where(eq(users.departmentId, id));

        // Get announcements for this department
        const departmentAnnouncementsData = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            createdAt: departmentAnnouncements.createdAt
        })
            .from(departmentAnnouncements)
            .where(eq(departmentAnnouncements.departmentId, id))
            .orderBy(desc(departmentAnnouncements.createdAt));

        const departmentWithDetails = {
            ...department,
            users: departmentUsers,
            announcements: departmentAnnouncementsData
        };

        res.json(departmentWithDetails);
    } catch (error) {
        res.status(500).json({
            message: error.message || `Error retrieving department with id=${req.params.id}`
        });
    }
};

// Admin: Update department
export const updateDepartment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (!req.body.departmentName) {
            return res.status(400).json({
                message: "Department name is required!"
            });
        }

        // Prepare update data
        const updateData = {
            departmentName: req.body.departmentName,
            updatedAt: new Date()
        };

        // Handle isActive field if provided
        if (req.body.hasOwnProperty('isActive')) {
            updateData.isActive = Boolean(req.body.isActive);
        }

        const [updatedDepartment] = await db.update(departments)
            .set(updateData)
            .where(eq(departments.id, id))
            .returning();

        if (!updatedDepartment) {
            return res.status(404).json({
                message: `Cannot update department with id=${id}. Department not found!`
            });
        }

        res.json({
            message: "Department updated successfully.",
            department: updatedDepartment
        });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({
            message: error.message || `Error updating department with id=${req.params.id}`
        });
    }
};

// Admin: Delete department (moves users to unassigned)
export const deleteDepartment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid department ID is required!"
            });
        }

        // Check if department exists first
        const existingDepartment = await db.query.departments.findFirst({
            where: eq(departments.id, id)
        });

        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message: `Department with id ${id} not found!`
            });
        }

        console.log(`🗑️ Starting delete process for department with id: ${id}`);
        console.log('🔍 Department to delete:', existingDepartment);

        // Use transaction to ensure all operations complete or none do
        const result = await db.transaction(async (tx) => {
            try {
                // Step 1: Delete department announcements referencing this department
                console.log('📢 Step 1: Checking department announcements...');
                const deletedAnnouncements = await tx.delete(departmentAnnouncements)
                    .where(eq(departmentAnnouncements.departmentId, id))
                    .returning();
                console.log(`✅ Deleted ${deletedAnnouncements.length} department announcements`);
            } catch (err) {
                console.error('❌ Step 1 failed:', err.message);
                console.error('Query:', err.query);
                throw err;
            }

            try {
                // Step 2: Delete department policies (CASCADE enabled but explicit for logging)
                console.log('📋 Step 2: Checking department policies...');
                const deletedPolicies = await tx.delete(departmentPolicies)
                    .where(eq(departmentPolicies.departmentId, id))
                    .returning();
                console.log(`✅ Deleted ${deletedPolicies.length} department policies`);
            } catch (err) {
                console.error('❌ Step 2 failed:', err.message);
                console.error('Query:', err.query);
                throw err;
            }

            try {
                // Step 3: Delete department attendance reports (CASCADE enabled but explicit for logging)
                console.log('📊 Step 3: Checking department attendance reports...');
                const deletedReports = await tx.delete(departmentAttendanceReports)
                    .where(eq(departmentAttendanceReports.departmentId, id))
                    .returning();
                console.log(`✅ Deleted ${deletedReports.length} attendance reports`);
            } catch (err) {
                console.error('❌ Step 3 failed:', err.message);
                console.error('Query:', err.query);
                throw err;
            }

            try {
                // Step 4: Update jobs to remove department reference
                console.log('💼 Step 4: Checking jobs...');
                const updatedJobs = await tx.update(jobs)
                    .set({ departmentId: null })
                    .where(eq(jobs.departmentId, id))
                    .returning({ id: jobs.id });
                console.log(`✅ Updated ${updatedJobs.length} jobs to remove department reference`);
            } catch (err) {
                console.error('❌ Step 4 failed:', err.message);
                console.error('Query:', err.query);
                throw err;
            }

            try {
                // Step 5: Update expenses to remove department reference
                console.log('💳 Step 5: Checking expenses...');
                const updatedExpenses = await tx.update(expenses)
                    .set({ departmentId: null })
                    .where(eq(expenses.departmentId, id))
                    .returning({ id: expenses.id });
                console.log(`✅ Updated ${updatedExpenses.length} expenses to remove department reference`);
            } catch (err) {
                console.error('❌ Step 5 failed:', err.message);
                console.error('Query:', err.query);
                throw err;
            }

            try {
                // Step 6: Update users to remove department reference (CRITICAL - must happen before delete)
                console.log('👥 Step 6: Checking users...');
                const updatedUsers = await tx.update(users)
                    .set({ departmentId: null })
                    .where(eq(users.departmentId, id))
                    .returning({ id: users.id });
                console.log(`✅ Updated ${updatedUsers.length} users to remove department reference`);
            } catch (err) {
                console.error('❌ Step 6 failed (CRITICAL - users):', err.message);
                console.error('Query:', err.query);
                console.error('Full error:', JSON.stringify(err, null, 2));
                throw err;
            }

            let deletedDepartment;
            try {
                // Step 7: Delete the department
                console.log('🏢 Step 7: Deleting department...');
                [deletedDepartment] = await tx.delete(departments)
                    .where(eq(departments.id, id))
                    .returning();

                if (!deletedDepartment) {
                    console.error('❌ No department was deleted - this should not happen');
                    throw new Error(`Failed to delete department with id ${id} - no rows affected`);
                }

                console.log('✅ Department deleted successfully:', deletedDepartment);
            } catch (err) {
                console.error('❌ Step 7 failed (DELETE department):', err.message);
                console.error('Failed query:', err.query);
                console.error('Error code:', err.code);
                console.error('Error detail:', err.detail);
                console.error('Full error:', JSON.stringify(err, null, 2));
                throw err;
            }

            return deletedDepartment;
        });

        // Transaction completed successfully
        res.json({
            success: true,
            message: "Department deleted successfully!",
            department: result
        });

    } catch (error) {
        console.error('💥 Error deleting department:', error);
        
        // Extract detailed error information
        const errorDetails = {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            constraint: error.constraint_name || error.constraint,
            table: error.table_name || error.table,
            column: error.column_name || error.column
        };

        console.error('📋 Error details:', JSON.stringify(errorDetails, null, 2));

        // Create user-friendly message based on what's blocking deletion
        let userFriendlyMessage = 'Cannot delete department';
        let actionSteps = [];
        
        // Check which constraint is preventing deletion
        if (error.message?.includes('users') || errorDetails.table === 'users') {
            userFriendlyMessage = 'This department has employees assigned to it';
            actionSteps = [
                'First, reassign all employees to another department',
                'Or remove employees from this department',
                'Then you can delete the department'
            ];
        } else if (error.message?.includes('jobs') || errorDetails.table === 'jobs') {
            userFriendlyMessage = 'This department has job postings';
            actionSteps = [
                'First, reassign job postings to another department',
                'Or delete the job postings',
                'Then you can delete the department'
            ];
        } else if (error.message?.includes('expenses') || errorDetails.table === 'expenses') {
            userFriendlyMessage = 'This department has expense records';
            actionSteps = [
                'First, reassign expenses to another department',
                'Or remove the department from expense records',
                'Then you can delete the department'
            ];
        } else if (error.message?.includes('announcement') || errorDetails.table?.includes('announcement')) {
            userFriendlyMessage = 'This department has announcements';
            actionSteps = [
                'First, delete all announcements for this department',
                'Then you can delete the department'
            ];
        } else {
            userFriendlyMessage = 'This department has related records that must be handled first';
            actionSteps = [
                'Check for employees, jobs, or expenses in this department',
                'Reassign or remove related records',
                'Then try deleting again'
            ];
        }

        res.status(500).json({
            success: false,
            message: userFriendlyMessage,
            actionRequired: actionSteps,
            technicalDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
    }
};

// Admin: Get department statistics
export const getDepartmentStatistics = async (req, res) => {
    try {
        console.log('📊 Getting department statistics...');

        // Get all departments
        const allDepartments = await db.select()
            .from(departments);

        const activeDepartments = allDepartments.filter(dept => dept.isActive);

        // Get all users
        const allUsers = await db.select()
            .from(users)
            .where(eq(users.active, true));

        const stats = {
            totalDepartments: allDepartments.length,
            activeDepartments: activeDepartments.length,
            totalEmployees: allUsers.length
        };

        console.log('📈 Department stats calculated:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Error getting department statistics:', error);
        res.status(500).json({
            message: error.message || "Error occurred while retrieving department statistics."
        });
    }
};