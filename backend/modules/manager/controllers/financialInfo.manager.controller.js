import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { financialInformation, users } from '../../../db/schema.js';

/**
 * Manager Financial Information Controller
 * Handles financial information management for department employees
 */

// Get all financial information for department employees
export const getDepartmentFinancialInfo = async (req, res) => {
  try {
    const managerId = req.user.id;
    
    // Get manager's department
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerDepartment = manager[0].departmentId;
    
    if (!managerDepartment) {
      return res.status(403).json({
        message: "No department assigned to manager"
      });
    }

    // Get financial information for all employees in the department
    const result = await db.select({
      id: financialInformation.id,
      employmentType: financialInformation.employmentType,
      salaryBasic: financialInformation.salaryBasic,
      salaryGross: financialInformation.salaryGross,
      salaryNet: financialInformation.salaryNet,
      allowanceHouseRent: financialInformation.allowanceHouseRent,
      allowanceMedical: financialInformation.allowanceMedical,
      allowanceSpecial: financialInformation.allowanceSpecial,
      allowanceFuel: financialInformation.allowanceFuel,
      allowancePhoneBill: financialInformation.allowancePhoneBill,
      allowanceOther: financialInformation.allowanceOther,
      allowanceTotal: financialInformation.allowanceTotal,
      bankName: financialInformation.bankName,
      accountName: financialInformation.accountName,
      accountNumber: financialInformation.accountNumber,
      iban: financialInformation.iban,
      userId: financialInformation.userId,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        baseSalary: users.baseSalary,
        role: users.role,
        departmentId: users.departmentId
      }
    })
    .from(financialInformation)
    .leftJoin(users, eq(financialInformation.userId, users.id))
    .where(eq(users.departmentId, managerDepartment));
    
    res.json({
      message: "Department financial information retrieved successfully",
      records: result,
      department: managerDepartment
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving department financial information."
    });
  }
};

// Get financial information for a specific department employee
export const getEmployeeFinancialInfo = async (req, res) => {
  try {
    const managerId = req.user.id;
    const employeeId = parseInt(req.params.userId);
    
    // Get manager's department
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerDepartment = manager[0].departmentId;
    
    // Check if employee is in manager's department
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }
    
    if (employee[0].departmentId !== managerDepartment) {
      return res.status(403).json({
        message: "Access denied: Employee not in your department"
      });
    }
    
    const result = await db.select({
      id: financialInformation.id,
      employmentType: financialInformation.employmentType,
      salaryBasic: financialInformation.salaryBasic,
      salaryGross: financialInformation.salaryGross,
      salaryNet: financialInformation.salaryNet,
      allowanceHouseRent: financialInformation.allowanceHouseRent,
      allowanceMedical: financialInformation.allowanceMedical,
      allowanceSpecial: financialInformation.allowanceSpecial,
      allowanceFuel: financialInformation.allowanceFuel,
      allowancePhoneBill: financialInformation.allowancePhoneBill,
      allowanceOther: financialInformation.allowanceOther,
      allowanceTotal: financialInformation.allowanceTotal,
      // Hide sensitive banking information - managers can see salary but not banking details
      userId: financialInformation.userId,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        baseSalary: users.baseSalary,
        role: users.role,
        departmentId: users.departmentId
      }
    })
    .from(financialInformation)
    .leftJoin(users, eq(financialInformation.userId, users.id))
    .where(eq(financialInformation.userId, employeeId))
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Employee financial information retrieved successfully",
        financialInfo: result[0]
      });
    } else {
      res.status(404).json({
        message: "No financial information found for this employee."
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving employee financial information."
    });
  }
};

