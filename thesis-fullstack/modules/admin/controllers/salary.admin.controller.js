import { eq, sql, desc, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { salaryRecords, overtimeRecords, users, departments, notifications, jobs, payrollRecords, payrollBonuses, payrollAdjustments } from '../../../db/schema.js';

/**
 * Admin Salary Controller
 * Handles system-wide salary management for administrators
 */

// Helper function to create salary-related notifications
const createSalaryNotification = async (userId, title, message, type = 'salary') => {
  try {
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      isRead: false
    });
  } catch (error) {
    // Don't fail salary operations if notifications fail
  }
};

// Generate monthly salary for all employees
export const generateMonthlySalary = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required!"
      });
    }

    // Check if salary already generated for this month/year
    const existingSalaries = await db.select()
      .from(salaryRecords)
      .where(and(
        eq(salaryRecords.month, parseInt(month)),
        eq(salaryRecords.year, parseInt(year))
      ));

    if (existingSalaries.length > 0) {
      return res.status(400).json({
        message: `Salary for ${month}/${year} has already been generated!`
      });
    }

    // Get all employees with their base salary
    const allUsers = await db.select({
      id: users.id,
      fullName: users.fullName,
      baseSalary: users.baseSalary,
      role: users.role,
      departmentId: users.departmentId
    })
    .from(users)
    .where(eq(users.role, 'ROLE_EMPLOYEE'));

    // Get approved overtime for the month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const generatedSalaries = [];

    for (const user of allUsers) {
      // Get approved overtime for this user in the specified month
      const userOvertimes = await db.select()
        .from(overtimeRecords)
        .where(and(
          eq(overtimeRecords.userId, user.id),
          eq(overtimeRecords.status, 'approved'),
          sql`${overtimeRecords.date} >= ${startDate}`,
          sql`${overtimeRecords.date} <= ${endDate}`
        ));

      const totalOvertimeHours = userOvertimes.reduce((total, ot) => total + ot.hoursWorked, 0);
      const overtimeRate = Math.round((user.baseSalary || 0) / 160); // Assuming 160 working hours per month
      const overtimePay = totalOvertimeHours * overtimeRate;
      const grossSalary = (user.baseSalary || 0) + overtimePay;
      const taxDeduction = Math.round(grossSalary * 0.10); // 10% tax
      const netSalary = grossSalary - taxDeduction;

      const salaryRecord = {
        userId: user.id,
        baseSalary: user.baseSalary || 0,
        overtimeHours: totalOvertimeHours,
        overtimeRate: overtimeRate,
        overtimePay: overtimePay,
        grossSalary: grossSalary,
        taxDeduction: taxDeduction,
        netSalary: netSalary,
        month: parseInt(month),
        year: parseInt(year),
        status: 'paid' // Automatically mark as paid
      };

      const [result] = await db.insert(salaryRecords)
        .values(salaryRecord)
        .returning();

      generatedSalaries.push(result);

      // Create notification for employee
      await createSalaryNotification(
        user.id,
        '💰 Monthly Salary Processed',
        `Your salary for ${month}/${year} has been calculated and processed! 
        Gross: $${grossSalary.toLocaleString()}, Net: $${netSalary.toLocaleString()}. 
        ${totalOvertimeHours > 0 ? `Includes ${totalOvertimeHours} overtime hours. ` : ''}
        Payment status: ${salaryRecord.status.toUpperCase()}`
      );
    }

    res.json({
      message: `Successfully generated salary for ${generatedSalaries.length} employees for ${month}/${year}`,
      count: generatedSalaries.length,
      salaries: generatedSalaries
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while generating monthly salary."
    });
  }
};

