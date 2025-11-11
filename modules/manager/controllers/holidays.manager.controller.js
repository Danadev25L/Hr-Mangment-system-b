import * as holidayService from '../../../services/holiday.service.js';

/**
 * Manager Holiday Management Controller
 * Handles holiday management for department managers
 * Uses centralized holiday service for business logic
 */

// Get all holidays (manager can view holidays)
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

// Suggest holiday (managers can suggest holidays to admin)
export const suggestHoliday = async (req, res) => {
  try {
    if (!req.body.date) {
      return res.status(400).json({
        message: "Holiday date is required!"
      });
    }

    const suggestionData = {
      date: req.body.date,
      name: req.body.name,
      description: req.body.description,
      isRecurring: req.body.isRecurring
    };

    const suggestion = await holidayService.suggestHoliday(suggestionData);
    
    res.json({
      message: "Holiday suggestion submitted successfully",
      suggestion
    });
  } catch (error) {
    if (error.message === 'Holiday already exists for this date') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || "Some error occurred while submitting holiday suggestion."
    });
  }
};

// Get holiday statistics
export const getOrganizationHolidayStats = async (req, res) => {
  try {
    const statistics = await holidayService.getHolidayStatistics();

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