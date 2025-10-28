import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { personalEvents } from '../../../db/schema.js';

/**
 * Employee Personal Events Controller
 * Handles personal calendar events for employees (own events only)
 */

// Create a new personal event
export const createPersonalEvent = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content cannot be empty!"
      });
    }

    const userId = req.user.id;
    const requestData = req.body.event || req.body;
    const title = requestData.title || requestData.eventTitle;

    if (!title) {
      return res.status(400).json({
        message: "Event title is required!"
      });
    }

    // Parse the date properly
    let eventDate = new Date();
    if (requestData.date) {
      eventDate = new Date(requestData.date);
    } else if (requestData.eventStartDate) {
      eventDate = new Date(requestData.eventStartDate);
    }

    // Validate the date
    if (isNaN(eventDate.getTime())) {
      eventDate = new Date(); // Fallback to current date if invalid
    }

    // Create personal event
    const newPersonalEvent = {
      userId: userId, // Always use authenticated user's ID
      title: title.trim(),
      description: (requestData.description || requestData.eventDescription || '').trim(),
      date: eventDate,
      isActive: true,
      createdAt: new Date()
    };

    // Save personal event in the database
    const result = await db.insert(personalEvents)
      .values(newPersonalEvent)
      .returning();
    
    res.json({
      message: "Personal event created successfully",
      event: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the personal event."
    });
  }
};

// Get all personal events for current user
export const getMyPersonalEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.select()
      .from(personalEvents)
      .where(eq(personalEvents.userId, userId))
      .orderBy(personalEvents.date);
    
    res.json({
      message: "Personal events retrieved successfully",
      events: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving personal events."
    });
  }
};

// Get upcoming personal events for current user
export const getUpcomingPersonalEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    
    const result = await db.select()
      .from(personalEvents)
      .where(
        and(
          eq(personalEvents.userId, userId),
          // Add date filter for upcoming events if your DB supports it
        )
      )
      .orderBy(personalEvents.date);
    
    // Filter upcoming events in JavaScript
    const upcomingEvents = result.filter(event => new Date(event.date) >= currentDate);
    
    res.json({
      message: "Upcoming personal events retrieved successfully",
      events: upcomingEvents
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving upcoming personal events."
    });
  }
};

// Get personal events for a specific month
export const getPersonalEventsByMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required parameters"
      });
    }
    
    const result = await db.select()
      .from(personalEvents)
      .where(eq(personalEvents.userId, userId))
      .orderBy(personalEvents.date);
    
    // Filter by month and year in JavaScript
    const filteredEvents = result.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === parseInt(year) && 
             eventDate.getMonth() === parseInt(month) - 1; // Month is 0-indexed
    });
    
    res.json({
      message: "Personal events for the month retrieved successfully",
      events: filteredEvents,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving personal events by month."
    });
  }
};

// Get single personal event
export const getPersonalEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const result = await db.select()
      .from(personalEvents)
      .where(
        and(
          eq(personalEvents.id, eventId),
          eq(personalEvents.userId, userId) // Only own events
        )
      )
      .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Personal event retrieved successfully",
        event: result[0]
      });
    } else {
      res.status(404).json({
        message: `Personal event with id=${eventId} not found.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving personal event with id=${req.params.id}`
    });
  }
};

// Update personal event
export const updatePersonalEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if event belongs to the user
    const existingEvent = await db.select()
      .from(personalEvents)
      .where(
        and(
          eq(personalEvents.id, eventId),
          eq(personalEvents.userId, userId)
        )
      )
      .limit(1);
    
    if (existingEvent.length === 0) {
      return res.status(404).json({
        message: "Personal event not found or access denied"
      });
    }
    
    const requestData = req.body.event || req.body;
    
    // Prepare update data
    const updateData = {};
    
    if (requestData.title || requestData.eventTitle) {
      updateData.title = (requestData.title || requestData.eventTitle).trim();
    }
    
    if (requestData.description !== undefined || requestData.eventDescription !== undefined) {
      updateData.description = (requestData.description || requestData.eventDescription || '').trim();
    }
    
    if (requestData.date || requestData.eventStartDate) {
      const eventDate = new Date(requestData.date || requestData.eventStartDate);
      if (!isNaN(eventDate.getTime())) {
        updateData.date = eventDate;
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update"
      });
    }
    
    updateData.updatedAt = new Date();
    
    const result = await db.update(personalEvents)
      .set(updateData)
      .where(eq(personalEvents.id, eventId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Personal event updated successfully",
        event: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update personal event with id=${eventId}.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating personal event with id=${req.params.id}`
    });
  }
};

// Delete personal event
export const deletePersonalEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Check if event belongs to the user before deleting
    const result = await db.delete(personalEvents)
      .where(
        and(
          eq(personalEvents.id, eventId),
          eq(personalEvents.userId, userId)
        )
      )
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Personal event deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete personal event with id=${eventId}. Event not found or access denied.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete personal event with id=${req.params.id}`
    });
  }
};

// Delete all personal events for current user
export const deleteAllMyPersonalEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.delete(personalEvents)
      .where(eq(personalEvents.userId, userId))
      .returning();
    
    res.json({ 
      message: `${result.length} personal events were deleted successfully!` 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while removing all personal events."
    });
  }
};

// Get personal events count and statistics
export const getPersonalEventsStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    
    // Get all events for the user
    const allEvents = await db.select()
      .from(personalEvents)
      .where(eq(personalEvents.userId, userId));
    
    const totalEvents = allEvents.length;
    const upcomingEvents = allEvents.filter(event => new Date(event.date) >= currentDate).length;
    const pastEvents = totalEvents - upcomingEvents;
    
    // Get events by month for the current year
    const currentYear = currentDate.getFullYear();
    const eventsByMonth = Array(12).fill(0);
    
    allEvents.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate.getFullYear() === currentYear) {
        eventsByMonth[eventDate.getMonth()]++;
      }
    });
    
    const stats = {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsByMonth,
      currentYear,
      generatedAt: new Date()
    };
    
    res.json({
      message: "Personal events statistics retrieved successfully",
      stats
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving personal events statistics."
    });
  }
};