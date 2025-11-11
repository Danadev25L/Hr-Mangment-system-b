import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { expenses, departments, users, notifications } from '../../../db/schema.js';
import {
  notifyExpenseApproved,
  notifyExpenseRejected,
  getAllAdminIds
} from '../../../services/notification.enhanced.service.js';

/**
 * Manager Expense Controller
 * Handles department expense management for managers
 */

// Create and Save a new Expense for department
export const createDepartmentExpense = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content can not be empty!"
      });
    }

    const managerId = req.authData.id;
    
    // Get manager info
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Manager MUST have a department
    if (!manager.departmentId) {
      return res.status(400).json({
        message: "Manager must be assigned to a department to create expenses!"
      });
    }

    // Handle both old and new field formats for compatibility
    const itemName = req.body.itemName || req.body.expenseItemName || '';
    const description = req.body.reason || req.body.description || '';
    const itemStore = req.body.expenseItemStore || req.body.purchasedFrom || '';
    const amount = req.body.amount || req.body.amountSpent;
    const date = req.body.date || req.body.purchaseDate;

    // Validate required fields
    if (!itemName || !amount || !date) {
      return res.status(400).json({
        message: "Item name, amount, and date are required!"
      });
    }

    // Create enhanced reason combining item name and description
    let enhancedReason = itemName;
    if (description && description !== itemName) {
      enhancedReason += ` - ${description}`;
    }
    if (itemStore) {
      enhancedReason += ` (purchased from ${itemStore})`;
    }

    // Create an Expense with proper schema mapping
    // Manager's expense is automatically assigned to their department
    const newExpense = {
      userId: managerId,
      departmentId: manager.departmentId || null, // Automatically set to manager's department, null if not set
      amount: parseInt(amount),
      reason: enhancedReason,
      status: 'pending', // Manager's expenses need admin approval
      date: new Date(date)
    };

    // Save Expense in the database
    const result = await db.insert(expenses)
      .values(newExpense)
      .returning();
    
    res.json({
      message: "Department expense created successfully and pending admin approval",
      expense: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the Expense."
    });
  }
};

