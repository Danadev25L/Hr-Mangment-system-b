import { eq, desc, and, inArray } from 'drizzle-orm';

import { db } from '../../../db/index.js';
import { 
    departmentAnnouncements, 
    departments, 
    users, 
    announcementRecipients, 
    notifications 
} from '../../../db/schema.js';
import {
    notifyNewAnnouncement,
    notifyAnnouncementUpdated
} from '../../../services/notification.enhanced.service.js';

// Admin: Get all announcements across all departments
export const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            date: departmentAnnouncements.date,
            departmentId: departmentAnnouncements.departmentId,
            createdBy: departmentAnnouncements.createdBy,
            isActive: departmentAnnouncements.isActive,
            createdAt: departmentAnnouncements.createdAt,
            updatedAt: departmentAnnouncements.updatedAt,
            creator: {
                fullName: users.fullName,
                username: users.username
            },
            department: {
                departmentName: departments.departmentName
            }
        })
        .from(departmentAnnouncements)
        .leftJoin(users, eq(departmentAnnouncements.createdBy, users.id))
        .leftJoin(departments, eq(departmentAnnouncements.departmentId, departments.id))
        .orderBy(desc(departmentAnnouncements.createdAt));

        res.json({ announcements });

    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({
            message: error.message || "Error occurred while retrieving announcements."
        });
    }
};

// Admin: Get single announcement by ID
export const getAnnouncementById = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);

        const [announcement] = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            date: departmentAnnouncements.date,
            departmentId: departmentAnnouncements.departmentId,
            createdBy: departmentAnnouncements.createdBy,
            isActive: departmentAnnouncements.isActive,
            createdAt: departmentAnnouncements.createdAt,
            updatedAt: departmentAnnouncements.updatedAt,
            creator: {
                fullName: users.fullName,
                username: users.username
            },
            department: {
                departmentName: departments.departmentName
            }
        })
        .from(departmentAnnouncements)
        .leftJoin(users, eq(departmentAnnouncements.createdBy, users.id))
        .leftJoin(departments, eq(departmentAnnouncements.departmentId, departments.id))
        .where(eq(departmentAnnouncements.id, announcementId))
        .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        // Get recipients for this announcement
        const recipients = await db.select({
            userId: announcementRecipients.userId,
            isRead: announcementRecipients.isRead,
            readAt: announcementRecipients.readAt,
            user: {
                fullName: users.fullName,
                username: users.username,
                role: users.role
            }
        })
        .from(announcementRecipients)
        .leftJoin(users, eq(announcementRecipients.userId, users.id))
        .where(eq(announcementRecipients.announcementId, announcementId));

        res.json({ 
            announcement,
            recipients
        });

    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({
            message: error.message || "Error occurred while retrieving announcement."
        });
    }
};

