import { eq } from 'drizzle-orm';

import { db } from '../../../db/index.js';
import { daysHoliday } from '../../../db/schema.js';

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

    console.log('Received request body:', req.body);

    // Parse the date string to a proper Date object
    const dateObj = new Date(req.body.date);
    
    // Validate that the date is valid
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        message: "Invalid date format!"
      });
    }

    // Check if holiday already exists for this date
    const existingHoliday = await db.select()
      .from(daysHoliday)
      .where(eq(daysHoliday.date, dateObj))
      .limit(1);

    if (existingHoliday.length > 0) {
      return res.status(409).json({
        message: "Holiday already exists for this date"
      });
    }

    // Create holiday date - use ISO string for timestamp
    const newHoliday = {
      date: dateObj.toISOString(),
      name: req.body.name?.trim() || null,
      description: req.body.description?.trim() || null,
      isRecurring: req.body.isRecurring || false
    };

    console.log('Creating holiday with data:', newHoliday);
    console.log('Date object details:', {
      dateString: req.body.date,
      dateObj: dateObj,
      dateType: typeof dateObj,
      isValidDate: !isNaN(dateObj.getTime()),
      toISOString: dateObj.toISOString(),
      constructor: dateObj.constructor.name
    });

    // Save holiday date in the database
    const result = await db.insert(daysHoliday)
      .values(newHoliday)
      .returning();
    
    res.json({
      message: "Holiday created successfully",
      holiday: result[0]
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({
      message: error.message || "Some error occurred while creating the holiday."
    });
  }
};

// Get all holidays
export const getAllHolidays = async (req, res) => {
  try {
    const result = await db.select()
    .from(daysHoliday)
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

// Get holidays for a specific organization (deprecated - returns all holidays)
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

// Delete all holidays for an organization (deprecated - deletes all holidays)
export const deleteOrganizationHolidays = async (req, res) => {
  try {
    const result = await db.delete(daysHoliday)
      .returning();
    
    res.json({ 
      message: `${result.length} holidays were deleted successfully!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing holidays."
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
    
    const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
    
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
    // Get all holidays
    const allHolidays = await db.select()
    .from(daysHoliday);

    const currentDate = new Date();
    const totalHolidays = allHolidays.length;
    const upcomingHolidays = allHolidays.filter(holiday => new Date(holiday.date) >= currentDate).length;
    const pastHolidays = totalHolidays - upcomingHolidays;
    const recurringHolidays = allHolidays.filter(holiday => holiday.isRecurring).length;

    const statistics = {
      summary: {
        totalHolidays,
        upcomingHolidays,
        pastHolidays,
        recurringHolidays
      },
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