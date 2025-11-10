import { db } from '../../../db/index.js';
import { eq, count, and, gte, lte, sql, desc } from 'drizzle-orm';
import { calendarEvents } from '../../../db/schema.js';

// Get all calendar events
export const getCalendarEvents = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { startDate, endDate, type } = req.query;

    let query = db.select().from(calendarEvents);

    // Apply filters if provided
    const conditions = [];
    if (startDate) {
      conditions.push(gte(calendarEvents.date, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(calendarEvents.date, new Date(endDate)));
    }
    if (type) {
      conditions.push(eq(calendarEvents.type, type));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const events = await query.orderBy(calendarEvents.date);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events'
    });
  }
};

// Get single calendar event
export const getCalendarEvent = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const event = await db.select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)))
      .limit(1);

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event[0]
    });
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar event'
    });
  }
};

// Create calendar event
export const createCalendarEvent = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_MANAGER')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { title, type, date, time, description } = req.body;

    if (!title || !type || !date) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, and date are required'
      });
    }

    const newEvent = await db.insert(calendarEvents)
      .values({
        title,
        type,
        date: new Date(date),
        time: time || null,
        description: description || null,
        createdBy: user.id
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent[0]
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event'
    });
  }
};

// Update calendar event
export const updateCalendarEvent = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_MANAGER')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, type, date, time, description } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (description !== undefined) updateData.description = description;
    updateData.updatedAt = new Date();

    const updatedEvent = await db.update(calendarEvents)
      .set(updateData)
      .where(eq(calendarEvents.id, parseInt(id)))
      .returning();

    if (!updatedEvent || updatedEvent.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent[0]
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calendar event'
    });
  }
};

// Delete calendar event
export const deleteCalendarEvent = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_MANAGER')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const deletedEvent = await db.delete(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)))
      .returning();

    if (!deletedEvent || deletedEvent.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete calendar event'
    });
  }
};

// Get events for today (for notifications)
export const getTodayEvents = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await db.select()
      .from(calendarEvents)
      .where(and(
        gte(calendarEvents.date, today),
        lte(calendarEvents.date, tomorrow)
      ));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching today events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today events'
    });
  }
};

// Get upcoming holidays
export const getUpcomingHolidays = async (req, res) => {
  try {
    const user = req.headers.user ? JSON.parse(req.headers.user) : null;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidays = await db.select()
      .from(calendarEvents)
      .where(and(
        eq(calendarEvents.type, 'holiday'),
        gte(calendarEvents.date, today)
      ))
      .orderBy(calendarEvents.date)
      .limit(5);

    res.json({
      success: true,
      data: holidays
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch holidays'
    });
  }
};
