import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    users,
    payrollRecords,
    overtimeRecords,
    salaryRecords,
    notifications,
    personalInformation,
    expenses,
    daysHoliday
} from '../../../db/schema.js';

// Employee: Get own profile information
export const getMyProfile = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                personalInformation: true,
                department: true,
                organization: true
            }
        });
        
        if (user) {
            const userWithCompleteData = {
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
            };
            res.json(userWithCompleteData);
        } else {
            res.status(404).json({
                message: "User profile not found."
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error retrieving user profile"
        });
    }
};

// Employee: Get own salary history
export const getMySalaryHistory = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        const salaryHistory = await db.select()
            .from(payrollRecords)
            .where(eq(payrollRecords.employeeId, userId))
            .orderBy(desc(payrollRecords.year), desc(payrollRecords.month));
        
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        const currentMonthSalary = salaryHistory.find(record => 
            record.month === currentMonth && record.year === currentYear
        );
        
        const yearToDateTotal = salaryHistory
            .filter(record => record.year === currentYear)
            .reduce((sum, record) => sum + (record.netSalary || 0), 0);
        
        res.json({
            salaryHistory: salaryHistory,
            currentMonthSalary: currentMonthSalary || null,
            yearToDateTotal: yearToDateTotal,
            totalRecords: salaryHistory.length
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error retrieving salary history"
        });
    }
};

// Employee: Get own overtime records
export const getMyOvertimeRecords = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        const overtimeHistory = await db.select()
            .from(overtimeRecords)
            .where(eq(overtimeRecords.userId, userId))
            .orderBy(desc(overtimeRecords.date));
        
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const currentMonthOvertime = overtimeHistory.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() + 1 === currentMonth && 
                   recordDate.getFullYear() === currentYear;
        });
        
        const totalCurrentMonthHours = currentMonthOvertime.reduce((sum, record) => 
            sum + (record.hoursWorked || 0), 0
        );
        
        res.json({
            overtimeHistory: overtimeHistory,
            currentMonthOvertime: currentMonthOvertime,
            totalCurrentMonthHours: totalCurrentMonthHours,
            totalRecords: overtimeHistory.length
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error retrieving overtime records"
        });
    }
};

// Employee: Submit overtime request
export const submitOvertimeRequest = async (req, res) => {
    try {
        const { date, hoursWorked, description } = req.body;
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        if (!date || !hoursWorked) {
            return res.status(400).json({
                message: "Date and hours worked are required!"
            });
        }
        
        const overtimeData = {
            userId: userId,
            date: new Date(date),
            hoursWorked: parseFloat(hoursWorked),
            description: description || '',
            status: 'pending'
        };
        
        const [newOvertime] = await db.insert(overtimeRecords)
            .values(overtimeData)
            .returning();
        
        // Get manager to send notification
        const [employee] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        
        if (employee && employee.departmentId) {
            const managers = await db.select()
                .from(users)
                .where(and(
                    eq(users.departmentId, employee.departmentId),
                    eq(users.role, 'ROLE_MANAGER')
                ));
            
            for (const manager of managers) {
                await db.insert(notifications).values({
                    userId: manager.id,
                    title: 'New Overtime Request',
                    message: `${employee.fullName} submitted overtime request for ${hoursWorked} hours on ${new Date(date).toLocaleDateString()}`,
                    type: 'info'
                });
            }
        }
        
        res.json({
            message: "Overtime request submitted successfully!",
            overtime: newOvertime
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error submitting overtime request"
        });
    }
};

// Employee: Get own notifications
export const getMyNotifications = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        const userNotifications = await db.select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt));
        
        const unreadCount = userNotifications.filter(n => !n.isRead).length;
        
        res.json({
            notifications: userNotifications,
            unreadCount: unreadCount,
            totalCount: userNotifications.length
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error retrieving notifications"
        });
    }
};

// Employee: Mark notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        const [notification] = await db.select()
            .from(notifications)
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId)
            ))
            .limit(1);
        
        if (!notification) {
            return res.status(404).json({
                message: "Notification not found or access denied."
            });
        }
        
        await db.update(notifications)
            .set({ 
                isRead: true,
                updatedAt: new Date()
            })
            .where(eq(notifications.id, notificationId));
        
        res.json({
            message: "Notification marked as read."
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error marking notification as read"
        });
    }
};

// Employee: Update own personal information
export const updateMyPersonalInfo = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        
        const updateData = {};
        
        if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
        if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
        if (req.body.email !== undefined) updateData.email = req.body.email;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.city !== undefined) updateData.city = req.body.city;
        if (req.body.country !== undefined) updateData.country = req.body.country;
        if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
        if (req.body.gender !== undefined) updateData.gender = req.body.gender;
        if (req.body.maritalStatus !== undefined) updateData.maritalStatus = req.body.maritalStatus;
        
        updateData.updatedAt = new Date();
        
        // Check if personal information exists
        const existingPersonalInfo = await db.select()
            .from(personalInformation)
            .where(eq(personalInformation.userId, userId))
            .limit(1);
        
        if (existingPersonalInfo.length > 0) {
            await db.update(personalInformation)
                .set(updateData)
                .where(eq(personalInformation.userId, userId));
        } else {
            updateData.userId = userId;
            await db.insert(personalInformation).values(updateData);
        }
        
        res.json({
            message: "Personal information updated successfully."
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error updating personal information"
        });
    }
};