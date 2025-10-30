import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysWorking, organizations, users } from '../../../db/schema.js';

/**
 * Employee Working Days Controller
 * Handles working days viewing for employees (view organization working days only)
 */

// Get organization working days for employee
export const getOrganizationWorkingDays = async (req, res) => {
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
      id: daysWorking.id,
      day: daysWorking.day,
      startingHour: daysWorking.startingHour,
      endingHour: daysWorking.endingHour,
      isActive: daysWorking.isActive,
      breakStartTime: daysWorking.breakStartTime,
      breakEndTime: daysWorking.breakEndTime,
      totalWorkingHours: daysWorking.totalWorkingHours,
      organizationId: daysWorking.organizationId,
      organization: {
        id: organizations.id,
        name: organizations.name
      }
    })
    .from(daysWorking)
    .leftJoin(organizations, eq(daysWorking.organizationId, organizations.id))
    .where(eq(daysWorking.organizationId, employeeOrganizationId))
    .orderBy(daysWorking.day);
    
    res.json({
      message: "Organization working days retrieved successfully",
      workingDays: result,
      organizationId: employeeOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving organization working days."
    });
  }
};

// Get active working days for organization
export const getActiveWorkingDays = async (req, res) => {
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
      id: daysWorking.id,
      day: daysWorking.day,
      startingHour: daysWorking.startingHour,
      endingHour: daysWorking.endingHour,
      isActive: daysWorking.isActive,
      breakStartTime: daysWorking.breakStartTime,
      breakEndTime: daysWorking.breakEndTime,
      totalWorkingHours: daysWorking.totalWorkingHours,
      organizationId: daysWorking.organizationId
    })
    .from(daysWorking)
    .where(eq(daysWorking.organizationId, employeeOrganizationId))
    .orderBy(daysWorking.day);
    
    // Filter only active working days
    const activeWorkingDays = result.filter(day => day.isActive);
    
    res.json({
      message: "Active working days retrieved successfully",
      workingDays: activeWorkingDays,
      organizationId: employeeOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving active working days."
    });
  }
};

// Get single working day (from organization only)
export const getWorkingDay = async (req, res) => {
  try {
    const workingDayId = parseInt(req.params.id);
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
      id: daysWorking.id,
      day: daysWorking.day,
      startingHour: daysWorking.startingHour,
      endingHour: daysWorking.endingHour,
      isActive: daysWorking.isActive,
      breakStartTime: daysWorking.breakStartTime,
      breakEndTime: daysWorking.breakEndTime,
      totalWorkingHours: daysWorking.totalWorkingHours,
      organizationId: daysWorking.organizationId,
      organization: {
        id: organizations.id,
        name: organizations.name
      }
    })
    .from(daysWorking)
    .leftJoin(organizations, eq(daysWorking.organizationId, organizations.id))
    .where(
      and(
        eq(daysWorking.id, workingDayId),
        eq(daysWorking.organizationId, employeeOrganizationId)
      )
    )
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Working day retrieved successfully",
        workingDay: result[0]
      });
    } else {
      res.status(404).json({
        message: `Working day with id=${workingDayId} not found in your organization.`
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
      id: daysWorking.id,
      day: daysWorking.day,
      startingHour: daysWorking.startingHour,
      endingHour: daysWorking.endingHour,
      isActive: daysWorking.isActive,
      breakStartTime: daysWorking.breakStartTime,
      breakEndTime: daysWorking.breakEndTime,
      totalWorkingHours: daysWorking.totalWorkingHours,
      organizationId: daysWorking.organizationId
    })
    .from(daysWorking)
    .where(
      and(
        eq(daysWorking.day, dayName),
        eq(daysWorking.organizationId, employeeOrganizationId)
      )
    )
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: `Working day for ${dayName} retrieved successfully`,
        workingDay: result[0]
      });
    } else {
      res.status(404).json({
        message: `Working day for ${dayName} not found in your organization.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving working day for ${req.params.day}`
    });
  }
};

// Get current day working hours
export const getTodayWorkingHours = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
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

    // Get today's working hours
    const result = await db.select({
      id: daysWorking.id,
      day: daysWorking.day,
      startingHour: daysWorking.startingHour,
      endingHour: daysWorking.endingHour,
      isActive: daysWorking.isActive,
      breakStartTime: daysWorking.breakStartTime,
      breakEndTime: daysWorking.breakEndTime,
      totalWorkingHours: daysWorking.totalWorkingHours
    })
    .from(daysWorking)
    .where(
      and(
        eq(daysWorking.day, todayName),
        eq(daysWorking.organizationId, employeeOrganizationId)
      )
    )
    .limit(1);
    
    if (result.length > 0) {
      const workingDay = result[0];
      const isWorkingDay = workingDay.isActive;
      
      res.json({
        message: `Today's working hours retrieved successfully`,
        today: todayName,
        date: today,
        isWorkingDay,
        workingHours: isWorkingDay ? workingDay : null,
        organizationId: employeeOrganizationId
      });
    } else {
      res.json({
        message: `No working day configuration found for ${todayName}`,
        today: todayName,
        date: today,
        isWorkingDay: false,
        workingHours: null,
        organizationId: employeeOrganizationId
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving today's working hours."
    });
  }
};

