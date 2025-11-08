import * as holidayService from '../../../services/holiday.service.js';

/**
 * Employee Holiday Controller
 * Handles holiday viewing for employees
 * Uses centralized holiday service for business logic
 */

// Get all holidays for employee
export const getOrganizationHolidays = async (req, res) => {
  try {
    const holidays = await holidayService.getAllHolidays();
    
    res.json({
      message: "Holidays retrieved successfully",
      holidays
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
    const holidays = await holidayService.getUpcomingHolidays();
    
    res.json({
      message: "Upcoming holidays retrieved successfully",
      holidays
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
    
    const holidays = await holidayService.getHolidaysByMonth(year, month);
    
    res.json({
      message: "Holidays for the month retrieved successfully",
      holidays,
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
    
    const holiday = await holidayService.getHolidayById(holidayId);
    
    if (holiday) {
      res.json({
        message: "Holiday retrieved successfully",
        holiday
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
    const status = await holidayService.getTodayHolidayStatus();
    
    res.json({
      message: "Today's holiday status retrieved successfully",
      ...status
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
    const result = await holidayService.getNextHoliday();
    
    res.json({
      message: result.nextHoliday ? "Next holiday retrieved successfully" : "No upcoming holidays found",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving next holiday."
    });
  }
};