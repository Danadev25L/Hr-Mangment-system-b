import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { financialInformation, users, departments } from '../db/schema.js';

/**
 * Financial Information Service
 * Centralized business logic for financial information operations
 * Used by admin, manager, and employee controllers
 */

/**
 * Get financial info for a single employee
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>}
 */
export const getEmployeeFinancialInfo = async (userId) => {
  const result = await db.select({
    id: financialInformation.id,
    userId: financialInformation.userId,
    bankName: financialInformation.bankName,
    accountNumber: financialInformation.accountNumber,
    ifscCode: financialInformation.ifscCode,
    panNumber: financialInformation.panNumber,
    aadharNumber: financialInformation.aadharNumber,
    pfAccountNumber: financialInformation.pfAccountNumber,
    esiNumber: financialInformation.esiNumber,
    taxDeduction: financialInformation.taxDeduction,
    providentFund: financialInformation.providentFund,
    professionalTax: financialInformation.professionalTax,
    insurance: financialInformation.insurance,
    otherDeductions: financialInformation.otherDeductions,
    employmentType: financialInformation.employmentType,
    salaryStructure: financialInformation.salaryStructure,
    createdAt: financialInformation.createdAt,
    updatedAt: financialInformation.updatedAt,
    user: {
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      employeeCode: users.employeeCode,
      departmentId: users.departmentId,
      department: users.department
    }
  })
  .from(financialInformation)
  .leftJoin(users, eq(financialInformation.userId, users.id))
  .where(eq(financialInformation.userId, userId))
  .limit(1);

  return result.length > 0 ? result[0] : null;
};

/**
 * Get all financial info records
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>}
 */
export const getAllFinancialInfo = async (filters = {}) => {
  const { departmentId } = filters;

  let query = db.select({
    id: financialInformation.id,
    userId: financialInformation.userId,
    bankName: financialInformation.bankName,
    accountNumber: financialInformation.accountNumber,
    ifscCode: financialInformation.ifscCode,
    panNumber: financialInformation.panNumber,
    aadharNumber: financialInformation.aadharNumber,
    pfAccountNumber: financialInformation.pfAccountNumber,
    esiNumber: financialInformation.esiNumber,
    taxDeduction: financialInformation.taxDeduction,
    providentFund: financialInformation.providentFund,
    professionalTax: financialInformation.professionalTax,
    insurance: financialInformation.insurance,
    otherDeductions: financialInformation.otherDeductions,
    employmentType: financialInformation.employmentType,
    salaryStructure: financialInformation.salaryStructure,
    user: {
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      employeeCode: users.employeeCode,
      departmentId: users.departmentId,
      department: users.department
    }
  })
  .from(financialInformation)
  .leftJoin(users, eq(financialInformation.userId, users.id));

  const result = await query;

  // Filter by department if specified
  if (departmentId) {
    return result.filter(f => f.user.departmentId === parseInt(departmentId));
  }

  return result;
};

/**
 * Get financial info for employees in a department
 * @param {number} departmentId - Department ID
 * @returns {Promise<Array>}
 */
export const getDepartmentFinancialInfo = async (departmentId) => {
  return await getAllFinancialInfo({ departmentId });
};

/**
 * Get financial statistics for a department
 * @param {number} departmentId - Department ID
 * @returns {Promise<Object>}
 */
export const getDepartmentFinancialStatistics = async (departmentId) => {
  const financialData = await getDepartmentFinancialInfo(departmentId);

  const employmentTypes = {
    fullTime: financialData.filter(f => f.employmentType === 'full-time').length,
    partTime: financialData.filter(f => f.employmentType === 'part-time').length,
    contract: financialData.filter(f => f.employmentType === 'contract').length,
    intern: financialData.filter(f => f.employmentType === 'intern').length
  };

  const deductionStats = {
    averageTaxDeduction: financialData.reduce((sum, f) => sum + (parseFloat(f.taxDeduction) || 0), 0) / financialData.length || 0,
    averageProvidentFund: financialData.reduce((sum, f) => sum + (parseFloat(f.providentFund) || 0), 0) / financialData.length || 0,
    averageProfessionalTax: financialData.reduce((sum, f) => sum + (parseFloat(f.professionalTax) || 0), 0) / financialData.length || 0,
    averageInsurance: financialData.reduce((sum, f) => sum + (parseFloat(f.insurance) || 0), 0) / financialData.length || 0
  };

  return {
    totalEmployees: financialData.length,
    employmentTypes,
    deductionStats,
    employeesWithPF: financialData.filter(f => f.pfAccountNumber).length,
    employeesWithESI: financialData.filter(f => f.esiNumber).length,
    employeesWithPAN: financialData.filter(f => f.panNumber).length
  };
};

/**
 * Create financial information
 * @param {Object} financialData - Financial information data
 * @returns {Promise<Object>}
 */
export const createFinancialInfo = async (financialData) => {
  // Check if financial info already exists for this user
  const existing = await getEmployeeFinancialInfo(financialData.userId);
  
  if (existing) {
    throw new Error('Financial information already exists for this employee');
  }

  const result = await db.insert(financialInformation)
    .values({
      ...financialData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return result[0];
};

/**
 * Update financial information
 * @param {number} userId - User ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>}
 */
export const updateFinancialInfo = async (userId, updateData) => {
  const existing = await getEmployeeFinancialInfo(userId);
  
  if (!existing) {
    throw new Error('Financial information not found for this employee');
  }

  const result = await db.update(financialInformation)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(financialInformation.userId, userId))
    .returning();
  
  return result[0];
};

/**
 * Update employment type
 * @param {number} userId - User ID
 * @param {string} employmentType - New employment type
 * @returns {Promise<Object>}
 */
export const updateEmploymentType = async (userId, employmentType) => {
  const validTypes = ['full-time', 'part-time', 'contract', 'intern'];
  
  if (!validTypes.includes(employmentType)) {
    throw new Error(`Invalid employment type. Must be one of: ${validTypes.join(', ')}`);
  }

  return await updateFinancialInfo(userId, { employmentType });
};

/**
 * Delete financial information
 * @param {number} userId - User ID
 * @returns {Promise<boolean>}
 */
export const deleteFinancialInfo = async (userId) => {
  const existing = await getEmployeeFinancialInfo(userId);
  
  if (!existing) {
    throw new Error('Financial information not found for this employee');
  }

  await db.delete(financialInformation)
    .where(eq(financialInformation.userId, userId));
  
  return true;
};

/**
 * Calculate total deductions for an employee
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
export const calculateTotalDeductions = async (userId) => {
  const info = await getEmployeeFinancialInfo(userId);
  
  if (!info) {
    return 0;
  }

  const deductions = [
    parseFloat(info.taxDeduction) || 0,
    parseFloat(info.providentFund) || 0,
    parseFloat(info.professionalTax) || 0,
    parseFloat(info.insurance) || 0,
    parseFloat(info.otherDeductions) || 0
  ];

  return deductions.reduce((sum, d) => sum + d, 0);
};
