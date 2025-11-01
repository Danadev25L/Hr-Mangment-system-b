import { eq, desc, and, count } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { departments, users, departmentAnnouncements, jobs } from '../../../db/schema.js';

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
        // Admin should see all departments (active and inactive)
        const allDepartments = await db.select()
            .from(departments)
            .orderBy(desc(departments.createdAt));

        // Get user counts for each department
        const departmentsWithCount = await Promise.all(
            allDepartments.map(async (dept) => {
                const userCount = await db.select({ count: count() })
                    .from(users)
                    .where(eq(users.departmentId, dept.id));

                return {
                    ...dept,
                    employeeCount: userCount[0]?.count || 0
                };
            })
        );

        res.json(departmentsWithCount);
    } catch (error) {
        console.error('Error fetching departments:', error);
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
                message: "Valid department ID is required!"
            });
        }

        // Check if department exists
        const existingDepartment = await db.query.departments.findFirst({
            where: eq(departments.id, id)
        });

        if (!existingDepartment) {
            return res.status(404).json({
                message: `Department with id ${id} not found!`
            });
        }

        console.log(`🗑️ Starting delete process for department with id: ${id}`);
        console.log('🔍 Department to delete:', existingDepartment);

        // Step 1: Delete department announcements referencing this department
        console.log('📢 Step 1: Checking department announcements...');
        try {
            const deletedAnnouncements = await db.delete(departmentAnnouncements)
                .where(eq(departmentAnnouncements.departmentId, id))
                .returning();
            console.log(`✅ Deleted ${deletedAnnouncements.length} department announcements`);
        } catch (annErr) {
            console.warn('⚠️ Announcement deletion error:', annErr);
        }

        // Step 2: Update jobs to remove department reference
        console.log('💼 Step 2: Checking jobs...');
        try {
            const updatedJobs = await db.update(jobs)
                .set({ departmentId: null })
                .where(eq(jobs.departmentId, id))
                .returning({ id: jobs.id });
            console.log(`✅ Updated ${updatedJobs.length} jobs to remove department reference`);
        } catch (jobErr) {
            console.warn('⚠️ Job update error:', jobErr);
        }

        // Step 3: Update users to remove department reference
        console.log('👥 Step 3: Checking users...');
        try {
            const updatedUsers = await db.update(users)
                .set({ departmentId: null })
                .where(eq(users.departmentId, id))
                .returning({ id: users.id });
            console.log(`✅ Updated ${updatedUsers.length} users to remove department reference`);
        } catch (userErr) {
            console.error('❌ User update failed:', userErr);
            throw userErr; // This should not fail
        }

        // Step 4: Delete the department
        console.log('🏢 Step 4: Deleting department...');
        try {
            const [deletedDepartment] = await db.delete(departments)
                .where(eq(departments.id, id))
                .returning();

            if (!deletedDepartment) {
                console.error('❌ No department was deleted - this should not happen');
                return res.status(500).json({
                    message: `Failed to delete department with id ${id} - no rows affected`
                });
            }

            console.log('✅ Department deleted successfully:', deletedDepartment);
            
            res.json({
                message: "Department deleted successfully!",
                department: deletedDepartment
            });
        } catch (deleteErr) {
            console.error('❌ Department deletion failed:', deleteErr);
            throw deleteErr;
        }
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            message: error.message || `Could not delete department with id=${req.params.id}`
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