// Get all salary records with filters
export const getAllSalaryRecords = async (req, res) => {
  try {
    const { month, year, status, userId } = req.query;

    let whereConditions = [];

    if (month) {
      whereConditions.push(eq(salaryRecords.month, parseInt(month)));
    }
    if (year) {
      whereConditions.push(eq(salaryRecords.year, parseInt(year)));
    }
    if (status) {
      whereConditions.push(eq(salaryRecords.status, status));
    }
    if (userId) {
      whereConditions.push(eq(salaryRecords.userId, parseInt(userId)));
    }

    const results = await db.select({
      id: salaryRecords.id,
      userId: salaryRecords.userId,
      userName: users.fullName,
      departmentName: departments.departmentName,
      baseSalary: salaryRecords.baseSalary,
      overtimeHours: salaryRecords.overtimeHours,
      overtimeRate: salaryRecords.overtimeRate,
      overtimePay: salaryRecords.overtimePay,
      grossSalary: salaryRecords.grossSalary,
      taxDeduction: salaryRecords.taxDeduction,
      netSalary: salaryRecords.netSalary,
      month: salaryRecords.month,
      year: salaryRecords.year,
      status: salaryRecords.status,
      generatedAt: salaryRecords.generatedAt,
      approvedAt: salaryRecords.approvedAt,
      paidAt: salaryRecords.paidAt
    })
    .from(salaryRecords)
    .leftJoin(users, eq(salaryRecords.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(salaryRecords.generatedAt));

    res.json({
      message: "Salary records retrieved successfully",
      records: results
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving salary records."
    });
  }
};

// Get salary analytics and statistics
export const getSalaryAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get total salary expenditure by month for the year
    const monthlySalaryExpenditure = await db.execute(sql`
      SELECT 
        month,
        SUM(gross_salary) as total_gross,
        SUM(net_salary) as total_net,
        SUM(overtime_pay) as total_overtime,
        SUM(tax_deduction) as total_tax,
        COUNT(*) as employee_count
      FROM ${salaryRecords}
      WHERE year = ${currentYear}
      GROUP BY month
      ORDER BY month
    `);

    // Get department-wise salary statistics
    const departmentSalaryStats = await db.execute(sql`
      SELECT 
        d.department_name,
        COUNT(sr.*) as employee_count,
        AVG(sr.gross_salary) as avg_gross_salary,
        SUM(sr.gross_salary) as total_gross_salary,
        SUM(sr.net_salary) as total_net_salary,
        SUM(sr.overtime_pay) as total_overtime_pay
      FROM ${salaryRecords} sr
      LEFT JOIN ${users} u ON sr.user_id = u.id
      LEFT JOIN ${departments} d ON u.department_id = d.id
      WHERE sr.year = ${currentYear}
      GROUP BY d.id, d.department_name
      ORDER BY total_gross_salary DESC
    `);

    // Get top earning employees
    const topEarners = await db.select({
      userId: salaryRecords.userId,
      userName: users.fullName,
      departmentName: departments.departmentName,
      totalEarnings: sql`SUM(${salaryRecords.grossSalary})`,
      averageEarnings: sql`AVG(${salaryRecords.grossSalary})`,
      monthsWorked: sql`COUNT(${salaryRecords.id})`
    })
    .from(salaryRecords)
    .leftJoin(users, eq(salaryRecords.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(salaryRecords.year, currentYear))
    .groupBy(salaryRecords.userId, users.fullName, departments.departmentName)
    .orderBy(sql`SUM(${salaryRecords.grossSalary}) DESC`)
    .limit(10);

    // Get overall statistics
    const overallStats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT user_id) as total_employees,
        SUM(gross_salary) as total_gross_expenditure,
        SUM(net_salary) as total_net_expenditure,
        SUM(overtime_pay) as total_overtime_pay,
        SUM(tax_deduction) as total_tax_collected,
        AVG(gross_salary) as avg_monthly_salary,
        COUNT(*) as total_records
      FROM ${salaryRecords}
      WHERE year = ${currentYear}
    `);

    res.json({
      message: "Salary analytics retrieved successfully",
      year: currentYear,
      monthlySalaryExpenditure: monthlySalaryExpenditure.rows,
      departmentSalaryStats: departmentSalaryStats.rows,
      topEarners,
      overallStats: overallStats.rows[0] || {}
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving salary analytics."
    });
  }
};

// Add bonus to employee
export const addEmployeeBonus = async (req, res) => {
  try {
    const { employeeId, amount, reason, month, year } = req.body;

    if (!employeeId || !amount || !reason || !month || !year) {
      return res.status(400).json({
        message: "Employee ID, amount, reason, month, and year are required!"
      });
    }

    const bonusRecord = {
      employeeId: parseInt(employeeId),
      amount: parseInt(amount),
      reason,
      month: parseInt(month),
      year: parseInt(year),
      createdBy: req.authData.id
    };

    const [result] = await db.insert(payrollBonuses)
      .values(bonusRecord)
      .returning();

    // Get employee info for notification
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(employeeId)))
      .limit(1);

    if (employee) {
      await createSalaryNotification(
        employee.id,
        '🎁 Bonus Added!',
        `Congratulations! You've received a bonus of $${amount.toLocaleString()} for ${reason}. This bonus will be included in your ${month}/${year} salary.`,
        'bonus'
      );
    }

    res.json({
      message: "Bonus added successfully!",
      bonus: result
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while adding bonus."
    });
  }
};

