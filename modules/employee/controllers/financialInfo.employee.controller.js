import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { financialInformation, users } from '../../../db/schema.js';

/**
 * Employee Financial Information Controller
 * Handles personal financial information for employees
 */

// Get employee's own financial information
export const getMyFinancialInfo = async (req, res) => {
  try {
    const userId = req.authData.id;
    
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
      userId: financialInformation.userId
    })
    .from(financialInformation)
    .where(eq(financialInformation.userId, userId))
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Financial information retrieved successfully",
        financialInfo: result[0]
      });
    } else {
      res.status(404).json({
        message: "No financial information found. Please contact HR to set up your financial details."
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving your financial information."
    });
  }
};

// Update employee's own financial information (limited fields)
export const updateMyFinancialInfo = async (req, res) => {
  try {
    const userId = req.authData.id;

    // Check if financial information exists for this user
    const existingInfo = await db.select()
      .from(financialInformation)
      .where(eq(financialInformation.userId, userId))
      .limit(1);

    // Only allow employees to update banking information, not salary details
    const allowedFields = {
      bankName: req.body.bankName?.trim() || null,
      accountName: req.body.accountName?.trim() || null,
      accountNumber: req.body.accountNumber?.trim() || null,
      iban: req.body.iban?.trim() || null
    };

    // Filter out undefined/null values
    const updateData = {};
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] !== undefined) {
        updateData[key] = allowedFields[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update provided."
      });
    }

    let result;

    if (existingInfo.length > 0) {
      // Update existing record
      result = await db.update(financialInformation)
        .set(updateData)
        .where(eq(financialInformation.userId, userId))
        .returning();
    } else {
      // Create new record with user ID
      const newFinancialInfo = {
        ...updateData,
        userId: userId
      };
      
      result = await db.insert(financialInformation)
        .values(newFinancialInfo)
        .returning();
    }
    
    if (result.length > 0) {
      res.json({
        message: "Financial information updated successfully.",
        financialInfo: result[0]
      });
    } else {
      res.status(500).json({
        message: "Failed to update financial information."
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while updating your financial information."
    });
  }
};

// Get financial summary for employee (read-only overview)
export const getMyFinancialSummary = async (req, res) => {
  try {
    const userId = req.authData.id;

    // Get user basic info
    const [user] = await db.select({
      id: users.id,
      fullName: users.fullName,
      baseSalary: users.baseSalary,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (!user) {
      return res.status(404).json({
        message: "User not found!"
      });
    }

    // Get financial information
    const [financialInfo] = await db.select()
      .from(financialInformation)
      .where(eq(financialInformation.userId, userId))
      .limit(1);

    // Calculate summary
    const summary = {
      employeeInfo: {
        fullName: user.fullName,
        baseSalary: user.baseSalary || 0,
        role: user.role
      },
      salaryInfo: financialInfo ? {
        employmentType: financialInfo.employmentType,
        salaryBasic: financialInfo.salaryBasic || user.baseSalary || 0,
        salaryGross: financialInfo.salaryGross || 0,
        salaryNet: financialInfo.salaryNet || 0
      } : {
        employmentType: 'Not set',
        salaryBasic: user.baseSalary || 0,
        salaryGross: 0,
        salaryNet: 0
      },
      allowances: financialInfo ? {
        houseRent: financialInfo.allowanceHouseRent || 0,
        medical: financialInfo.allowanceMedical || 0,
        special: financialInfo.allowanceSpecial || 0,
        fuel: financialInfo.allowanceFuel || 0,
        phoneBill: financialInfo.allowancePhoneBill || 0,
        other: financialInfo.allowanceOther || 0,
        total: financialInfo.allowanceTotal || 0
      } : {
        houseRent: 0,
        medical: 0,
        special: 0,
        fuel: 0,
        phoneBill: 0,
        other: 0,
        total: 0
      },
      bankingInfo: financialInfo ? {
        bankName: financialInfo.bankName || 'Not provided',
        accountName: financialInfo.accountName || 'Not provided',
        hasAccountNumber: !!financialInfo.accountNumber,
        hasIban: !!financialInfo.iban
      } : {
        bankName: 'Not provided',
        accountName: 'Not provided',
        hasAccountNumber: false,
        hasIban: false
      },
      isComplete: !!financialInfo && !!financialInfo.bankName && !!financialInfo.accountNumber
    };

    res.json({
      message: "Financial summary retrieved successfully",
      summary
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving your financial summary."
    });
  }
};