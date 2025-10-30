import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  users, 
  payrollRecords, 
  payrollAdjustments, 
  payrollBonuses, 
  overtimeRecords
} from '../../../db/schema.js';

// Shared function to recalculate payroll for an employee
export const recalculateEmployeePayroll = async (employeeId, month, year) => {
  try {
    const [employee] = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      baseSalary: users.baseSalary,
      department: users.department,
      jobTitle: users.jobTitle
    })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
      
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const baseSalary = parseFloat(employee.baseSalary) || 0;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const overtimeRecordsForMonth = await db.select()
      .from(overtimeRecords)
      .where(and(
        eq(overtimeRecords.userId, employeeId),
        eq(overtimeRecords.status, 'approved'),
        sql`${overtimeRecords.date} >= ${startDate}`,
        sql`${overtimeRecords.date} <= ${endDate}`
      ));
    
    const totalOvertimeHours = overtimeRecordsForMonth.reduce((total, ot) => total + (ot.hoursWorked || 0), 0);
    const overtimeRate = Math.round(baseSalary / 160); // Assuming 160 working hours per month
    const overtimePay = totalOvertimeHours * overtimeRate;
    
    const adjustments = await db.select()
      .from(payrollAdjustments)
      .where(and(
        eq(payrollAdjustments.employeeId, employeeId),
        eq(payrollAdjustments.month, month),
        eq(payrollAdjustments.year, year)
      ));
    
    const bonuses = await db.select()
      .from(payrollBonuses)
      .where(and(
        eq(payrollBonuses.employeeId, employeeId),
        eq(payrollBonuses.month, month),
        eq(payrollBonuses.year, year)
      ));
    
    const totalAdjustments = adjustments.reduce((sum, adj) => sum + parseFloat(adj.amount || 0), 0);
    const totalBonuses = bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount || 0), 0);
    
    const grossSalary = baseSalary + overtimePay + totalAdjustments + totalBonuses;
    const taxDeduction = Math.round(grossSalary * 0.15); // 15% tax
    const otherDeductions = Math.round(grossSalary * 0.02); // 2% other deductions
    const totalDeductions = taxDeduction + otherDeductions;
    const netSalary = grossSalary - totalDeductions;
    
    const existingRecord = await db.select()
      .from(payrollRecords)
      .where(and(
        eq(payrollRecords.employeeId, employeeId),
        eq(payrollRecords.month, month),
        eq(payrollRecords.year, year)
      ))
      .limit(1);
    
    const payrollData = {
      employeeId: employeeId,
      employeeName: employee.fullName,
      department: employee.department || 'N/A',
      month: month,
      year: year,
      baseSalary: baseSalary,
      overtimeHours: totalOvertimeHours,
      overtimePay: overtimePay,
      bonuses: totalBonuses,
      adjustments: totalAdjustments,
      grossSalary: grossSalary,
      taxDeduction: taxDeduction,
      netSalary: netSalary,
      status: existingRecord.length > 0 ? existingRecord[0].status : 'pending',
      updatedAt: new Date()
    };
    
    if (existingRecord.length > 0) {
      await db.update(payrollRecords)
        .set({
          ...payrollData,
          status: existingRecord[0].status,
          approvedBy: existingRecord[0].approvedBy,
          approvedAt: existingRecord[0].approvedAt,
          paidAt: existingRecord[0].paidAt,
          paidBy: existingRecord[0].paidBy
        })
        .where(and(
          eq(payrollRecords.employeeId, employeeId),
          eq(payrollRecords.month, month),
          eq(payrollRecords.year, year)
        ));
        
      payrollData.id = existingRecord[0].id;
      payrollData.status = existingRecord[0].status;
      payrollData.isUpdate = true;
    } else {
      const [newRecord] = await db.insert(payrollRecords).values(payrollData).returning();
      payrollData.id = newRecord.id;
      payrollData.isUpdate = false;
    }
    
    return {
      ...payrollData,
      breakdown: {
        baseSalary,
        overtimePay,
        totalAdjustments,
        totalBonuses,
        grossSalary,
        taxDeduction,
        totalDeductions,
        netSalary
      },
      details: {
        overtimeRecords: overtimeRecordsForMonth.length,
        totalOvertimeHours,
        adjustmentCount: adjustments.length,
        bonusCount: bonuses.length,
        employee: {
          name: employee.fullName,
          email: employee.email,
          department: employee.department,
          jobTitle: employee.jobTitle
        }
      }
    };
    
  } catch (error) {
    throw error;
  }
};

// Shared function to get all payroll records with filters
export const getPayrollRecords = async (filters = {}) => {
    try {
        const { month, year, employeeId, status, department } = filters;
        
        let whereConditions = [];
        
        if (month && !isNaN(parseInt(month))) {
            whereConditions.push(eq(payrollRecords.month, parseInt(month)));
        }
        if (year && !isNaN(parseInt(year))) {
            whereConditions.push(eq(payrollRecords.year, parseInt(year)));
        }
        if (employeeId && !isNaN(parseInt(employeeId))) {
            whereConditions.push(eq(payrollRecords.employeeId, parseInt(employeeId)));
        }
        if (status) {
            whereConditions.push(eq(payrollRecords.status, status));
        }
        if (department) {
            whereConditions.push(eq(payrollRecords.department, department));
        }
        
        const results = await db.select()
            .from(payrollRecords)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(payrollRecords.year), desc(payrollRecords.month), desc(payrollRecords.createdAt));
        
        const totalRecords = results.length;
        const totalGrossPayroll = results.reduce((sum, record) => sum + (record.grossSalary || 0), 0);
        const totalNetPayroll = results.reduce((sum, record) => sum + (record.netSalary || 0), 0);
        const totalTaxDeductions = results.reduce((sum, record) => sum + (record.taxDeduction || 0), 0);
        const avgNetSalary = totalRecords > 0 ? totalNetPayroll / totalRecords : 0;
        
        return {
            records: results,
            summary: {
                totalRecords,
                totalGrossPayroll,
                totalNetPayroll,
                totalTaxDeductions,
                avgNetSalary: Math.round(avgNetSalary),
                recordsByStatus: {
                    pending: results.filter(r => r.status === 'pending').length,
                    approved: results.filter(r => r.status === 'approved').length,
                    paid: results.filter(r => r.status === 'paid').length
                }
            }
        };
        
    } catch (error) {
        throw error;
    }
};