// Add salary adjustment
export const addSalaryAdjustment = async (req, res) => {
  try {
    const { employeeId, type, amount, reason, month, year, hours } = req.body;

    if (!employeeId || !type || !amount || !reason || !month || !year) {
      return res.status(400).json({
        message: "Employee ID, type, amount, reason, month, and year are required!"
      });
    }

    const adjustmentRecord = {
      employeeId: parseInt(employeeId),
      type,
      amount: parseInt(amount),
      reason,
      month: parseInt(month),
      year: parseInt(year),
      hours: hours ? parseInt(hours) : null,
      createdBy: req.authData.id
    };

    const [result] = await db.insert(payrollAdjustments)
      .values(adjustmentRecord)
      .returning();

    // Get employee info for notification
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(employeeId)))
      .limit(1);

    if (employee) {
      const adjustmentEmoji = type === 'deduction' ? '📉' : '📈';
      const adjustmentAction = type === 'deduction' ? 'deduction of' : 'adjustment of';
      
      await createSalaryNotification(
        employee.id,
        `${adjustmentEmoji} Salary Adjustment`,
        `A salary ${adjustmentAction} $${amount.toLocaleString()} has been applied to your ${month}/${year} salary. Reason: ${reason}`,
        'adjustment'
      );
    }

    res.json({
      message: "Salary adjustment added successfully!",
      adjustment: result
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while adding salary adjustment."
    });
  }
};

// Update employee base salary
export const updateEmployeeBaseSalary = async (req, res) => {
  try {
    const { employeeId, newBaseSalary, reason } = req.body;

    if (!employeeId || !newBaseSalary) {
      return res.status(400).json({
        message: "Employee ID and new base salary are required!"
      });
    }

    // Get current employee data
    const [currentEmployee] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(employeeId)))
      .limit(1);

    if (!currentEmployee) {
      return res.status(404).json({
        message: "Employee not found!"
      });
    }

    const oldSalary = currentEmployee.baseSalary || 0;
    const salaryChange = newBaseSalary - oldSalary;
    const changeType = salaryChange > 0 ? 'increase' : 'decrease';
    const changeEmoji = salaryChange > 0 ? '📈' : '📉';

    // Update base salary
    const [result] = await db.update(users)
      .set({ baseSalary: parseInt(newBaseSalary) })
      .where(eq(users.id, parseInt(employeeId)))
      .returning();

    // Create notification
    await createSalaryNotification(
      parseInt(employeeId),
      `${changeEmoji} Salary Update`,
      `Your base salary has been updated from $${oldSalary.toLocaleString()} to $${newBaseSalary.toLocaleString()} (${changeType} of $${Math.abs(salaryChange).toLocaleString()}). ${reason ? `Reason: ${reason}` : ''} This change will be reflected in your next salary calculation.`,
      'salary_update'
    );

    res.json({
      message: "Base salary updated successfully!",
      employee: result[0],
      salaryChange: {
        oldSalary,
        newSalary: newBaseSalary,
        difference: salaryChange,
        changeType
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while updating base salary."
    });
  }
};