// Retrieve all Expenses from the manager's department (including their own and employees')
// Retrieve all Expenses from the manager's department with pagination and filters
export const getDepartmentExpenses = async (req, res) => {
  try {
    const managerId = req.authData.id;

    // Get manager's information
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    if (!manager.departmentId) {
      return res.status(400).json({
        message: "Manager must be assigned to a department!"
      });
    }

    // Get pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [
      eq(expenses.departmentId, manager.departmentId), // Only this department's expenses
      eq(users.departmentId, manager.departmentId) // Verify user is still in the department
    ];

    // Search filter (reason or user name)
    if (search) {
      whereConditions.push(
        sql`(${expenses.reason} ILIKE ${'%' + search + '%'} OR ${users.fullName} ILIKE ${'%' + search + '%'})`
      );
    }

    // Status filter
    if (status && status !== 'all') {
      whereConditions.push(eq(expenses.status, status));
    }

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        sql`${expenses.date} >= ${new Date(startDate)} AND ${expenses.date} <= ${new Date(endDate)}`
      );
    }

    // Get expenses with pagination
    const query = await db.select({
      id: expenses.id,
      userId: expenses.userId,
      userName: users.fullName,
      userRole: users.role,
      username: users.username,
      itemName: expenses.itemName,
      departmentId: expenses.departmentId,
      userDepartment: departments.departmentName,
      reason: expenses.reason,
      amount: expenses.amount,
      status: expenses.status,
      date: expenses.date,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      approvedBy: expenses.approvedBy,
      approvedAt: expenses.approvedAt,
      rejectedBy: expenses.rejectedBy,
      rejectedAt: expenses.rejectedAt,
      paidBy: expenses.paidBy,
      paidAt: expenses.paidAt
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.userId, users.id))
    .leftJoin(departments, eq(expenses.departmentId, departments.id))
    .where(and(...whereConditions))
    .orderBy(sql`${expenses.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

    // Get total count for pagination
    const countResult = await db.select({ count: sql`count(*)` })
      .from(expenses)
      .innerJoin(users, eq(expenses.userId, users.id))
      .where(and(...whereConditions));
    
    const totalCount = parseInt(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Format the data for frontend compatibility
    const formattedExpenses = query.map(expense => ({
      ...expense,
      userName: expense.userRole === 'ROLE_ADMIN' ? 'Admin' : expense.userName,
      departmentName: expense.userDepartment,
      // Add computed fields for backward compatibility
      expenseItemName: expense.reason.split(' (purchased from')[0], // Extract item name
      expenseItemStore: expense.reason.includes('(purchased from') 
        ? expense.reason.split('(purchased from ')[1]?.replace(')', '') 
        : '',
      formattedAmount: `$${expense.amount.toFixed(2)}`,
      statusBadge: expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
      formattedDate: new Date(expense.date).toLocaleDateString(),
      submittedDate: expense.createdAt || expense.date
    }));
    
    res.json({
      success: true,
      message: "Department expenses retrieved successfully",
      data: formattedExpenses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search: search || null,
        status: status || null,
        startDate: startDate || null,
        endDate: endDate || null,
        departmentId: manager.departmentId
      }
    });
  } catch (error) {
    console.error('Error in getDepartmentExpenses:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Some error occurred while retrieving department expenses."
    });
  }
};

// Manager: Get expense by ID with full details
export const getExpenseById = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const expenseId = parseInt(req.params.id);

    // Get manager's information
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager || !manager.departmentId) {
      return res.status(400).json({
        message: "Manager must be assigned to a department!"
      });
    }

    // Query expense with all user details
    const result = await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        itemName: expenses.itemName,
        amount: expenses.amount,
        reason: expenses.reason,
        status: expenses.status,
        date: expenses.date,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        departmentId: expenses.departmentId,
        departmentName: departments.departmentName,
        approvedBy: expenses.approvedBy,
        approvedAt: expenses.approvedAt,
        rejectedBy: expenses.rejectedBy,
        rejectedAt: expenses.rejectedAt,
        paidBy: expenses.paidBy,
        paidAt: expenses.paidAt,
        userName: users.fullName,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .leftJoin(departments, eq(expenses.departmentId, departments.id))
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.departmentId, manager.departmentId) // Ensure manager can only view their department's expenses
        )
      )
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        message: "Expense not found or not in your department"
      });
    }

    const expense = result[0];

    // Fetch approver details if exists
    if (expense.approvedBy) {
      const approver = await db.select({
        fullName: users.fullName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, expense.approvedBy))
      .limit(1);
      
      if (approver.length > 0) {
        expense.approvedByName = approver[0].fullName;
        expense.approvedByEmail = approver[0].email;
      }
    }

    // Fetch rejecter details if exists
    if (expense.rejectedBy) {
      const rejecter = await db.select({
        fullName: users.fullName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, expense.rejectedBy))
      .limit(1);
      
      if (rejecter.length > 0) {
        expense.rejectedByName = rejecter[0].fullName;
        expense.rejectedByEmail = rejecter[0].email;
      }
    }

    // Fetch payer details if exists
    if (expense.paidBy) {
      const payer = await db.select({
        fullName: users.fullName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, expense.paidBy))
      .limit(1);
      
      if (payer.length > 0) {
        expense.paidByName = payer[0].fullName;
        expense.paidByEmail = payer[0].email;
      }
    }

    // Format response
    const formattedExpense = {
      ...expense,
      userName: expense.userRole === 'ROLE_ADMIN' ? 'Admin' : expense.userName,
      departmentName: expense.departmentName || 'Company-wide'
    };

    res.json({
      success: true,
      data: formattedExpense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      message: error.message || "Error fetching expense"
    });
  }
};

// Get department expenses by year
export const getDepartmentExpensesByYear = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const year = parseInt(req.params.year);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }
    
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(${expenses.date}, 'Month') as month, 
        SUM(${expenses.amount}) as expenses 
      FROM ${expenses}
      INNER JOIN ${users} ON ${expenses.userId} = ${users.id}
      WHERE EXTRACT(YEAR FROM ${expenses.date}) = ${year}
      AND ${users.departmentId} = ${manager.departmentId}
      GROUP BY TO_CHAR(${expenses.date}, 'Month'), EXTRACT(MONTH FROM ${expenses.date})
      ORDER BY EXTRACT(MONTH FROM ${expenses.date})
    `);
    
    const formattedData = result.rows.map(item => ({
      month: item.month.trim(),
      expenses: String(item.expenses)
    }));
    
    res.json({
      message: "Department expenses by year retrieved successfully",
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving department expenses by year."
    });
  }
};

