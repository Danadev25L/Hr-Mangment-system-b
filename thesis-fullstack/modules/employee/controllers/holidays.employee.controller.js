import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysHoliday, organizations, users } from '../../../db/schema.js';

/**
 * Employee Holiday Controller
 * Handles holiday viewing for employees (view organization holidays only)
 */

// Get organization holidays for employee
export const getOrganizationHolidays = async (req, res) => {
  try {
    const employeeId = req.user.id;
    
    // Get employee's organization
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const employeeOrganizationId = employee[0].organizationId;
    
    if (!employeeOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to employee"
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
    .where(eq(daysHoliday.organizationId, employeeOrganizationId))
    .orderBy(daysHoliday.date);
    
    res.json({
      message: "Organization holidays retrieved successfully",
      holidays: result,
      organizationId: employeeOrganizationId
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
    const employeeId = req.user.id;
    const currentDate = new Date();
    
    // Get employee's organization
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const employeeOrganizationId = employee[0].organizationId;
    
    if (!employeeOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to employee"
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
    .where(eq(daysHoliday.organizationId, employeeOrganizationId))
    .orderBy(daysHoliday.date);
    
    // Filter upcoming holidays
    const upcomingHolidays = result.filter(holiday => new Date(holiday.date) >= currentDate);
    
    res.json({
      message: "Upcoming organization holidays retrieved successfully",
      holidays: upcomingHolidays,
      organizationId: employeeOrganizationId
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
    const employeeId = req.user.id;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required parameters"
      });
    }
    
    // Get employee's organization
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const employeeOrganizationId = employee[0].organizationId;
    
    if (!employeeOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to employee"
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
    .where(eq(daysHoliday.organizationId, employeeOrganizationId))
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
      organizationId: employeeOrganizationId
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
    const employeeId = req.user.id;
    
    // Get employee's organization
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const employeeOrganizationId = employee[0].organizationId;
    
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
        eq(daysHoliday.organizationId, employeeOrganizationId)
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

// Get today's holiday status
export const getTodayHolidayStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    // Get employee's organization
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const employeeOrganizationId = employee[0].organizationId;
    
    if (!employeeOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to employee"
      });
    }

    // Check if today is a holiday
    const todayHoliday = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      name: daysHoliday.name,
      description: daysHoliday.description,
      isRecurring: daysHoliday.isRecurring
    })
    .from(daysHoliday)
    .where(eq(daysHoliday.organizationId, employeeOrganizationId))
    .limit(1);
    
    // Filter to find today's holiday (basic date comparison)
    const todayString = today.toISOString().split('T')[0];
    const holidayToday = todayHoliday.find(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayString = holidayDate.toISOString().split('T')[0];
      return holidayString === todayString;
    });
    
    const isHoliday = !!holidayToday;
    
    res.json({
      message: "Today's holiday status retrieved successfully",
      isHoliday,
      holidayInfo: isHoliday ? holidayToday : null,
      date: today,
      organizationId: employeeOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while checking today's holiday status."
    });
  }
};

// Get next upcoming holiday
export const getNextHoliday = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const currentDate = new Date();
    
    // Get employee's organization
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const employeeOrganizationId = employee[0].organizationId;
    
    if (!employeeOrganizationId) {
      return res.status(403).json({
        message: "No organization assigned to employee"
      });
    }

    const result = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      name: daysHoliday.name,
      description: daysHoliday.description,
      isRecurring: daysHoliday.isRecurring
    })
    .from(daysHoliday)
    .where(eq(daysHoliday.organizationId, employeeOrganizationId))
    .orderBy(daysHoliday.date);
    
    // Find next upcoming holiday
    const upcomingHolidays = result.filter(holiday => new Date(holiday.date) > currentDate);
    const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
    
    // Calculate days until next holiday
    let daysUntilHoliday = null;
    if (nextHoliday) {
      const holidayDate = new Date(nextHoliday.date);
      const timeDiff = holidayDate.getTime() - currentDate.getTime();
      daysUntilHoliday = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    
    res.json({
      message: nextHoliday ? "Next holiday retrieved successfully" : "No upcoming holidays found",
      nextHoliday,
      daysUntilHoliday,
      organizationId: employeeOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving next holiday."
    });
  }
};