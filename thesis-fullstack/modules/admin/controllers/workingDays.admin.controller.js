import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysWorking, organizations } from '../../../db/schema.js';

/**
 * Admin Working Days Controller
 * Handles system-wide working days management for administrators
 */

// Create a new working day
export const createWorkingDay = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content cannot be empty!"
      });
    }

    if (!req.body.day) {
      return res.status(400).json({
        message: "Working day is required!"
      });
    }

    if (!req.body.organizationId) {
      return res.status(400).json({
        message: "Organization ID is required!"
      });
    }

    // Validate organization exists
    const organization = await db.select()
      .from(organizations)
      .where(eq(organizations.id, req.body.organizationId))
      .limit(1);

    if (organization.length === 0) {
      return res.status(404).json({
        message: "Organization not found"
      });
    }

    // Check if working day already exists for this day and organization
    const existingWorkingDay = await db.select()
      .from(daysWorking)
      .where(
        and(
          eq(daysWorking.day, req.body.day),
          eq(daysWorking.organizationId, req.body.organizationId)
        )
      )
      .limit(1);

    if (existingWorkingDay.length > 0) {
      return res.status(409).json({
        message: "Working day already configured for this day and organization"
      });
    }

    // Validate time format (assuming HH:MM format)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (req.body.startingHour && !timeRegex.test(req.body.startingHour)) {
      return res.status(400).json({
        message: "Invalid starting hour format. Use HH:MM format."
      });
    }

    if (req.body.endingHour && !timeRegex.test(req.body.endingHour)) {
      return res.status(400).json({
        message: "Invalid ending hour format. Use HH:MM format."
      });
    }

    // Create working day
    const newWorkingDay = {
      day: req.body.day.trim(),
      startingHour: req.body.startingHour?.trim() || '09:00',
      endingHour: req.body.endingHour?.trim() || '17:00',
      organizationId: req.body.organizationId,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      breakStartTime: req.body.breakStartTime?.trim() || null,
      breakEndTime: req.body.breakEndTime?.trim() || null,
      totalWorkingHours: req.body.totalWorkingHours || null,
      createdAt: new Date()
    };

    // Save working day in the database
    const result = await db.insert(daysWorking)
      .values(newWorkingDay)
      .returning();
    
    res.json({
      message: "Working day created successfully",
      workingDay: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the working day."
    });
  }
};

// Get all working days for all organizations
export const getAllWorkingDays = async (req, res) => {
  try {
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
    .orderBy(daysWorking.organizationId, daysWorking.day);
    
    res.json({
      message: "All working days retrieved successfully",
      workingDays: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving working days."
    });
  }
};

// Get working days for a specific organization
export const getOrganizationWorkingDays = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.organizationId);
    
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
    .where(eq(daysWorking.organizationId, organizationId))
    .orderBy(daysWorking.day);
    
    res.json({
      message: "Organization working days retrieved successfully",
      workingDays: result,
      organizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving organization working days."
    });
  }
};

