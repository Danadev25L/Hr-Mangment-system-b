import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysHoliday } from '../../../db/schema.js';

/**
 * Manager Holiday Management Controller
 * Handles holiday management for department managers
 */

// Get all holidays (manager can view holidays)
export const getOrganizationHolidays = async (req, res) => {
  try {
    const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
    
    res.json({
      message: "Holidays retrieved successfully",
      holidays: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving holidays."
    });
  }
};

// Get upcoming holidays
export const getUpcomingHolidays = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
    
    // Filter upcoming holidays
    const upcomingHolidays = result.filter(holiday => new Date(holiday.date) >= currentDate);
    
    res.json({
      message: "Upcoming holidays retrieved successfully",
      holidays: upcomingHolidays
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving upcoming holidays."
    });
  }
};

// Get holidays by month
export const getHolidaysByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required parameters"
      });
    }
    
    const result = await db.select()
    .from(daysHoliday)
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
      year: parseInt(year)
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving holidays by month."
    });
  }
};

// Get single holiday
export const getHoliday = async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);
    
    const result = await db.select()
    .from(daysHoliday)
    .where(eq(daysHoliday.id, holidayId))
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Holiday retrieved successfully",
        holiday: result[0]
      });
    } else {
      res.status(404).json({
        message: `Holiday with id=${holidayId} not found.`
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
    if (!req.body.date) {
      return res.status(400).json({
        message: "Holiday date is required!"
      });
    }

    // Check if holiday already exists
    const existingHoliday = await db.select()
      .from(daysHoliday)
      .where(eq(daysHoliday.date, req.body.date))
      .limit(1);

    if (existingHoliday.length > 0) {
      return res.status(409).json({
        message: "Holiday already exists for this date"
      });
    }

    // Create holiday suggestion
    const suggestionData = {
      date: new Date(req.body.date),
      name: req.body.name?.trim() || 'Holiday Suggestion',
      description: `Suggested by Manager: ${req.body.description?.trim() || 'No description provided'}`,
      isRecurring: req.body.isRecurring || false,
      createdAt: new Date()
    };

    const result = await db.insert(daysHoliday)
      .values(suggestionData)
      .returning();
    
    res.json({
      message: "Holiday suggestion submitted successfully",
      suggestion: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while submitting holiday suggestion."
    });
  }
};

// Get holiday statistics
export const getOrganizationHolidayStats = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Get all holidays
    const allHolidays = await db.select()
      .from(daysHoliday);

    const totalHolidays = allHolidays.length;
    const upcomingHolidays = allHolidays.filter(holiday => new Date(holiday.date) >= currentDate).length;
    const pastHolidays = totalHolidays - upcomingHolidays;
    const recurringHolidays = allHolidays.filter(holiday => holiday.isRecurring).length;

    // Get holidays by month for current year
    const currentYear = currentDate.getFullYear();
    const holidaysByMonth = Array(12).fill(0);
    
    allHolidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getFullYear() === currentYear) {
        holidaysByMonth[holidayDate.getMonth()]++;
      }
    });

    const statistics = {
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
      message: "Holiday statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving holiday statistics."
    });
  }
};