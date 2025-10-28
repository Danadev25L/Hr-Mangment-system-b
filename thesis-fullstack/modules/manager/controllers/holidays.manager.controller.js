import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysHoliday, organizations, users } from '../../../db/schema.js';

/**
 * Manager Holiday Management Controller
 * Handles holiday management for department managers (view organization holidays)
 */

// Get organization holidays (manager can view their organization's holidays)
export const getOrganizationHolidays = async (req, res) => {
  try {
    const managerId = req.user.id;
    
    // Get manager's organization
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerOrganizationId = manager[0].organizationId;
    
    if (!managerOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to manager"
      });
    }

    const result = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      name: daysHoliday.name,
      description: daysHoliday.description,
      isRecurring: daysHoliday.isRecurring,
      organizationId: daysHoliday.organizationId,
      organization: {
        id: organizations.id,
        name: organizations.name
      }
    })
    .from(daysHoliday)
    .leftJoin(organizations, eq(daysHoliday.organizationId, organizations.id))
    .where(eq(daysHoliday.organizationId, managerOrganizationId))
    .orderBy(daysHoliday.date);
    
    res.json({
      message: "Organization holidays retrieved successfully",
      holidays: result,
      organizationId: managerOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving organization holidays."
    });
  }
};

// Get upcoming organization holidays
export const getUpcomingHolidays = async (req, res) => {
  try {
    const managerId = req.user.id;
    const currentDate = new Date();
    
    // Get manager's organization
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerOrganizationId = manager[0].organizationId;
    
    if (!managerOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to manager"
      });
    }

    const result = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      name: daysHoliday.name,
      description: daysHoliday.description,
      isRecurring: daysHoliday.isRecurring,
      organizationId: daysHoliday.organizationId,
      organization: {
        id: organizations.id,
        name: organizations.name
      }
    })
    .from(daysHoliday)
    .leftJoin(organizations, eq(daysHoliday.organizationId, organizations.id))
    .where(eq(daysHoliday.organizationId, managerOrganizationId))
    .orderBy(daysHoliday.date);
    
    // Filter upcoming holidays
    const upcomingHolidays = result.filter(holiday => new Date(holiday.date) >= currentDate);
    
    res.json({
      message: "Upcoming organization holidays retrieved successfully",
      holidays: upcomingHolidays,
      organizationId: managerOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving upcoming holidays."
    });
  }
};

// Get holidays by month for organization
export const getHolidaysByMonth = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required parameters"
      });
    }
    
    // Get manager's organization
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerOrganizationId = manager[0].organizationId;
    
    if (!managerOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to manager"
      });
    }

    const result = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      name: daysHoliday.name,
      description: daysHoliday.description,
      isRecurring: daysHoliday.isRecurring,
      organizationId: daysHoliday.organizationId
    })
    .from(daysHoliday)
    .where(eq(daysHoliday.organizationId, managerOrganizationId))
    .orderBy(daysHoliday.date);
    
    // Filter by month and year
    const filteredHolidays = result.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getFullYear() === parseInt(year) && 
             holidayDate.getMonth() === parseInt(month) - 1; // Month is 0-indexed
    });
    
    res.json({
      message: "Holidays for the month retrieved successfully",
      holidays: filteredHolidays,
      month: parseInt(month),
      year: parseInt(year),
      organizationId: managerOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving holidays by month."
    });
  }
};

// Get single holiday (from organization only)
export const getHoliday = async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);
    const managerId = req.user.id;
    
    // Get manager's organization
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerOrganizationId = manager[0].organizationId;
    
    const result = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      name: daysHoliday.name,
      description: daysHoliday.description,
      isRecurring: daysHoliday.isRecurring,
      organizationId: daysHoliday.organizationId,
      organization: {
        id: organizations.id,
        name: organizations.name
      }
    })
    .from(daysHoliday)
    .leftJoin(organizations, eq(daysHoliday.organizationId, organizations.id))
    .where(
      and(
        eq(daysHoliday.id, holidayId),
        eq(daysHoliday.organizationId, managerOrganizationId)
      )
    )
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Holiday retrieved successfully",
        holiday: result[0]
      });
    } else {
      res.status(404).json({
        message: `Holiday with id=${holidayId} not found in your organization.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving holiday with id=${req.params.id}`
    });
  }
};

// Suggest holiday (managers can suggest holidays to admin)
export const suggestHoliday = async (req, res) => {
  try {
    const managerId = req.user.id;
    
    if (!req.body.date) {
      return res.status(400).json({
        message: "Holiday date is required!"
      });
    }

    // Get manager's organization
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerOrganizationId = manager[0].organizationId;
    
    if (!managerOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to manager"
      });
    }

    // Check if holiday already exists
    const existingHoliday = await db.select()
      .from(daysHoliday)
      .where(
        and(
          eq(daysHoliday.date, req.body.date),
          eq(daysHoliday.organizationId, managerOrganizationId)
        )
      )
      .limit(1);

    if (existingHoliday.length > 0) {
      return res.status(409).json({
        message: "Holiday already exists for this date in your organization"
      });
    }

    // Create holiday suggestion (managers have limited creation rights)
    const suggestionData = {
      date: new Date(req.body.date),
      name: req.body.name?.trim() || 'Holiday Suggestion',
      description: `Suggested by Manager: ${req.body.description?.trim() || 'No description provided'}`,
      organizationId: managerOrganizationId,
      isRecurring: req.body.isRecurring || false,
      suggestedBy: managerId,
      isPending: true, // Requires admin approval
      createdAt: new Date()
    };

    // For now, create as regular holiday - in a full system, you might have a separate suggestions table
    const result = await db.insert(daysHoliday)
      .values(suggestionData)
      .returning();
    
    res.json({
      message: "Holiday suggestion submitted successfully (subject to admin approval)",
      suggestion: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while submitting holiday suggestion."
    });
  }
};

// Get holiday statistics for organization
export const getOrganizationHolidayStats = async (req, res) => {
  try {
    const managerId = req.user.id;
    const currentDate = new Date();
    
    // Get manager's organization
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);
    
    if (manager.length === 0) {
      return res.status(404).json({
        message: "Manager not found"
      });
    }

    const managerOrganizationId = manager[0].organizationId;
    
    if (!managerOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to manager"
      });
    }

    // Get all holidays for the organization
    const orgHolidays = await db.select()
      .from(daysHoliday)
      .where(eq(daysHoliday.organizationId, managerOrganizationId));

    const totalHolidays = orgHolidays.length;
    const upcomingHolidays = orgHolidays.filter(holiday => new Date(holiday.date) >= currentDate).length;
    const pastHolidays = totalHolidays - upcomingHolidays;
    const recurringHolidays = orgHolidays.filter(holiday => holiday.isRecurring).length;

    // Get holidays by month for current year
    const currentYear = currentDate.getFullYear();
    const holidaysByMonth = Array(12).fill(0);
    
    orgHolidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getFullYear() === currentYear) {
        holidaysByMonth[holidayDate.getMonth()]++;
      }
    });

    const statistics = {
      organizationId: managerOrganizationId,
      summary: {
        totalHolidays,
        upcomingHolidays,
        pastHolidays,
        recurringHolidays
      },
      holidaysByMonth,
      currentYear,
      generatedAt: new Date()
    };

    res.json({
      message: "Organization holiday statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving holiday statistics."
    });
  }
};