// Get my weekly schedule
export const getMyWeeklySchedule = async (req, res) => {
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

    // Get all working days for the organization
    const result = await db.select({
      id: daysWorking.id,
      day: daysWorking.day,
      startingHour: daysWorking.startingHour,
      endingHour: daysWorking.endingHour,
      isActive: daysWorking.isActive,
      breakStartTime: daysWorking.breakStartTime,
      breakEndTime: daysWorking.breakEndTime,
      totalWorkingHours: daysWorking.totalWorkingHours
    })
    .from(daysWorking)
    .where(eq(daysWorking.organizationId, employeeOrganizationId))
    .orderBy(daysWorking.day);

    // Organize by day of week in proper order
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklySchedule = {};
    
    daysOrder.forEach(day => {
      const daySchedule = result.find(wd => wd.day === day);
      weeklySchedule[day] = daySchedule || {
        day: day,
        isActive: false,
        startingHour: null,
        endingHour: null,
        breakStartTime: null,
        breakEndTime: null,
        totalWorkingHours: null
      };
    });

    // Calculate weekly totals
    const activeWorkingDays = result.filter(day => day.isActive);
    let totalWeeklyHours = 0;

    activeWorkingDays.forEach(day => {
      if (day.startingHour && day.endingHour) {
        const [startHour, startMin] = day.startingHour.split(':').map(Number);
        const [endHour, endMin] = day.endingHour.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        let dailyMinutes = endMinutes - startMinutes;
        
        // Subtract break time if available
        if (day.breakStartTime && day.breakEndTime) {
          const [breakStartHour, breakStartMin] = day.breakStartTime.split(':').map(Number);
          const [breakEndHour, breakEndMin] = day.breakEndTime.split(':').map(Number);
          
          const breakStartMinutes = breakStartHour * 60 + breakStartMin;
          const breakEndMinutes = breakEndHour * 60 + breakEndMin;
          const breakDuration = breakEndMinutes - breakStartMinutes;
          
          dailyMinutes -= breakDuration;
        }
        
        totalWeeklyHours += dailyMinutes / 60;
      }
    });

    const summary = {
      totalWorkingDays: activeWorkingDays.length,
      totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
      organizationId: employeeOrganizationId
    };

    res.json({
      message: "Weekly schedule retrieved successfully",
      weeklySchedule,
      summary
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving weekly schedule."
    });
  }
};

// Check if today is a working day
export const checkTodayWorkStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
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

    // Get today's working day configuration
    const result = await db.select()
      .from(daysWorking)
      .where(
        and(
          eq(daysWorking.day, todayName),
          eq(daysWorking.organizationId, employeeOrganizationId)
        )
      )
      .limit(1);
    
    const isConfigured = result.length > 0;
    const isWorkingDay = isConfigured && result[0].isActive;
    const workingHours = isWorkingDay ? result[0] : null;

    // Calculate time status if it's a working day
    let timeStatus = null;
    if (isWorkingDay && workingHours) {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMin] = workingHours.startingHour.split(':').map(Number);
      const [endHour, endMin] = workingHours.endingHour.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;

      if (currentTotalMinutes < startTotalMinutes) {
        timeStatus = 'before_work';
      } else if (currentTotalMinutes > endTotalMinutes) {
        timeStatus = 'after_work';
      } else {
        // Check if in break time
        if (workingHours.breakStartTime && workingHours.breakEndTime) {
          const [breakStartHour, breakStartMin] = workingHours.breakStartTime.split(':').map(Number);
          const [breakEndHour, breakEndMin] = workingHours.breakEndTime.split(':').map(Number);
          
          const breakStartMinutes = breakStartHour * 60 + breakStartMin;
          const breakEndMinutes = breakEndHour * 60 + breakEndMin;
          
          if (currentTotalMinutes >= breakStartMinutes && currentTotalMinutes <= breakEndMinutes) {
            timeStatus = 'break_time';
          } else {
            timeStatus = 'work_hours';
          }
        } else {
          timeStatus = 'work_hours';
        }
      }
    }

    res.json({
      message: "Today's work status checked successfully",
      today: todayName,
      date: today,
      isConfigured,
      isWorkingDay,
      workingHours,
      timeStatus,
      organizationId: employeeOrganizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while checking today's work status."
    });
  }
};