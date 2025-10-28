import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { daysHoliday, organizations, users } from '../../../db/schema.js';

/**
 * Admin Holiday Management Controller
 * Handles system-wide holiday management for administrators
 */

// Create a new holiday date
export const createHoliday = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content cannot be empty!"
      });
    }

    if (!req.body.date) {
      return res.status(400).json({
        message: "Holiday date is required!"
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

    // Check if holiday already exists for this date and organization
    const existingHoliday = await db.select()
      .from(daysHoliday)
      .where(
        and(
          eq(daysHoliday.date, req.body.date),
          eq(daysHoliday.organizationId, req.body.organizationId)
        )
      )
      .limit(1);

    if (existingHoliday.length > 0) {
      return res.status(409).json({
        message: "Holiday already exists for this date and organization"
      });
    }

    // Create holiday date
    const newHoliday = {
      date: new Date(req.body.date),
      name: req.body.name?.trim() || null,
      description: req.body.description?.trim() || null,
      organizationId: req.body.organizationId,
      isRecurring: req.body.isRecurring || false,
      createdAt: new Date()
    };

    // Save holiday date in the database
    const result = await db.insert(daysHoliday)
      .values(newHoliday)
      .returning();
    
    res.json({
      message: "Holiday created successfully",
      holiday: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the holiday."
    });
  }
};

// Get all holidays for all organizations
export const getAllHolidays = async (req, res) => {
  try {
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
    .orderBy(daysHoliday.date);
    
    res.json({
      message: "All holidays retrieved successfully",
      holidays: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving holidays."
    });
  }
};

// Get holidays for a specific organization
export const getOrganizationHolidays = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.organizationId);
    
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
    .where(eq(daysHoliday.organizationId, organizationId))
    .orderBy(daysHoliday.date);
    
    res.json({
      message: "Organization holidays retrieved successfully",
      holidays: result,
      organizationId
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving organization holidays."
    });
  }
};

// Get single holiday
export const getHoliday = async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);
    
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

// Update holiday
export const updateHoliday = async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);
    
    // Prepare update data
    const updateData = {};
    
    if (req.body.date) {
      updateData.date = new Date(req.body.date);
    }
    
    if (req.body.name !== undefined) {
      updateData.name = req.body.name?.trim() || null;
    }
    
    if (req.body.description !== undefined) {
      updateData.description = req.body.description?.trim() || null;
    }
    
    if (req.body.isRecurring !== undefined) {
      updateData.isRecurring = req.body.isRecurring;
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
    
    const result = await db.update(daysHoliday)
      .set(updateData)
      .where(eq(daysHoliday.id, holidayId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Holiday updated successfully",
        holiday: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update holiday with id=${holidayId}. Holiday not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating holiday with id=${req.params.id}`
    });
  }
};

// Delete holiday
export const deleteHoliday = async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);
    
    const result = await db.delete(daysHoliday)
      .where(eq(daysHoliday.id, holidayId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Holiday deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete holiday with id=${holidayId}. Holiday not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete holiday with id=${req.params.id}`
    });
  }
};

// Delete all holidays for an organization
export const deleteOrganizationHolidays = async (req, res) => {
  try {
    const organizationId = parseInt(req.params.organizationId);
    
    const result = await db.delete(daysHoliday)
      .where(eq(daysHoliday.organizationId, organizationId))
      .returning();
    
    res.json({ 
      message: `${result.length} holidays were deleted successfully for organization ${organizationId}!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing organization holidays."
    });
  }
};

// Delete all holidays
export const deleteAllHolidays = async (req, res) => {
  try {
    const result = await db.delete(daysHoliday).returning();
    
    res.json({ 
      message: `${result.length} holidays were deleted successfully!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing all holidays."
    });
  }
};

// Get upcoming holidays
export const getUpcomingHolidays = async (req, res) => {
  try {
    const currentDate = new Date();
    const organizationId = req.query.organizationId ? parseInt(req.query.organizationId) : null;
    
    let query = db.select({
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
    .leftJoin(organizations, eq(daysHoliday.organizationId, organizations.id));
    
    if (organizationId) {
      query = query.where(eq(daysHoliday.organizationId, organizationId));
    }
    
    const result = await query.orderBy(daysHoliday.date);
    
    // Filter upcoming holidays in JavaScript
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

// Get holiday statistics
export const getHolidayStatistics = async (req, res) => {
  try {
    // Get all holidays with organization info
    const allHolidays = await db.select({
      id: daysHoliday.id,
      date: daysHoliday.date,
      isRecurring: daysHoliday.isRecurring,
      organizationId: daysHoliday.organizationId,
      organizationName: organizations.name
    })
    .from(daysHoliday)
    .leftJoin(organizations, eq(daysHoliday.organizationId, organizations.id));

    const currentDate = new Date();
    const totalHolidays = allHolidays.length;
    const upcomingHolidays = allHolidays.filter(holiday => new Date(holiday.date) >= currentDate).length;
    const pastHolidays = totalHolidays - upcomingHolidays;
    const recurringHolidays = allHolidays.filter(holiday => holiday.isRecurring).length;

    // Group by organization
    const byOrganization = {};
    allHolidays.forEach(holiday => {
      const orgId = holiday.organizationId;
      const orgName = holiday.organizationName || 'Unknown';
      
      if (!byOrganization[orgId]) {
        byOrganization[orgId] = {
          organizationName: orgName,
          totalHolidays: 0,
          upcomingHolidays: 0,
          recurringHolidays: 0
        };
      }
      
      byOrganization[orgId].totalHolidays++;
      if (new Date(holiday.date) >= currentDate) {
        byOrganization[orgId].upcomingHolidays++;
      }
      if (holiday.isRecurring) {
        byOrganization[orgId].recurringHolidays++;
      }
    });

    const statistics = {
      summary: {
        totalHolidays,
        upcomingHolidays,
        pastHolidays,
        recurringHolidays
      },
      byOrganization,
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