// Admin: Create announcement (can create for any department or all departments)
export const createAnnouncement = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                message: "Content cannot be empty!"
            });
        }

        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        const { title, description, date, departmentId, isActive, recipientUserIds } = req.body;

        if (!title || !description || !date) {
            return res.status(400).json({
                message: "Title, description, and date are required!"
            });
        }

        // Validate department if specified
        if (departmentId) {
            const [dept] = await db.select()
                .from(departments)
                .where(eq(departments.id, departmentId))
                .limit(1);

            if (!dept) {
                return res.status(400).json({
                    message: "Invalid department ID!"
                });
            }
        }

        // Create the announcement
        const [newAnnouncement] = await db.insert(departmentAnnouncements)
            .values({
                title,
                description,
                date: new Date(date),
                departmentId: departmentId || null, // null means company-wide
                createdBy: userId,
                isActive: isActive !== undefined ? isActive : true
            })
            .returning();

        // Get recipient user IDs
        let finalRecipientIds = [];
        
        if (recipientUserIds && recipientUserIds.length > 0) {
            // Specific users selected
            if (departmentId) {
                // Verify all selected users belong to the specified department AND are active
                const verifiedUsers = await db.select({ id: users.id })
                    .from(users)
                    .where(and(
                        eq(users.departmentId, departmentId),
                        inArray(users.id, recipientUserIds),
                        inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER']),
                        eq(users.active, true)
                    ));
                finalRecipientIds = verifiedUsers.map(u => u.id);
            } else {
                // Company-wide: verify users exist and are employees/managers AND active
                const verifiedUsers = await db.select({ id: users.id })
                    .from(users)
                    .where(and(
                        inArray(users.id, recipientUserIds),
                        inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER']),
                        eq(users.active, true)
                    ));
                finalRecipientIds = verifiedUsers.map(u => u.id);
            }
        } else {
            // No specific users: notify all eligible users
            if (departmentId) {
                // All ACTIVE users in the specified department
                const departmentUsers = await db.select({ id: users.id })
                    .from(users)
                    .where(and(
                        eq(users.departmentId, departmentId),
                        inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER']),
                        eq(users.active, true)
                    ));
                finalRecipientIds = departmentUsers.map(u => u.id);
            } else {
                // All ACTIVE users company-wide
                const allUsers = await db.select({ id: users.id })
                    .from(users)
                    .where(and(
                        inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER']),
                        eq(users.active, true)
                    ));
                finalRecipientIds = allUsers.map(u => u.id);
            }
        }

        // Add recipients
        if (finalRecipientIds.length > 0) {
            const recipientRecords = finalRecipientIds.map(recipientId => ({
                announcementId: newAnnouncement.id,
                userId: recipientId,
                isRead: false
            }));

            await db.insert(announcementRecipients)
                .values(recipientRecords);

            // Send notifications using the enhanced service
            try {
                await notifyNewAnnouncement(
                    finalRecipientIds,
                    newAnnouncement.id,
                    title
                );
            } catch (notifError) {
                console.error('Error sending notifications:', notifError);
                // Don't fail announcement creation if notifications fail
            }
        }

        res.json({
            message: "Announcement created successfully!",
            announcement: newAnnouncement,
            recipientCount: finalRecipientIds.length
        });

    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            message: error.message || "Error occurred while creating announcement."
        });
    }
};

// Admin: Update announcement
export const updateAnnouncement = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);

        const [announcement] = await db.select()
            .from(departmentAnnouncements)
            .where(eq(departmentAnnouncements.id, announcementId))
            .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        const { title, description, date, departmentId, isActive } = req.body;

        // Validate department if being updated
        if (departmentId && departmentId !== announcement.departmentId) {
            const [dept] = await db.select()
                .from(departments)
                .where(eq(departments.id, departmentId))
                .limit(1);

            if (!dept) {
                return res.status(400).json({
                    message: "Invalid department ID!"
                });
            }
        }

        const updateData = {
            updatedAt: new Date()
        };
        
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (date !== undefined) updateData.date = new Date(date);
        if (departmentId !== undefined) updateData.departmentId = departmentId || null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [updatedAnnouncement] = await db.update(departmentAnnouncements)
            .set(updateData)
            .where(eq(departmentAnnouncements.id, announcementId))
            .returning();

        res.json({
            message: "Announcement updated successfully!",
            announcement: updatedAnnouncement
        });

    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({
            message: error.message || "Error occurred while updating announcement."
        });
    }
};

// Admin: Delete announcement
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);

        const [announcement] = await db.select()
            .from(departmentAnnouncements)
            .where(eq(departmentAnnouncements.id, announcementId))
            .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        // Delete recipients first
        await db.delete(announcementRecipients)
            .where(eq(announcementRecipients.announcementId, announcementId));

        // Delete announcement
        await db.delete(departmentAnnouncements)
            .where(eq(departmentAnnouncements.id, announcementId));

        res.json({
            message: "Announcement deleted successfully!"
        });

    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({
            message: error.message || "Error occurred while deleting announcement."
        });
    }
};

// Admin: Toggle announcement active status
export const toggleAnnouncementStatus = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);
        const { isActive } = req.body;

        const [announcement] = await db.select()
            .from(departmentAnnouncements)
            .where(eq(departmentAnnouncements.id, announcementId))
            .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        const [updatedAnnouncement] = await db.update(departmentAnnouncements)
            .set({ 
                isActive: isActive !== undefined ? isActive : !announcement.isActive,
                updatedAt: new Date()
            })
            .where(eq(departmentAnnouncements.id, announcementId))
            .returning();

        res.json({
            message: `Announcement ${updatedAnnouncement.isActive ? 'activated' : 'deactivated'} successfully!`,
            announcement: updatedAnnouncement
        });

    } catch (error) {
        console.error('Error toggling announcement status:', error);
        res.status(500).json({
            message: error.message || "Error occurred while toggling announcement status."
        });
    }
};
