import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysHoliday } from '../../../db/schema.js';

/**
 * Employee Holiday Controller
 * Handles holiday viewing for employees
 */

// Get all holidays for employee
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

// Get today's holiday status
export const getTodayHolidayStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    // Get all holidays
    const todayHoliday = await db.select()
    .from(daysHoliday);
    
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
      date: today
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
    const currentDate = new Date();
    
    const result = await db.select()
    .from(daysHoliday)
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
      daysUntilHoliday
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving next holiday."
    });
  }
};