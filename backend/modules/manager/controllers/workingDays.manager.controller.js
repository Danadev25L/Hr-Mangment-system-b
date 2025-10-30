import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysWorking, organizations, users } from '../../../db/schema.js';

/**
 * Manager Working Days Controller
 * Handles working days viewing for department managers (view organization working days)
 */

// Get organization working days for manager
export const getOrganizationWorkingDays = async (req, res) => {
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
    .where(eq(daysWorking.organizationId, managerOrganizationId))
    .orderBy(daysWorking.day);
    
    res.json({
      message: "Organization working days retrieved successfully",
      workingDays: result,
      organizationId: managerOrganizationId
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
    .where(eq(daysWorking.organizationId, managerOrganizationId))
    .orderBy(daysWorking.day);
    
    // Filter only active working days
    const activeWorkingDays = result.filter(day => day.isActive);
    
    res.json({
      message: "Active working days retrieved successfully",
      workingDays: activeWorkingDays,
      organizationId: managerOrganizationId
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
        eq(daysWorking.organizationId, managerOrganizationId)
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
        eq(daysWorking.organizationId, managerOrganizationId)
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
    const managerId = req.user.id;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
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
        eq(daysWorking.organizationId, managerOrganizationId)
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
        organizationId: managerOrganizationId
      });
    } else {
      res.json({
        message: `No working day configuration found for ${todayName}`,
        today: todayName,
        date: today,
        isWorkingDay: false,
        workingHours: null,
        organizationId: managerOrganizationId
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving today's working hours."
    });
  }
};

// Get organization working days statistics
export const getOrganizationWorkingDaysStats = async (req, res) => {
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

    // Get all working days for the organization
    const orgWorkingDays = await db.select()
      .from(daysWorking)
      .where(eq(daysWorking.organizationId, managerOrganizationId));

    const totalDays = orgWorkingDays.length;
    const activeDays = orgWorkingDays.filter(day => day.isActive).length;
    const inactiveDays = totalDays - activeDays;

    // Calculate total weekly working hours (for active days)
    let totalWeeklyHours = 0;
    const daysList = [];
    
    orgWorkingDays.forEach(day => {
      if (day.isActive) {
        daysList.push(day.day);
        
        // Calculate hours if we have start and end times
        if (day.startingHour && day.endingHour) {
          const [startHour, startMin] = day.startingHour.split(':').map(Number);
          const [endHour, endMin] = day.endingHour.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const dailyMinutes = endMinutes - startMinutes;
          
          // Subtract break time if available
          if (day.breakStartTime && day.breakEndTime) {
            const [breakStartHour, breakStartMin] = day.breakStartTime.split(':').map(Number);
            const [breakEndHour, breakEndMin] = day.breakEndTime.split(':').map(Number);
            
            const breakStartMinutes = breakStartHour * 60 + breakStartMin;
            const breakEndMinutes = breakEndHour * 60 + breakEndMin;
            const breakDuration = breakEndMinutes - breakStartMinutes;
            
            totalWeeklyHours += (dailyMinutes - breakDuration) / 60;
          } else {
            totalWeeklyHours += dailyMinutes / 60;
          }
        }
      }
    });

    const statistics = {
      organizationId: managerOrganizationId,
      summary: {
        totalConfiguredDays: totalDays,
        activeWorkingDays: activeDays,
        inactiveWorkingDays: inactiveDays,
        totalWeeklyWorkingHours: Math.round(totalWeeklyHours * 100) / 100,
        activeWorkingDaysList: daysList
      },
      workingDaysDetails: orgWorkingDays,
      generatedAt: new Date()
    };

    res.json({
      message: "Organization working days statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving working days statistics."
    });
  }
};