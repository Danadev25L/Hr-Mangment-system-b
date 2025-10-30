import { eq, and, desc, sql } from 'drizzle-orm';

import { db } from '../../../db/index.js';
import { 
  users, 
  payrollRecords, 
 
  notifications 
} from '../../../db/schema.js';
import { recalculateEmployeePayroll } from '../../shared/controllers/payroll.shared.controller.js';

// Admin: Generate payroll for all employees
export const generateMonthlyPayroll = async (req, res) => {
    try {
        const { month, year } = req.body;
        
        if (!month || !year) {
            return res.status(400).json({
                message: "Month and year are required!"
            });
        }
        
        const userData = JSON.parse(req.headers.user || '{}');
        
        if (userData.role !== 'ROLE_ADMIN') {
            return res.status(403).json({
                message: "Access denied. Only administrators can generate monthly payroll."
            });
        }
        
        const allEmployees = await db.select({
            id: users.id,
            fullName: users.fullName,
            baseSalary: users.baseSalary,
            departmentId: users.departmentId
        })
        .from(users)
        .where(eq(users.role, 'ROLE_EMPLOYEE'));
        
        const generatedPayrolls = [];
        
        for (const employee of allEmployees) {
            try {
                const payrollData = await recalculateEmployeePayroll(employee.id, parseInt(month), parseInt(year));
                generatedPayrolls.push(payrollData);
            } catch (error) {
                // Skip employees with errors but continue processing others
            }
        }
        
        res.json({
            message: `Successfully generated payroll for ${generatedPayrolls.length} employees for ${month}/${year}`,
            count: generatedPayrolls.length,
            payrolls: generatedPayrolls
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while generating monthly payroll."
        });
    }
};

// Admin: Get comprehensive payroll summary
export const getPayrollSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentMonth = month || new Date().getMonth() + 1;
        const currentYear = year || new Date().getFullYear();
        
        const currentPeriodRecords = await db.select()
            .from(payrollRecords)
            .where(and(
                eq(payrollRecords.month, parseInt(currentMonth)),
                eq(payrollRecords.year, parseInt(currentYear))
            ));
        
        const yearRecords = await db.select()
            .from(payrollRecords)
            .where(eq(payrollRecords.year, parseInt(currentYear)));
        
        const previousYearRecords = await db.select()
            .from(payrollRecords)
            .where(eq(payrollRecords.year, parseInt(currentYear) - 1));
        
        const currentSummary = {
            totalEmployees: currentPeriodRecords.length,
            totalPayroll: currentPeriodRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0),
            totalGrossPayroll: currentPeriodRecords.reduce((sum, record) => sum + (record.grossSalary || 0), 0),
            totalOvertimePay: currentPeriodRecords.reduce((sum, record) => sum + (record.overtimePay || 0), 0),
            totalBonuses: currentPeriodRecords.reduce((sum, record) => sum + (record.bonuses || 0), 0),
            totalAdjustments: currentPeriodRecords.reduce((sum, record) => sum + (record.adjustments || 0), 0),
            totalTaxDeductions: currentPeriodRecords.reduce((sum, record) => sum + (record.taxDeduction || 0), 0),
            avgSalary: currentPeriodRecords.length > 0 ? 
                currentPeriodRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0) / currentPeriodRecords.length : 0,
            month: parseInt(currentMonth),
            year: parseInt(currentYear),
            statusBreakdown: {
                pending: currentPeriodRecords.filter(r => r.status === 'pending').length,
                approved: currentPeriodRecords.filter(r => r.status === 'approved').length,
                paid: currentPeriodRecords.filter(r => r.status === 'paid').length
            }
        };
        
        const yearToDateSummary = {
            totalPayroll: yearRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0),
            totalGrossPayroll: yearRecords.reduce((sum, record) => sum + (record.grossSalary || 0), 0),
            totalOvertimePay: yearRecords.reduce((sum, record) => sum + (record.overtimePay || 0), 0),
            totalBonuses: yearRecords.reduce((sum, record) => sum + (record.bonuses || 0), 0),
            totalTaxDeductions: yearRecords.reduce((sum, record) => sum + (record.taxDeduction || 0), 0),
            monthsProcessed: [...new Set(yearRecords.map(r => r.month))].length,
            totalRecords: yearRecords.length
        };
        
        const previousYearSummary = {
            totalPayroll: previousYearRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0),
            totalRecords: previousYearRecords.length
        };
        
        const payrollGrowth = previousYearSummary.totalPayroll > 0 ? 
            ((yearToDateSummary.totalPayroll - previousYearSummary.totalPayroll) / previousYearSummary.totalPayroll) * 100 : 0;
        
        const departmentStats = {};
        currentPeriodRecords.forEach(record => {
            const dept = record.department || 'Unassigned';
            if (!departmentStats[dept]) {
                departmentStats[dept] = {
                    employeeCount: 0,
                    totalPayroll: 0,
                    avgSalary: 0
                };
            }
            departmentStats[dept].employeeCount++;
            departmentStats[dept].totalPayroll += (record.netSalary || 0);
        });
        
        Object.keys(departmentStats).forEach(dept => {
            departmentStats[dept].avgSalary = departmentStats[dept].employeeCount > 0 ? 
                departmentStats[dept].totalPayroll / departmentStats[dept].employeeCount : 0;
        });
        
        res.json({
            currentPeriod: currentSummary,
            yearToDate: yearToDateSummary,
            previousYear: previousYearSummary,
            growth: {
                payrollGrowthPercentage: Math.round(payrollGrowth * 100) / 100,
                employeeGrowth: yearRecords.length - previousYearRecords.length
            },
            departmentBreakdown: departmentStats,
            generatedAt: new Date()
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while getting payroll summary.",
            currentPeriod: {
                totalEmployees: 0,
                totalPayroll: 0,
                totalGrossPayroll: 0,
                totalOvertimePay: 0,
                totalBonuses: 0,
                totalTaxDeductions: 0,
                avgSalary: 0,
                month: parseInt(req.query.month) || new Date().getMonth() + 1,
                year: parseInt(req.query.year) || new Date().getFullYear(),
                statusBreakdown: { pending: 0, approved: 0, paid: 0 }
            },
            yearToDate: {},
            previousYear: {},
            growth: {},
            departmentBreakdown: {}
        });
    }
};

