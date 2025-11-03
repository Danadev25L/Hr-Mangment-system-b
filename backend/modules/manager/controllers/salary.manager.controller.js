import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import {
  users,
  monthlySalaries,
  salaryAdjustments,
  salaryComponents,
  employeeSalaryComponents,
  absenceDeductions,
  latencyDeductions
} from '../../../db/schema.js';

/**
 * Shared Salary Controller for Managers
 * Managers can view and manage salaries for their department employees
 */

// Get department monthly salaries
export const getDepartmentSalaries = async (req, res) => {
  try {
    const { month, year, status, departmentId } = req.query;
    const userData = JSON.parse(req.headers.user || '{}');
    
    if (!userData.departmentId) {
      return res.status(403).json({ message: 'Manager department not found' });
    }
    
    // Set current month and year if not provided
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Step 1: Get ALL active employees from manager's department
    let employeeWhereConditions = [
      eq(users.active, true),
      eq(users.departmentId, userData.departmentId)
    ];
    
    const allEmployees = await db.select({
      id: users.id,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      departmentName: users.departmentName,
      baseSalary: users.baseSalary
    })
    .from(users)
    .where(and(...employeeWhereConditions));
    
    // Step 2: Get calculated salaries for the specified month/year
    let salaryWhereConditions = [
      eq(monthlySalaries.month, targetMonth),
      eq(monthlySalaries.year, targetYear)
    ];
    
    if (status) {
      salaryWhereConditions.push(eq(monthlySalaries.status, status));
    }
    
    const calculatedSalaries = await db.select({
      id: monthlySalaries.id,
      employeeId: monthlySalaries.employeeId,
      employeeName: users.fullName,
      employeeCode: users.employeeCode,
      department: users.departmentName,
      month: monthlySalaries.month,
      year: monthlySalaries.year,
      baseSalary: monthlySalaries.baseSalary,
      totalBonuses: monthlySalaries.totalBonuses,
      totalAllowances: monthlySalaries.totalAllowances,
      overtimePay: monthlySalaries.overtimePay,
      totalDeductions: monthlySalaries.totalDeductions,
      grossSalary: monthlySalaries.grossSalary,
      netSalary: monthlySalaries.netSalary,
      status: monthlySalaries.status,
      calculatedAt: monthlySalaries.calculatedAt,
      approvedAt: monthlySalaries.approvedAt,
      paidAt: monthlySalaries.paidAt
    })
    .from(monthlySalaries)
    .leftJoin(users, eq(monthlySalaries.employeeId, users.id))
    .where(and(
      eq(users.departmentId, userData.departmentId),
      ...salaryWhereConditions
    ))
    .orderBy(desc(monthlySalaries.year), desc(monthlySalaries.month));
    
    // Step 3: Create a map of calculated salaries by employeeId
    const salaryMap = new Map();
    calculatedSalaries.forEach(salary => {
      salaryMap.set(salary.employeeId, salary);
    });
    
    // Step 4: Merge employees with their calculated salaries
    // If no calculated salary exists, show base salary with zeros
    const salaries = allEmployees.map(employee => {
      const calculatedSalary = salaryMap.get(employee.id);
      
      if (calculatedSalary) {
        // Employee has a calculated salary for this period
        return calculatedSalary;
      } else {
        // Employee doesn't have a calculated salary - show base salary with zeros
        return {
          id: null,
          employeeId: employee.id,
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          department: employee.departmentName,
          month: targetMonth,
          year: targetYear,
          baseSalary: employee.baseSalary || '0',
          totalBonuses: '0',
          totalAllowances: '0',
          overtimePay: '0',
          totalDeductions: '0',
          grossSalary: employee.baseSalary || '0',
          netSalary: employee.baseSalary || '0',
          status: 'draft',
          calculatedAt: null,
          approvedAt: null,
          paidAt: null
        };
      }
    });
    
    // Apply status filter if specified
    const filteredSalaries = status 
      ? salaries.filter(s => s.status === status)
      : salaries;
    
    // Calculate summary
    const summary = {
      totalEmployees: filteredSalaries.length,
      totalGrossSalary: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.grossSalary || 0), 0),
      totalNetSalary: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.netSalary || 0), 0),
      totalDeductions: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.totalDeductions || 0), 0),
      totalBonuses: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.totalBonuses || 0), 0)
    };
    
    res.json({
      message: 'Department salaries retrieved successfully',
      salaries: filteredSalaries,
      summary,
      department: userData.departmentName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee salary details (manager can only access their department employees)
export const getEmployeeSalaryDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const userData = JSON.parse(req.headers.user || '{}');
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    // Check if employee is in manager's department
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(employeeId)))
      .limit(1);
    
    if (!employee || employee.departmentId !== userData.departmentId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const [salary] = await db.select({
      id: monthlySalaries.id,
      employeeId: monthlySalaries.employeeId,
      employeeName: users.fullName,
      employeeCode: users.employeeCode,
      department: users.department,
      month: monthlySalaries.month,
      year: monthlySalaries.year,
      baseSalary: monthlySalaries.baseSalary,
      totalBonuses: monthlySalaries.totalBonuses,
      totalAllowances: monthlySalaries.totalAllowances,
      overtimePay: monthlySalaries.overtimePay,
      overtimeHours: monthlySalaries.overtimeHours,
      totalDeductions: monthlySalaries.totalDeductions,
      absenceDeductions: monthlySalaries.absenceDeductions,
      latencyDeductions: monthlySalaries.latencyDeductions,
      otherDeductions: monthlySalaries.otherDeductions,
      taxDeduction: monthlySalaries.taxDeduction,
      grossSalary: monthlySalaries.grossSalary,
      netSalary: monthlySalaries.netSalary,
      workingDays: monthlySalaries.workingDays,
      presentDays: monthlySalaries.presentDays,
      absentDays: monthlySalaries.absentDays,
      lateDays: monthlySalaries.lateDays,
      totalLateMinutes: monthlySalaries.totalLateMinutes,
      status: monthlySalaries.status,
      calculatedAt: monthlySalaries.calculatedAt
    })
    .from(monthlySalaries)
    .leftJoin(users, eq(monthlySalaries.employeeId, users.id))
    .where(and(
      eq(monthlySalaries.employeeId, parseInt(employeeId)),
      eq(monthlySalaries.month, parseInt(month)),
      eq(monthlySalaries.year, parseInt(year))
    ))
    .limit(1);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Get adjustments
    const adjustments = await db.select()
      .from(salaryAdjustments)
      .where(eq(salaryAdjustments.monthlySalaryId, salary.id));
    
    res.json({
      message: 'Salary details retrieved successfully',
      salary,
      adjustments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
