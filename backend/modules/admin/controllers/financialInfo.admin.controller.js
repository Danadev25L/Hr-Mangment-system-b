import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { financialInformation, users } from '../../../db/schema.js';

/**
 * Admin Financial Information Controller
 * Handles system-wide financial information management for administrators
 */

// Create financial information for any employee
export const createFinancialInfo = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content can not be empty!"
      });
    }

    // Check if financial information already exists for this user
    const existingInfo = await db.select()
      .from(financialInformation)
      .where(eq(financialInformation.userId, req.body.userId));

    if (existingInfo.length > 0) {
      return res.status(403).json({
        message: "Financial Information Already Exists for this User"
      });
    }

    // Create a UserFinancialInformation
    const newUserFinancialInfo = {
      employmentType: req.body.employmentType?.trim() || null,
      salaryBasic: req.body.salaryBasic || 0,
      salaryGross: req.body.salaryGross || 0,
      salaryNet: req.body.salaryNet || 0,
      allowanceHouseRent: req.body.allowanceHouseRent || 0,
      allowanceMedical: req.body.allowanceMedical || 0,
      allowanceSpecial: req.body.allowanceSpecial || 0,
      allowanceFuel: req.body.allowanceFuel || 0,
      allowancePhoneBill: req.body.allowancePhoneBill || 0,
      allowanceOther: req.body.allowanceOther || 0,
      allowanceTotal: req.body.allowanceTotal || 0,
      bankName: req.body.bankName?.trim() || null,
      accountName: req.body.accountName?.trim() || null,
      accountNumber: req.body.accountNumber?.trim() || null,
      iban: req.body.iban?.trim() || null,
      userId: req.body.userId
    };

    // Save UserFinancialInformation in the database
    const result = await db.insert(financialInformation)
      .values(newUserFinancialInfo)
      .returning();
    
    res.json({
      message: "Financial information created successfully",
      financialInfo: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the Financial Information."
    });
  }
};

// Retrieve all financial information records
export const getAllFinancialInfo = async (req, res) => {
  try {
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
        role: users.role
      }
    })
    .from(financialInformation)
    .leftJoin(users, eq(financialInformation.userId, users.id));
    
    res.json({
      message: "All financial information retrieved successfully",
      records: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving financial information."
    });
  }
};

// Get financial information for a specific employee
export const getEmployeeFinancialInfo = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
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
        role: users.role
      }
    })
    .from(financialInformation)
    .leftJoin(users, eq(financialInformation.userId, users.id))
    .where(eq(financialInformation.userId, userId))
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

// Get financial information record by ID
export const getFinancialInfoById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
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
        role: users.role
      }
    })
    .from(financialInformation)
    .leftJoin(users, eq(financialInformation.userId, users.id))
    .where(eq(financialInformation.id, id))
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Financial information retrieved successfully",
        financialInfo: result[0]
      });
    } else {
      res.status(404).json({
        message: `Financial Information with id=${id} not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving Financial Information with id=${req.params.id}`
    });
  }
};

// Update financial information
export const updateFinancialInfo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const updateData = {
      employmentType: req.body.employmentType?.trim() || null,
      salaryBasic: req.body.salaryBasic || 0,
      salaryGross: req.body.salaryGross || 0,
      salaryNet: req.body.salaryNet || 0,
      allowanceHouseRent: req.body.allowanceHouseRent || 0,
      allowanceMedical: req.body.allowanceMedical || 0,
      allowanceSpecial: req.body.allowanceSpecial || 0,
      allowanceFuel: req.body.allowanceFuel || 0,
      allowancePhoneBill: req.body.allowancePhoneBill || 0,
      allowanceOther: req.body.allowanceOther || 0,
      allowanceTotal: req.body.allowanceTotal || 0,
      bankName: req.body.bankName?.trim() || null,
      accountName: req.body.accountName?.trim() || null,
      accountNumber: req.body.accountNumber?.trim() || null,
      iban: req.body.iban?.trim() || null
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const result = await db.update(financialInformation)
      .set(updateData)
      .where(eq(financialInformation.id, id))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Financial information updated successfully.",
        financialInfo: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update Financial Information with id=${id}. Maybe record was not found!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating Financial Information with id=${req.params.id}`
    });
  }
};

// Delete financial information
export const deleteFinancialInfo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.delete(financialInformation)
      .where(eq(financialInformation.id, id))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Financial information deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete Financial Information with id=${id}. Maybe record was not found!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete Financial Information with id=${req.params.id}`
    });
  }
};

// Delete all financial information records
export const deleteAllFinancialInfo = async (req, res) => {
  try {
    const result = await db.delete(financialInformation).returning();
    
    res.json({ 
      message: `${result.length} Financial Information records were deleted successfully!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing all Financial Information records."
    });
  }
};

// Get financial statistics
export const getFinancialStatistics = async (req, res) => {
  try {
    // Get all financial records with user info
    const allRecords = await db.select({
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
    .leftJoin(users, eq(financialInformation.userId, users.id));

    // Calculate statistics
    const totalRecords = allRecords.length;
    const totalBasicSalary = allRecords.reduce((sum, record) => sum + (record.salaryBasic || 0), 0);
    const totalGrossSalary = allRecords.reduce((sum, record) => sum + (record.salaryGross || 0), 0);
    const totalNetSalary = allRecords.reduce((sum, record) => sum + (record.salaryNet || 0), 0);
    const totalAllowances = allRecords.reduce((sum, record) => sum + (record.allowanceTotal || 0), 0);

    const avgBasicSalary = totalRecords > 0 ? totalBasicSalary / totalRecords : 0;
    const avgGrossSalary = totalRecords > 0 ? totalGrossSalary / totalRecords : 0;
    const avgNetSalary = totalRecords > 0 ? totalNetSalary / totalRecords : 0;
    const avgAllowances = totalRecords > 0 ? totalAllowances / totalRecords : 0;

    // Group by employment type
    const byEmploymentType = {};
    allRecords.forEach(record => {
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
      summary: {
        totalRecords,
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
      message: "Financial statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving financial statistics."
    });
  }
};