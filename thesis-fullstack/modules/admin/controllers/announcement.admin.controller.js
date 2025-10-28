import { eq, desc, and, inArray } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    departmentAnnouncements, 
    departments, 
    users, 
    announcementRecipients, 
    notifications 
} from '../../../db/schema.js';

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

// Admin: Create announcement (can create for any department)
export const createAnnouncement = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                message: "Content cannot be empty!"
            });
        }

        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        const { title, description, date, departmentId, isActive } = req.body;

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
                departmentId: departmentId || null,
                createdBy: userId,
                isActive: isActive !== undefined ? isActive : true
            })
            .returning();

        // Get recipient user IDs
        let recipientUserIds = [];
        
        if (departmentId) {
            // If department specified, notify all users in that department
            const departmentUsers = await db.select({ id: users.id })
                .from(users)
                .where(and(
                    eq(users.departmentId, departmentId),
                    inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER'])
                ));
            
            recipientUserIds = departmentUsers.map(user => user.id);
        } else {
            // If no department (all departments), notify all users
            const allUsers = await db.select({ id: users.id })
                .from(users)
                .where(inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER']));
            
            recipientUserIds = allUsers.map(user => user.id);
        }

        // Add recipients
        if (recipientUserIds.length > 0) {
            const recipientRecords = recipientUserIds.map(recipientId => ({
                announcementId: newAnnouncement.id,
                userId: recipientId
            }));

            await db.insert(announcementRecipients)
                .values(recipientRecords);

            // Create notifications for recipients
            const notificationRecords = recipientUserIds.map(recipientId => ({
                userId: recipientId,
                title: 'New Announcement',
                message: `New announcement: ${title}`,
                type: 'info'
            }));

            await db.insert(notifications)
                .values(notificationRecords);
        }

        res.json({
            message: "Announcement created successfully!",
            announcement: newAnnouncement,
            recipientCount: recipientUserIds.length
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
