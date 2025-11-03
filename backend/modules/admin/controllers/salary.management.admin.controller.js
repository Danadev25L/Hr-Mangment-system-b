import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import {
  users,
  departments,
  monthlySalaries,
  salaryAdjustments,
  salaryComponents,
  employeeSalaryComponents,
  absenceDeductions,
  latencyDeductions,
  salaryConfiguration,
  attendanceRecords,
  attendanceSummary,
  overtimeTracking,
  notifications
} from '../../../db/schema.js';

/**
 * Comprehensive Salary Management Controller
 * Handles complete salary lifecycle: calculation, adjustments, bonuses, deductions
 */

// ==================== CONFIGURATION MANAGEMENT ====================

// Get all salary configurations
export const getSalaryConfig = async (req, res) => {
  try {
    const configs = await db.select().from(salaryConfiguration);
    
    const configMap = {};
    configs.forEach(config => {
      configMap[config.configKey] = {
        value: config.configValue,
        description: config.description
      };
    });
    
    res.json({
      message: 'Salary configuration retrieved successfully',
      config: configMap
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update salary configuration
export const updateSalaryConfig = async (req, res) => {
  try {
    const { configKey, configValue } = req.body;
    
    if (!configKey || configValue === undefined) {
      return res.status(400).json({ message: 'Config key and value are required' });
    }
    
    const userData = JSON.parse(req.headers.user || '{}');
    
    await db.update(salaryConfiguration)
      .set({
        configValue: String(configValue),
        updatedBy: userData.id,
        updatedAt: new Date()
      })
      .where(eq(salaryConfiguration.configKey, configKey));
    
    res.json({
      message: 'Configuration updated successfully',
      key: configKey,
      value: configValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SALARY CALCULATION ====================

// Calculate monthly salary for a single employee
export const calculateEmployeeSalary = async (employeeId, month, year) => {
  try {
    // Get employee data
    const [employee] = await db.select({
      id: users.id,
      fullName: users.fullName,
      baseSalary: users.baseSalary,
      department: users.department,
      departmentId: users.departmentId
    })
    .from(users)
    .where(eq(users.id, employeeId))
    .limit(1);
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const baseSalary = parseFloat(employee.baseSalary || 0);
    
    // Get salary configuration
    const configs = await db.select().from(salaryConfiguration);
    const configMap = {};
    configs.forEach(c => configMap[c.configKey] = parseFloat(c.configValue));
    
    const taxRate = configMap.tax_rate || 10;
    const absenceDeductionPerDay = configMap.absence_deduction_per_day || 0;
    const latencyDeductionPerMinute = configMap.latency_deduction_per_minute || 1;
    const overtimeRateMultiplier = configMap.overtime_rate_multiplier || 1.5;
    const workingDaysPerMonth = configMap.working_days_per_month || 22;
    const gracePeriodMinutes = configMap.grace_period_minutes || 15;
    
    // Calculate daily rate
    const dailyRate = baseSalary / workingDaysPerMonth;
    const minuteRate = dailyRate / (8 * 60); // Assuming 8-hour workday
    
    // Get attendance summary for the month
    const [attendance] = await db.select()
      .from(attendanceSummary)
      .where(and(
        eq(attendanceSummary.userId, employeeId),
        eq(attendanceSummary.month, month),
        eq(attendanceSummary.year, year)
      ))
      .limit(1);
    
    const presentDays = attendance?.presentDays || 0;
    const absentDays = attendance?.absentDays || 0;
    const lateDays = attendance?.lateDays || 0;
    const workingDays = attendance?.totalWorkingDays || workingDaysPerMonth;
    
    // Get detailed late records
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const lateRecords = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, employeeId),
        eq(attendanceRecords.isLate, true),
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ));
    
    // Calculate total late minutes (excluding grace period)
    const totalLateMinutes = lateRecords.reduce((sum, record) => {
      const lateMinutes = record.lateMinutes || 0;
      return sum + Math.max(0, lateMinutes - gracePeriodMinutes);
    }, 0);
    
    // Get overtime tracking
    const overtimeRecords = await db.select()
      .from(overtimeTracking)
      .where(and(
        eq(overtimeTracking.userId, employeeId),
        eq(overtimeTracking.isApproved, true),
        sql`EXTRACT(MONTH FROM ${overtimeTracking.date}) = ${month}`,
        sql`EXTRACT(YEAR FROM ${overtimeTracking.date}) = ${year}`
      ));
    
    const overtimeMinutes = overtimeRecords.reduce((sum, ot) => sum + (ot.overtimeMinutes || 0), 0);
    const overtimeHours = overtimeMinutes / 60;
    const overtimePay = overtimeMinutes * minuteRate * overtimeRateMultiplier;
    
    // Get recurring salary components for this employee
    const components = await db.select({
      id: employeeSalaryComponents.id,
      amount: employeeSalaryComponents.amount,
      componentName: salaryComponents.componentName,
      componentType: salaryComponents.componentType,
      isPercentage: salaryComponents.isPercentage,
      isTaxable: salaryComponents.isTaxable
    })
    .from(employeeSalaryComponents)
    .leftJoin(salaryComponents, eq(employeeSalaryComponents.componentId, salaryComponents.id))
    .where(and(
      eq(employeeSalaryComponents.employeeId, employeeId),
      eq(employeeSalaryComponents.isRecurring, true),
      lte(employeeSalaryComponents.effectiveFrom, new Date(year, month - 1, 1)),
      sql`(${employeeSalaryComponents.effectiveTo} IS NULL OR ${employeeSalaryComponents.effectiveTo} >= ${new Date(year, month - 1, 1)})`
    ));
    
    // Calculate bonuses and allowances
    let totalBonuses = 0;
    let totalAllowances = 0;
    
    components.forEach(comp => {
      const amount = parseFloat(comp.amount);
      const calcAmount = comp.isPercentage ? (baseSalary * amount / 100) : amount;
      
      if (comp.componentType === 'bonus') {
        totalBonuses += calcAmount;
      } else if (comp.componentType === 'allowance') {
        totalAllowances += calcAmount;
      }
    });
    
    // Get one-time adjustments for this month
    const adjustments = await db.select()
      .from(salaryAdjustments)
      .where(and(
        eq(salaryAdjustments.employeeId, employeeId),
        eq(salaryAdjustments.month, month),
        eq(salaryAdjustments.year, year),
        eq(salaryAdjustments.isApplied, false)
      ));
    
    adjustments.forEach(adj => {
      const amount = parseFloat(adj.amount);
      if (adj.adjustmentType === 'bonus') {
        totalBonuses += amount;
      } else if (adj.adjustmentType === 'deduction') {
        // Handled in deductions section
      }
    });
    
    // Calculate deductions
    let totalDeductions = 0;
    let absenceDeductions = 0;
    let latencyDeductions = 0;
    let otherDeductions = 0;
    
    // Absence deductions
    if (absentDays > 0) {
      if (absenceDeductionPerDay > 0) {
        absenceDeductions = absentDays * absenceDeductionPerDay;
      } else {
        // Auto-calculate based on daily rate
        absenceDeductions = absentDays * dailyRate;
      }
    }
    
    // Latency deductions
    if (totalLateMinutes > 0) {
      latencyDeductions = totalLateMinutes * latencyDeductionPerMinute;
    }
    
    // Other deductions from components
    components.forEach(comp => {
      if (comp.componentType === 'deduction') {
        const amount = parseFloat(comp.amount);
        const calcAmount = comp.isPercentage ? (baseSalary * amount / 100) : amount;
        otherDeductions += calcAmount;
      }
    });
    
    // One-time deduction adjustments
    adjustments.forEach(adj => {
      if (adj.adjustmentType === 'deduction') {
        otherDeductions += parseFloat(adj.amount);
      }
    });
    
    totalDeductions = absenceDeductions + latencyDeductions + otherDeductions;
    
    // Calculate gross and net salary
    const grossSalary = baseSalary + totalBonuses + totalAllowances + overtimePay;
    const taxDeduction = (grossSalary * taxRate) / 100;
    const netSalary = grossSalary - taxDeduction - totalDeductions;
    
    return {
      employeeId,
      employeeName: employee.fullName,
      department: employee.department,
      month,
      year,
      baseSalary,
      totalBonuses,
      totalAllowances,
      overtimePay,
      overtimeHours,
      grossSalary,
      totalDeductions,
      absenceDeductions,
      latencyDeductions,
      otherDeductions,
      taxDeduction,
      netSalary,
      workingDays,
      presentDays,
      absentDays,
      lateDays,
      totalLateMinutes
    };
  } catch (error) {
    throw error;
  }
};

// Generate/Calculate monthly salaries for all employees
export const calculateMonthlySalaries = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const userData = JSON.parse(req.headers.user || '{}');
    
    // Get all employees
    const employees = await db.select({
      id: users.id,
      fullName: users.fullName
    })
    .from(users)
    .where(eq(users.role, 'ROLE_EMPLOYEE'));
    
    const results = [];
    const errors = [];
    
    for (const employee of employees) {
      try {
        // Check if already exists
        const [existing] = await db.select()
          .from(monthlySalaries)
          .where(and(
            eq(monthlySalaries.employeeId, employee.id),
            eq(monthlySalaries.month, parseInt(month)),
            eq(monthlySalaries.year, parseInt(year))
          ))
          .limit(1);
        
        if (existing) {
          continue; // Skip if already calculated
        }
        
        const calculation = await calculateEmployeeSalary(employee.id, parseInt(month), parseInt(year));
        
        // Save to database
        const [salary] = await db.insert(monthlySalaries)
          .values({
            employeeId: calculation.employeeId,
            month: calculation.month,
            year: calculation.year,
            baseSalary: String(calculation.baseSalary),
            totalBonuses: String(calculation.totalBonuses),
            totalAllowances: String(calculation.totalAllowances),
            overtimePay: String(calculation.overtimePay),
            totalDeductions: String(calculation.totalDeductions),
            absenceDeductions: String(calculation.absenceDeductions),
            latencyDeductions: String(calculation.latencyDeductions),
            otherDeductions: String(calculation.otherDeductions),
            taxDeduction: String(calculation.taxDeduction),
            grossSalary: String(calculation.grossSalary),
            netSalary: String(calculation.netSalary),
            workingDays: calculation.workingDays,
            presentDays: calculation.presentDays,
            absentDays: calculation.absentDays,
            lateDays: calculation.lateDays,
            totalLateMinutes: calculation.totalLateMinutes,
            overtimeHours: String(calculation.overtimeHours),
            status: 'calculated',
            calculatedAt: new Date()
          })
          .returning();
        
        // Mark adjustments as applied
        await db.update(salaryAdjustments)
          .set({ isApplied: true, appliedAt: new Date() })
          .where(and(
            eq(salaryAdjustments.employeeId, employee.id),
            eq(salaryAdjustments.month, parseInt(month)),
            eq(salaryAdjustments.year, parseInt(year)),
            eq(salaryAdjustments.isApplied, false)
          ));
        
        // Send notification
        await db.insert(notifications).values({
          userId: employee.id,
          title: '💰 Salary Calculated',
          message: `Your salary for ${month}/${year} has been calculated. Net Salary: $${parseFloat(salary.netSalary).toFixed(2)}`,
          type: 'salary'
        });
        
        results.push(calculation);
      } catch (err) {
        errors.push({ employeeId: employee.id, error: err.message });
      }
    }
    
    res.json({
      message: `Successfully calculated ${results.length} salaries`,
      count: results.length,
      salaries: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SALARY RETRIEVAL ====================

// Get all monthly salaries with filters - Shows ALL active employees with base salary
export const getAllMonthlySalaries = async (req, res) => {
  try {
    const { month, year, status, departmentId } = req.query;
    const userData = JSON.parse(req.headers.user || '{}');
    
    const queryMonth = parseInt(month);
    const queryYear = parseInt(year);
    
    // Get ALL active employees
    let employeeQuery = db.select({
      id: users.id,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      department: users.department,
      departmentId: users.departmentId,
      baseSalary: users.baseSalary
    })
    .from(users)
    .where(eq(users.active, true));
    
    let employees = await employeeQuery;
    
    // Filter by department for managers
    if (userData.role === 'ROLE_MANAGER' && userData.departmentId) {
      employees = employees.filter(e => e.departmentId === userData.departmentId);
    } else if (departmentId) {
      employees = employees.filter(e => e.departmentId === parseInt(departmentId));
    }
    
    // Get calculated salaries for the specified month/year
    let whereConditions = [];
    if (month) whereConditions.push(eq(monthlySalaries.month, queryMonth));
    if (year) whereConditions.push(eq(monthlySalaries.year, queryYear));
    if (status) whereConditions.push(eq(monthlySalaries.status, status));
    
    let salaryQuery = db.select()
      .from(monthlySalaries);
    
    if (whereConditions.length > 0) {
      salaryQuery = salaryQuery.where(and(...whereConditions));
    }
    
    const calculatedSalaries = await salaryQuery;
    
    // Create a map of calculated salaries by employeeId
    const salaryMap = {};
    calculatedSalaries.forEach(s => {
      salaryMap[s.employeeId] = s;
    });
    
    // Merge employees with their calculated salaries (or default values)
    const salaries = employees.map(emp => {
      const calculatedSalary = salaryMap[emp.id];
      
      if (calculatedSalary) {
        // Employee has a calculated salary record
        return {
          id: calculatedSalary.id,
          employeeId: emp.id,
          employeeName: emp.fullName,
          employeeCode: emp.employeeCode,
          department: emp.department,
          departmentId: emp.departmentId,
          month: calculatedSalary.month,
          year: calculatedSalary.year,
          baseSalary: calculatedSalary.baseSalary,
          totalBonuses: calculatedSalary.totalBonuses,
          totalAllowances: calculatedSalary.totalAllowances,
          overtimePay: calculatedSalary.overtimePay,
          totalDeductions: calculatedSalary.totalDeductions,
          absenceDeductions: calculatedSalary.absenceDeductions,
          latencyDeductions: calculatedSalary.latencyDeductions,
          taxDeduction: calculatedSalary.taxDeduction,
          grossSalary: calculatedSalary.grossSalary,
          netSalary: calculatedSalary.netSalary,
          status: calculatedSalary.status,
          calculatedAt: calculatedSalary.calculatedAt,
          approvedAt: calculatedSalary.approvedAt,
          paidAt: calculatedSalary.paidAt
        };
      } else {
        // Employee doesn't have calculated salary - show base salary
        const baseSalary = parseFloat(emp.baseSalary || 0);
        return {
          id: null,
          employeeId: emp.id,
          employeeName: emp.fullName,
          employeeCode: emp.employeeCode,
          department: emp.department,
          departmentId: emp.departmentId,
          month: queryMonth,
          year: queryYear,
          baseSalary: baseSalary.toFixed(2),
          totalBonuses: '0.00',
          totalAllowances: '0.00',
          overtimePay: '0.00',
          totalDeductions: '0.00',
          absenceDeductions: '0.00',
          latencyDeductions: '0.00',
          taxDeduction: '0.00',
          grossSalary: baseSalary.toFixed(2),
          netSalary: baseSalary.toFixed(2),
          status: 'draft',
          calculatedAt: null,
          approvedAt: null,
          paidAt: null
        };
      }
    });
    
    // Filter by status if specified
    let filteredSalaries = salaries;
    if (status) {
      filteredSalaries = salaries.filter(s => s.status === status);
    }
    
    // Calculate summary
    const summary = {
      totalEmployees: filteredSalaries.length,
      totalGrossSalary: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.grossSalary || 0), 0),
      totalNetSalary: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.netSalary || 0), 0),
      totalDeductions: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.totalDeductions || 0), 0),
      totalBonuses: filteredSalaries.reduce((sum, s) => sum + parseFloat(s.totalBonuses || 0), 0),
      statusBreakdown: {
        draft: filteredSalaries.filter(s => s.status === 'draft').length,
        calculated: filteredSalaries.filter(s => s.status === 'calculated').length,
        approved: filteredSalaries.filter(s => s.status === 'approved').length,
        paid: filteredSalaries.filter(s => s.status === 'paid').length
      }
    };
    
    res.json({
      message: 'Monthly salaries retrieved successfully',
      salaries: filteredSalaries,
      summary
    });
  } catch (error) {
    console.error('Error getting monthly salaries:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get salary details for a specific employee
export const getEmployeeSalaryDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
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
      calculatedAt: monthlySalaries.calculatedAt,
      approvedAt: monthlySalaries.approvedAt,
      paidAt: monthlySalaries.paidAt,
      notes: monthlySalaries.notes
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
    
    // Get absence deductions details
    const absences = await db.select()
      .from(absenceDeductions)
      .where(eq(absenceDeductions.monthlySalaryId, salary.id));
    
    // Get latency deductions details
    const latencies = await db.select()
      .from(latencyDeductions)
      .where(eq(latencyDeductions.monthlySalaryId, salary.id));
    
    res.json({
      message: 'Salary details retrieved successfully',
      salary,
      adjustments,
      absences,
      latencies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SALARY ADJUSTMENTS ====================

// Add bonus to employee
export const addBonus = async (req, res) => {
  try {
    const { employeeId, amount, reason, month, year } = req.body;
    
    if (!employeeId || !amount || !reason || !month || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const userData = JSON.parse(req.headers.user || '{}');
    
    const [adjustment] = await db.insert(salaryAdjustments)
      .values({
        employeeId: parseInt(employeeId),
        adjustmentType: 'bonus',
        amount: String(amount),
        reason,
        month: parseInt(month),
        year: parseInt(year),
        createdBy: userData.id,
        isApplied: false
      })
      .returning();
    
    // Send notification
    await db.insert(notifications).values({
      userId: parseInt(employeeId),
      title: '🎉 Bonus Added',
      message: `A bonus of $${amount} has been added to your salary for ${month}/${year}. Reason: ${reason}`,
      type: 'salary'
    });
    
    res.json({
      message: 'Bonus added successfully',
      adjustment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add deduction to employee
export const addDeduction = async (req, res) => {
  try {
    const { employeeId, amount, reason, month, year } = req.body;
    
    if (!employeeId || !amount || !reason || !month || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const userData = JSON.parse(req.headers.user || '{}');
    
    const [adjustment] = await db.insert(salaryAdjustments)
      .values({
        employeeId: parseInt(employeeId),
        adjustmentType: 'deduction',
        amount: String(amount),
        reason,
        month: parseInt(month),
        year: parseInt(year),
        createdBy: userData.id,
        isApplied: false
      })
      .returning();
    
    // Send notification
    await db.insert(notifications).values({
      userId: parseInt(employeeId),
      title: '⚠️ Deduction Applied',
      message: `A deduction of $${amount} has been applied to your salary for ${month}/${year}. Reason: ${reason}`,
      type: 'salary'
    });
    
    res.json({
      message: 'Deduction added successfully',
      adjustment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SALARY STATUS MANAGEMENT ====================

// Approve salary
export const approveSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const userData = JSON.parse(req.headers.user || '{}');
    
    const [salary] = await db.update(monthlySalaries)
      .set({
        status: 'approved',
        approvedBy: userData.id,
        approvedAt: new Date()
      })
      .where(eq(monthlySalaries.id, parseInt(salaryId)))
      .returning();
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Send notification
    await db.insert(notifications).values({
      userId: salary.employeeId,
      title: '✅ Salary Approved',
      message: `Your salary for ${salary.month}/${salary.year} has been approved. Net Salary: $${parseFloat(salary.netSalary).toFixed(2)}`,
      type: 'salary'
    });
    
    res.json({
      message: 'Salary approved successfully',
      salary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark salary as paid
export const markAsPaid = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { paymentMethod, paymentReference } = req.body;
    const userData = JSON.parse(req.headers.user || '{}');
    
    const [salary] = await db.update(monthlySalaries)
      .set({
        status: 'paid',
        paidBy: userData.id,
        paidAt: new Date(),
        paymentMethod,
        paymentReference
      })
      .where(eq(monthlySalaries.id, parseInt(salaryId)))
      .returning();
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Send notification
    await db.insert(notifications).values({
      userId: salary.employeeId,
      title: '💵 Payment Processed',
      message: `Your salary for ${salary.month}/${salary.year} has been paid. Amount: $${parseFloat(salary.netSalary).toFixed(2)}`,
      type: 'success'
    });
    
    res.json({
      message: 'Salary marked as paid successfully',
      salary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SALARY COMPONENTS MANAGEMENT ====================

// Get all salary components
export const getAllComponents = async (req, res) => {
  try {
    const components = await db.select().from(salaryComponents);
    
    res.json({
      message: 'Salary components retrieved successfully',
      components
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign component to employee
export const assignComponentToEmployee = async (req, res) => {
  try {
    const { employeeId, componentId, amount, effectiveFrom, isRecurring, notes } = req.body;
    
    if (!employeeId || !componentId || !amount || !effectiveFrom) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const userData = JSON.parse(req.headers.user || '{}');
    
    const [assignment] = await db.insert(employeeSalaryComponents)
      .values({
        employeeId: parseInt(employeeId),
        componentId: parseInt(componentId),
        amount: String(amount),
        effectiveFrom,
        isRecurring: isRecurring !== false,
        notes,
        createdBy: userData.id
      })
      .returning();
    
    res.json({
      message: 'Component assigned successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee salary components
export const getEmployeeComponents = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const components = await db.select({
      id: employeeSalaryComponents.id,
      amount: employeeSalaryComponents.amount,
      effectiveFrom: employeeSalaryComponents.effectiveFrom,
      effectiveTo: employeeSalaryComponents.effectiveTo,
      isRecurring: employeeSalaryComponents.isRecurring,
      notes: employeeSalaryComponents.notes,
      componentName: salaryComponents.componentName,
      componentType: salaryComponents.componentType,
      isPercentage: salaryComponents.isPercentage
    })
    .from(employeeSalaryComponents)
    .leftJoin(salaryComponents, eq(employeeSalaryComponents.componentId, salaryComponents.id))
    .where(eq(employeeSalaryComponents.employeeId, parseInt(employeeId)));
    
    res.json({
      message: 'Employee components retrieved successfully',
      components
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
