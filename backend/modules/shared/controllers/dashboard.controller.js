import { db } from '../../../db/index.js';
import { eq, count, and, gte, lte, sql } from 'drizzle-orm';
import { users, departments, payments, salaryRecords, payrollRecords } from '../../../db/schema.js'; // Fixed salaries -> salaryRecords

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Parse user data from headers (set by authentication middleware)
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Base statistics accessible to all roles
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalDepartments = await db.select({ count: count() }).from(departments);

    // Role-specific statistics
    let roleSpecificStats = {};

    if (user.role === 'ROLE_ADMIN') {
      // Admin sees everything
      const totalPayments = await db.select({ count: count() }).from(payments);
      const totalSalaries = await db.select({ count: count() }).from(salaryRecords);

      roleSpecificStats = {
        totalPayments: totalPayments[0]?.count || 0,
        totalSalaries: totalSalaries[0]?.count || 0
      };
    } else if (user.role === 'ROLE_MANAGER') {
      // Manager sees department-specific stats
      const departmentUsers = await db.select({ count: count() })
        .from(users)
        .where(eq(users.departmentId, user.departmentId));

      roleSpecificStats = {
        departmentUsers: departmentUsers[0]?.count || 0
      };
    }

    const stats = {
      totalUsers: totalUsers[0]?.count || 0,
      totalDepartments: totalDepartments[0]?.count || 0,
      ...roleSpecificStats
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
};

// Get user growth chart data
export const getUserGrowthChart = async (req, res) => {
  try {
    // Parse user data from headers (set by authentication middleware)
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user creation data by month for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    let userGrowthData;

    if (user.role === 'ROLE_ADMIN') {
      // Admin sees all user growth
      userGrowthData = await db.select({
        month: sql`EXTRACT(MONTH FROM ${users.createdAt})`,
        year: sql`EXTRACT(YEAR FROM ${users.createdAt})`,
        count: count()
      })
      .from(users)
      .where(and(
        gte(users.createdAt, twelveMonthsAgo)
      ))
      .groupBy(sql`EXTRACT(YEAR FROM ${users.createdAt})`, sql`EXTRACT(MONTH FROM ${users.createdAt})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${users.createdAt})`, sql`EXTRACT(MONTH FROM ${users.createdAt})`);
    } else if (user.role === 'ROLE_MANAGER') {
      // Manager sees department-specific growth
      userGrowthData = await db.select({
        month: sql`EXTRACT(MONTH FROM ${users.createdAt})`,
        year: sql`EXTRACT(YEAR FROM ${users.createdAt})`,
        count: count()
      })
      .from(users)
      .where(and(
        eq(users.departmentId, user.departmentId),
        gte(users.createdAt, twelveMonthsAgo)
      ))
      .groupBy(sql`EXTRACT(YEAR FROM ${users.createdAt})`, sql`EXTRACT(MONTH FROM ${users.createdAt})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${users.createdAt})`, sql`EXTRACT(MONTH FROM ${users.createdAt})`);
    } else {
      // Employee only sees basic info
      userGrowthData = [];
    }

    res.json({
      success: true,
      data: userGrowthData
    });
  } catch (error) {
    console.error('Error getting user growth chart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user growth data',
      error: error.message
    });
  }
};

// Get departments chart data
export const getDepartmentsChart = async (req, res) => {
  try {
    // Parse user data from headers (set by authentication middleware)
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    let departmentData;

    if (user.role === 'ROLE_ADMIN') {
      // Admin sees all departments
      departmentData = await db.select({
        name: departments.departmentName,
        userCount: count()
      })
      .from(departments)
      .leftJoin(users, eq(departments.id, users.departmentId))
      .groupBy(departments.id, departments.departmentName)
      .orderBy(sql`count DESC`);
    } else if (user.role === 'ROLE_MANAGER') {
      // Manager sees their department
      departmentData = await db.select({
        name: departments.departmentName,
        userCount: count()
      })
      .from(departments)
      .leftJoin(users, and(
        eq(departments.id, users.departmentId),
        eq(departments.id, user.departmentId)
      ))
      .where(eq(departments.id, user.departmentId))
      .groupBy(departments.id, departments.departmentName);
    } else {
      // Employee sees minimal data
      departmentData = [{
        name: 'My Department',
        userCount: 1
      }];
    }

    res.json({
      success: true,
      data: departmentData
    });
  } catch (error) {
    console.error('Error getting departments chart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments data',
      error: error.message
    });
  }
};