// Get single working day
export const getWorkingDay = async (req, res) => {
  try {
    const workingDayId = parseInt(req.params.id);
    
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
    .where(eq(daysWorking.id, workingDayId))
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Working day retrieved successfully",
        workingDay: result[0]
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

// Update working day
export const updateWorkingDay = async (req, res) => {
  try {
    const workingDayId = parseInt(req.params.id);
    
    // Prepare update data
    const updateData = {};
    
    if (req.body.day) {
      updateData.day = req.body.day.trim();
    }
    
    if (req.body.startingHour) {
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(req.body.startingHour)) {
        return res.status(400).json({
          message: "Invalid starting hour format. Use HH:MM format."
        });
      }
      updateData.startingHour = req.body.startingHour.trim();
    }
    
    if (req.body.endingHour) {
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(req.body.endingHour)) {
        return res.status(400).json({
          message: "Invalid ending hour format. Use HH:MM format."
        });
      }
      updateData.endingHour = req.body.endingHour.trim();
    }
    
    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive;
    }
    
    if (req.body.breakStartTime !== undefined) {
      updateData.breakStartTime = req.body.breakStartTime?.trim() || null;
    }
    
    if (req.body.breakEndTime !== undefined) {
      updateData.breakEndTime = req.body.breakEndTime?.trim() || null;
    }
    
    if (req.body.totalWorkingHours !== undefined) {
      updateData.totalWorkingHours = req.body.totalWorkingHours;
    }
    
    if (req.body.organizationId) {
      // Validate organization exists
      const organization = await db.select()
        .from(organizations)
        .where(eq(organizations.id, req.body.organizationId))
        .limit(1);

      if (organization.length === 0) {
        return res.status(404).json({
          message: "Organization not found"
        });
      }
      
      updateData.organizationId = req.body.organizationId;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update"
      });
    }
    
    updateData.updatedAt = new Date();
    
    const result = await db.update(daysWorking)
      .set(updateData)
      .where(eq(daysWorking.id, workingDayId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Working day updated successfully",
        workingDay: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update working day with id=${workingDayId}. Working day not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating working day with id=${req.params.id}`
    });
  }
};

// Delete working day
export const deleteWorkingDay = async (req, res) => {
  try {
    const workingDayId = parseInt(req.params.id);
    
    const result = await db.delete(daysWorking)
      .where(eq(daysWorking.id, workingDayId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Working day deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete working day with id=${workingDayId}. Working day not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete working day with id=${req.params.id}`
    });
  }
};

// Delete all working days for an organization
export const deleteOrganizationWorkingDays = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.organizationId);
    
    const result = await db.delete(daysWorking)
      .where(eq(daysWorking.organizationId, organizationId))
      .returning();
    
    res.json({ 
      message: `${result.length} working days were deleted successfully for organization ${organizationId}!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing organization working days."
    });
  }
};

// Delete all working days
export const deleteAllWorkingDays = async (req, res) => {
  try {
    const result = await db.delete(daysWorking).returning();
    
    res.json({ 
      message: `${result.length} working days were deleted successfully!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing all working days."
    });
  }
};

// Get working days statistics
export const getWorkingDaysStatistics = async (req, res) => {
  try {
    // Get all working days with organization info
    const allWorkingDays = await db.select({
      id: daysWorking.id,
      day: daysWorking.day,
      isActive: daysWorking.isActive,
      organizationId: daysWorking.organizationId,
      organizationName: organizations.name
    })
    .from(daysWorking)
    .leftJoin(organizations, eq(daysWorking.organizationId, organizations.id));

    const totalWorkingDays = allWorkingDays.length;
    const activeWorkingDays = allWorkingDays.filter(day => day.isActive).length;
    const inactiveWorkingDays = totalWorkingDays - activeWorkingDays;

    // Group by organization
    const byOrganization = {};
    allWorkingDays.forEach(workingDay => {
      const orgId = workingDay.organizationId;
      const orgName = workingDay.organizationName || 'Unknown';
      
      if (!byOrganization[orgId]) {
        byOrganization[orgId] = {
          organizationName: orgName,
          totalDays: 0,
          activeDays: 0,
          daysList: []
        };
      }
      
      byOrganization[orgId].totalDays++;
      if (workingDay.isActive) {
        byOrganization[orgId].activeDays++;
      }
      byOrganization[orgId].daysList.push(workingDay.day);
    });

    // Group by day of week
    const byDayOfWeek = {};
    allWorkingDays.forEach(workingDay => {
      const day = workingDay.day;
      if (!byDayOfWeek[day]) {
        byDayOfWeek[day] = {
          totalOrganizations: 0,
          activeOrganizations: 0
        };
      }
      
      byDayOfWeek[day].totalOrganizations++;
      if (workingDay.isActive) {
        byDayOfWeek[day].activeOrganizations++;
      }
    });

    const statistics = {
      summary: {
        totalWorkingDays,
        activeWorkingDays,
        inactiveWorkingDays,
        totalOrganizations: Object.keys(byOrganization).length
      },
      byOrganization,
      byDayOfWeek,
      generatedAt: new Date()
    };

    res.json({
      message: "Working days statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving working days statistics."
    });
  }
};