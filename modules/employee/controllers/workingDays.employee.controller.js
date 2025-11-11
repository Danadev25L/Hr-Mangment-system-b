import * as workingDaysService from '../../../services/workingDays.service.js';

/**
 * Employee Working Days Controller
 * Thin wrapper around workingDays service
 */

// Get organization working days
export const getOrganizationWorkingDays = async (req, res) => {
  try {
    const workingDays = await workingDaysService.getAllWorkingDays();
    
    res.json({
      message: "Organization working days retrieved successfully",
      workingDays
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving organization working days."
    });
  }
};

// Get active working days
export const getActiveWorkingDays = async (req, res) => {
  try {
    const workingDays = await workingDaysService.getActiveWorkingDays();
    
    res.json({
      message: "Active working days retrieved successfully",
      workingDays
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving active working days."
    });
  }
};

// Get single working day
export const getWorkingDay = async (req, res) => {
  try {
    const workingDayId = parseInt(req.params.id);
    const workingDay = await workingDaysService.getWorkingDayById(workingDayId);
    
    if (workingDay) {
      res.json({
        message: "Working day retrieved successfully",
        workingDay
      });
    } else {
      res.status(404).json({
        message: `Working day with id=${workingDayId} not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving working day with id=${req.params.id}`
    });
  }
};

// Get working day by day name
export const getWorkingDayByDay = async (req, res) => {
  try {
    const dayName = req.params.day;
    const workingDay = await workingDaysService.getWorkingDayByDayName(dayName);
    
    if (workingDay) {
      res.json({
        message: `Working day for ${dayName} retrieved successfully`,
        workingDay
      });
    } else {
      res.status(404).json({
        message: `Working day for ${dayName} not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving working day for ${req.params.day}`
    });
  }
};

// Get today's working hours
export const getTodayWorkingHours = async (req, res) => {
  try {
    const workingDay = await workingDaysService.getTodayWorkingHours();
    
    if (workingDay) {
      res.json({
        message: "Today's working hours retrieved successfully",
        workingDay,
        isWorkingDay: workingDay.isActive
      });
    } else {
      res.json({
        message: "Today is not a configured working day",
        workingDay: null,
        isWorkingDay: false
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving today's working hours"
    });
  }
};

// Get weekly schedule
export const getMyWeeklySchedule = async (req, res) => {
  try {
    const schedule = await workingDaysService.getWeeklySchedule();
    
    res.json({
      message: "Weekly schedule retrieved successfully",
      ...schedule
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving weekly schedule"
    });
  }
};

// Check today's work status
export const checkTodayWorkStatus = async (req, res) => {
  try {
    const status = await workingDaysService.checkTodayWorkStatus();
    
    res.json({
      message: "Today's work status checked successfully",
      ...status
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Error checking today's work status"
    });
  }
};