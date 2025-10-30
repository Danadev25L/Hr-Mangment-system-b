import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    users, 
    payrollRecords, 
    payrollAdjustments, 
    payrollBonuses, 
    overtimeRecords,
    notifications 
} from '../../../db/schema.js';

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
        
        const employees = await db.query.users.findMany({
            where: and(
                eq(users.departmentId, manager.departmentId),
                eq(users.role, 'ROLE_EMPLOYEE')
            ),
            with: {
                personalInformation: true,
                department: true,
                organization: true
            }
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
        
        res.json(employeesWithCompleteData);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving employees for manager.",
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