// Get department financial statistics
export const getDepartmentFinancialStatistics = async (req, res) => {
  try {
    const managerId = req.user.id;
    
    // Get manager's department
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerDepartment = manager[0].departmentId;
    
    if (!managerDepartment) {
      return res.status(403).json({
        message: "No department assigned to manager"
      });
    }

    // Get all financial records for department employees
    const departmentRecords = await db.select({
      salaryBasic: financialInformation.salaryBasic,
      salaryGross: financialInformation.salaryGross,
      salaryNet: financialInformation.salaryNet,
      allowanceTotal: financialInformation.allowanceTotal,
      employmentType: financialInformation.employmentType,
      userId: financialInformation.userId,
      userRole: users.role,
      userBaseSalary: users.baseSalary
    })
    .from(financialInformation)
    .leftJoin(users, eq(financialInformation.userId, users.id))
    .where(eq(users.departmentId, managerDepartment));

    // Calculate department statistics
    const totalRecords = departmentRecords.length;
    const totalBasicSalary = departmentRecords.reduce((sum, record) => sum + (record.salaryBasic || 0), 0);
    const totalGrossSalary = departmentRecords.reduce((sum, record) => sum + (record.salaryGross || 0), 0);
    const totalNetSalary = departmentRecords.reduce((sum, record) => sum + (record.salaryNet || 0), 0);
    const totalAllowances = departmentRecords.reduce((sum, record) => sum + (record.allowanceTotal || 0), 0);

    const avgBasicSalary = totalRecords > 0 ? totalBasicSalary / totalRecords : 0;
    const avgGrossSalary = totalRecords > 0 ? totalGrossSalary / totalRecords : 0;
    const avgNetSalary = totalRecords > 0 ? totalNetSalary / totalRecords : 0;
    const avgAllowances = totalRecords > 0 ? totalAllowances / totalRecords : 0;

    // Group by employment type
    const byEmploymentType = {};
    departmentRecords.forEach(record => {
      const type = record.employmentType || 'Unknown';
      if (!byEmploymentType[type]) {
        byEmploymentType[type] = {
          count: 0,
          totalBasic: 0,
          totalGross: 0,
          totalNet: 0,
          totalAllowances: 0
        };
      }
      byEmploymentType[type].count++;
      byEmploymentType[type].totalBasic += record.salaryBasic || 0;
      byEmploymentType[type].totalGross += record.salaryGross || 0;
      byEmploymentType[type].totalNet += record.salaryNet || 0;
      byEmploymentType[type].totalAllowances += record.allowanceTotal || 0;
    });

    const statistics = {
      departmentId: managerDepartment,
      summary: {
        totalEmployees: totalRecords,
        totalBasicSalary: Math.round(totalBasicSalary),
        totalGrossSalary: Math.round(totalGrossSalary),
        totalNetSalary: Math.round(totalNetSalary),
        totalAllowances: Math.round(totalAllowances),
        avgBasicSalary: Math.round(avgBasicSalary),
        avgGrossSalary: Math.round(avgGrossSalary),
        avgNetSalary: Math.round(avgNetSalary),
        avgAllowances: Math.round(avgAllowances)
      },
      byEmploymentType,
      generatedAt: new Date()
    };

    res.json({
      message: "Department financial statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving department financial statistics."
    });
  }
};

// Update employment type for department employee (limited manager access)
export const updateEmployeeEmploymentType = async (req, res) => {
  try {
    const managerId = req.user.id;
    const employeeId = parseInt(req.params.userId);
    
    // Get manager's department
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerDepartment = manager[0].departmentId;
    
    // Check if employee is in manager's department
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }
    
    if (employee[0].departmentId !== managerDepartment) {
      return res.status(403).json({
        message: "Access denied: Employee not in your department"
      });
    }
    
    // Check if financial record exists
    const existingInfo = await db.select()
      .from(financialInformation)
      .where(eq(financialInformation.userId, employeeId))
      .limit(1);
    
    if (existingInfo.length === 0) {
      return res.status(404).json({
        message: "No financial information found for this employee"
      });
    }
    
    // Update only employment type (managers have limited update access)
    const updateData = {
      employmentType: req.body.employmentType?.trim() || null
    };
    
    const result = await db.update(financialInformation)
      .set(updateData)
      .where(eq(financialInformation.userId, employeeId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Employee employment type updated successfully.",
        financialInfo: result[0]
      });
    } else {
      res.status(404).json({
        message: "Cannot update employee financial information."
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while updating employee employment type."
    });
  }
};