// Get salary information for any employee (Admin view)
export const getEmployeeSalaryInfo = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    
    if (!employeeId) {
      return res.status(400).json({
        message: "Employee ID is required!"
      });
    }

    // Get employee basic info with current job and department
    const [employee] = await db.select({
      id: users.id,
      fullName: users.fullName,
      baseSalary: users.baseSalary,
      departmentId: users.departmentId,
      departmentName: departments.departmentName,
      role: users.role,
      active: users.active,
      jobId: users.jobId,
      jobTitle: users.jobTitle,
      createdAt: users.createdAt
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(users.id, employeeId))
    .limit(1);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found!"
      });
    }

    // Get current job details if employee has a job assigned
    let currentJob = null;
    let effectiveSalary = employee.baseSalary || 0;
    
    if (employee.jobId) {
      const [jobDetails] = await db.select()
        .from(jobs)
        .where(eq(jobs.id, employee.jobId))
        .limit(1);
      
      if (jobDetails) {
        currentJob = jobDetails;
        effectiveSalary = jobDetails.salary || employee.baseSalary || 0;
      }
    }

    // Get salary records for this employee
    const salaryHistory = await db.select()
      .from(salaryRecords)
      .where(eq(salaryRecords.userId, employeeId))
      .orderBy(desc(salaryRecords.year), desc(salaryRecords.month), desc(salaryRecords.generatedAt))
      .limit(24); // Last 24 months

    // Get overtime records for current year
    const currentYear = new Date().getFullYear();
    const overtimeHistory = await db.select()
      .from(overtimeRecords)
      .where(and(
        eq(overtimeRecords.userId, employeeId),
        sql`EXTRACT(YEAR FROM ${overtimeRecords.date}) = ${currentYear}`
      ))
      .orderBy(desc(overtimeRecords.date));

    // Get bonuses for current year
    const bonusHistory = await db.select()
      .from(payrollBonuses)
      .where(and(
        eq(payrollBonuses.employeeId, employeeId),
        eq(payrollBonuses.year, currentYear)
      ))
      .orderBy(desc(payrollBonuses.createdAt));

    // Get adjustments for current year
    const adjustmentHistory = await db.select()
      .from(payrollAdjustments)
      .where(and(
        eq(payrollAdjustments.employeeId, employeeId),
        eq(payrollAdjustments.year, currentYear)
      ))
      .orderBy(desc(payrollAdjustments.createdAt));

    // Calculate current year totals
    const currentYearSalaries = salaryHistory.filter(record => record.year === currentYear);
    
    const totalEarnings = currentYearSalaries.reduce((sum, record) => sum + (record.grossSalary || 0), 0);
    const totalTaxDeductions = currentYearSalaries.reduce((sum, record) => sum + (record.taxDeduction || 0), 0);
    const totalNetPay = currentYearSalaries.reduce((sum, record) => sum + (record.netSalary || 0), 0);
    const totalOvertimeHours = overtimeHistory.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    const totalBonuses = bonusHistory.reduce((sum, record) => sum + (record.amount || 0), 0);
    const totalAdjustments = adjustmentHistory.reduce((sum, record) => sum + (record.amount || 0), 0);

    const salaryData = {
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        baseSalary: effectiveSalary,
        departmentId: employee.departmentId,
        departmentName: employee.departmentName,
        role: employee.role,
        active: employee.active,
        jobId: employee.jobId,
        jobTitle: employee.jobTitle || currentJob?.jobTitle,
        joinDate: employee.createdAt
      },
      currentJob: currentJob,
      currentYearSummary: {
        totalEarnings,
        totalTaxDeductions,
        totalNetPay,
        totalOvertimeHours,
        totalBonuses,
        totalAdjustments,
        recordsCount: currentYearSalaries.length
      },
      salaryHistory: salaryHistory.slice(0, 12),
      overtimeHistory: overtimeHistory.slice(0, 20),
      bonusHistory: bonusHistory.slice(0, 10),
      adjustmentHistory: adjustmentHistory.slice(0, 10),
      generatedAt: new Date()
    };

    res.json({
      message: "Employee salary information retrieved successfully",
      data: salaryData
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving employee salary information."
    });
  }
};

// Add overtime record for any employee
export const addEmployeeOvertime = async (req, res) => {
  try {
    const { userId, date, hoursWorked, description } = req.body;

    if (!userId || !date || !hoursWorked) {
      return res.status(400).json({
        message: "User ID, date, and hours worked are required!"
      });
    }

    const overtimeRecord = {
      userId: parseInt(userId),
      date: new Date(date),
      hoursWorked: parseInt(hoursWorked),
      description: description || '',
      status: 'approved' // Admin can automatically approve
    };

    const [result] = await db.insert(overtimeRecords)
      .values(overtimeRecord)
      .returning();

    // Create notification
    const [targetUser] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (targetUser) {
      await createSalaryNotification(
        targetUser.id,
        '⏰ Overtime Added',
        `${hoursWorked} hours of overtime for ${new Date(date).toLocaleDateString()} has been added to your record and approved. It will be included in your next salary calculation.`,
        'overtime'
      );
    }

    res.json({
      message: "Overtime record added successfully!",
      overtime: result
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while adding overtime."
    });
  }
};

// Get all overtime records
export const getAllOvertimeRecords = async (req, res) => {
  try {
    const { userId, status, month, year } = req.query;

    let whereConditions = [];

    if (userId) {
      whereConditions.push(eq(overtimeRecords.userId, parseInt(userId)));
    }
    if (status) {
      whereConditions.push(eq(overtimeRecords.status, status));
    }
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      whereConditions.push(sql`${overtimeRecords.date} >= ${startDate}`);
      whereConditions.push(sql`${overtimeRecords.date} <= ${endDate}`);
    }

    const results = await db.select({
      id: overtimeRecords.id,
      userId: overtimeRecords.userId,
      userName: users.fullName,
      departmentName: departments.departmentName,
      date: overtimeRecords.date,
      hoursWorked: overtimeRecords.hoursWorked,
      description: overtimeRecords.description,
      status: overtimeRecords.status,
      approvedAt: overtimeRecords.approvedAt,
      createdAt: overtimeRecords.createdAt
    })
    .from(overtimeRecords)
    .leftJoin(users, eq(overtimeRecords.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(overtimeRecords.createdAt));

    res.json({
      message: "Overtime records retrieved successfully",
      records: results
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving overtime records."
    });
  }
};