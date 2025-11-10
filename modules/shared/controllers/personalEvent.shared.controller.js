import { db } from '../../../db/index.js';
import { personalEvents, users } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Personal Events Controller
 * Manages user calendar events
 */

// Create personal event
export const createPersonalEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, startDate, endDate, eventType, color } = req.body;

        if (!title || !startDate) {
            return res.status(400).json({
                success: false,
                message: 'Title and start date are required'
            });
        }

        const newEvent = await db.insert(personalEvents).values({
            userId,
            title,
            description,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : new Date(startDate),
            eventType: eventType || 'personal',
            color: color || '#3788d8',
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: newEvent[0]
        });
    } catch (error) {
        console.error('Error creating personal event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event'
        });
    }
};

// Get user's personal events
export const getUserPersonalEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        const events = await db.select()
            .from(personalEvents)
            .where(eq(personalEvents.userId, userId))
            .orderBy(personalEvents.startDate);

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching personal events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events'
        });
    }
};

// Get specific personal event
export const getPersonalEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [event] = await db.select()
            .from(personalEvents)
            .where(and(
                eq(personalEvents.id, id),
                eq(personalEvents.userId, userId)
            ))
            .limit(1);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Error fetching personal event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event'
        });
    }
};

// Update personal event
export const updatePersonalEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, startDate, endDate, eventType, color } = req.body;

        const [existingEvent] = await db.select()
            .from(personalEvents)
            .where(and(
                eq(personalEvents.id, id),
                eq(personalEvents.userId, userId)
            ))
            .limit(1);

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const updatedEvent = await db.update(personalEvents)
            .set({
                title: title || existingEvent.title,
                description,
                startDate: startDate ? new Date(startDate) : existingEvent.startDate,
                endDate: endDate ? new Date(endDate) : existingEvent.endDate,
                eventType: eventType || existingEvent.eventType,
                color: color || existingEvent.color,
                updatedAt: new Date()
            })
            .where(eq(personalEvents.id, id))
            .returning();

        res.json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent[0]
        });
    } catch (error) {
        console.error('Error updating personal event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event'
        });
    }
};

// Delete personal event
export const deletePersonalEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [existingEvent] = await db.select()
            .from(personalEvents)
            .where(and(
                eq(personalEvents.id, id),
                eq(personalEvents.userId, userId)
            ))
            .limit(1);

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        await db.delete(personalEvents)
            .where(eq(personalEvents.id, id));

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting personal event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event'
        });
    }
};