// Retrieve Expenses for specific employee in manager's department
export const getDepartmentEmployeeExpenses = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const userId = parseInt(req.params.userId);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Verify employee is in manager's department
    const employee = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!employee || employee.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only view expenses for employees in your department!"
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    let query = db.select({
      id: expenses.id,
      userId: expenses.userId,
      userName: users.fullName,
      username: users.username,
      userDepartment: departments.departmentName,
      reason: expenses.reason,
      amount: expenses.amount,
      status: expenses.status,
      date: expenses.date,
      createdAt: expenses.createdAt
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(expenses.userId, userId))
    .orderBy(sql`${expenses.createdAt} DESC`);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const result = await query;
    
    res.json({
      message: "Employee expenses retrieved successfully",
      expenses: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving employee expenses."
    });
  }
};

// Update expense status (approve/reject employee expenses)
export const updateExpenseStatus = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const expenseId = parseInt(req.params.id);
    const { status, adminNote } = req.body;

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'."
      });
    }

    // Get the expense and verify it's from an employee in the manager's department
    const expenseWithUser = await db.select({
      expense: expenses,
      user: users
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.userId, users.id))
    .where(eq(expenses.id, expenseId))
    .limit(1);

    if (expenseWithUser.length === 0) {
      return res.status(404).json({
        message: "Expense not found!"
      });
    }

    const { expense, user } = expenseWithUser[0];

    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only manage expenses for employees in your department!"
      });
    }

    // Update the expense
    const updateData = { status };
    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    const result = await db.update(expenses)
      .set(updateData)
      .where(eq(expenses.id, expenseId))
      .returning();
    
    if (result.length > 0) {
      // Notify the expense submitter using enhanced notification service
      const expenseData = result[0];
      
      try {
        if (status === 'approved') {
          await notifyExpenseApproved(
            expenseData.userId,
            expenseId,
            expenseData.reason || 'Expense',
            expenseData.amount,
            managerId
          );
        } else if (status === 'rejected') {
          await notifyExpenseRejected(
            expenseData.userId,
            expenseId,
            expenseData.reason || 'Expense',
            expenseData.amount,
            managerId,
            adminNote || 'No reason provided'
          );
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the expense update if notification fails
      }

      res.json({
        message: `Expense status updated to ${status} successfully.`,
        expense: result[0]
      });
    } else {
      res.status(404).json({
        message: `Expense with id=${expenseId} not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating expense status with id=${req.params.id}: ${error.message}`
    });
  }
};

// Update an Expense (for department employees)
export const updateDepartmentExpense = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const expenseId = parseInt(req.params.id);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get the expense and verify it's from the manager's department
    const expenseWithUser = await db.select({
      expense: expenses,
      user: users
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.userId, users.id))
    .where(eq(expenses.id, expenseId))
    .limit(1);

    if (expenseWithUser.length === 0) {
      return res.status(404).json({
        message: "Expense not found!"
      });
    }

    const { user } = expenseWithUser[0];

    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only update expenses for employees in your department!"
      });
    }

    // Prepare update data
    const updateData = {};
    if (req.body.reason) updateData.reason = req.body.reason;
    if (req.body.amount) updateData.amount = parseInt(req.body.amount);
    if (req.body.date) updateData.date = new Date(req.body.date);
    if (req.body.status) updateData.status = req.body.status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update provided."
      });
    }

    const result = await db.update(expenses)
      .set(updateData)
      .where(eq(expenses.id, expenseId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Department expense was updated successfully.",
        expense: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update Expense with id=${expenseId}. Maybe Expense was not found!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating Expense with id=${req.params.id}: ${error.message}`
    });
  }
};

// Delete an Expense (for department employees)
export const deleteDepartmentExpense = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const expenseId = parseInt(req.params.id);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get the expense and verify it's from the manager's department
    const expenseWithUser = await db.select({
      expense: expenses,
      user: users
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.userId, users.id))
    .where(eq(expenses.id, expenseId))
    .limit(1);

    if (expenseWithUser.length === 0) {
      return res.status(404).json({
        message: "Expense not found!"
      });
    }

    const { user } = expenseWithUser[0];

    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only delete expenses for employees in your department!"
      });
    }
    
    const result = await db.delete(expenses)
      .where(eq(expenses.id, expenseId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Department expense was deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete Expense with id=${expenseId}. Maybe Expense was not found!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete Expense with id=${req.params.id}: ${error.message}`
    });
  }
};