// Admin: Approve individual payroll record
export const approvePayroll = async (req, res) => {
    try {
        const payrollId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        
        if (!payrollId) {
            return res.status(400).json({
                message: "Payroll ID is required!"
            });
        }
        
        const [existingRecord] = await db.select()
            .from(payrollRecords)
            .where(eq(payrollRecords.id, payrollId))
            .limit(1);
        
        if (!existingRecord) {
            return res.status(404).json({
                message: "Payroll record not found!"
            });
        }
        
        const [updatedRecord] = await db.update(payrollRecords)
            .set({
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: userData.id,
                updatedAt: new Date()
            })
            .where(eq(payrollRecords.id, payrollId))
            .returning();
        
        await db.insert(notifications).values({
            userId: existingRecord.employeeId,
            title: 'Payroll Approved',
            message: `Your payroll for ${existingRecord.month}/${existingRecord.year} has been approved. Net amount: $${existingRecord.netSalary}`,
            type: 'success'
        });
        
        res.json({
            message: "Payroll approved successfully!",
            record: updatedRecord
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while approving payroll."
        });
    }
};

// Admin: Mark payroll as paid
export const markAsPaid = async (req, res) => {
    try {
        const payrollId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        
        if (!payrollId) {
            return res.status(400).json({
                message: "Payroll ID is required!"
            });
        }
        
        const [existingRecord] = await db.select()
            .from(payrollRecords)
            .where(eq(payrollRecords.id, payrollId))
            .limit(1);
        
        if (!existingRecord) {
            return res.status(404).json({
                message: "Payroll record not found!"
            });
        }
        
        const [updatedRecord] = await db.update(payrollRecords)
            .set({
                status: 'paid',
                paidAt: new Date(),
                paidBy: userData.id,
                updatedAt: new Date()
            })
            .where(eq(payrollRecords.id, payrollId))
            .returning();
        
        await db.insert(notifications).values({
            userId: existingRecord.employeeId,
            title: 'Payment Processed',
            message: `Your salary payment for ${existingRecord.month}/${existingRecord.year} has been processed. Net amount: $${existingRecord.netSalary}`,
            type: 'success'
        });
        
        res.json({
            message: "Payroll marked as paid successfully!",
            record: updatedRecord
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while marking payroll as paid."
        });
    }
};