import { eq, desc, gte, inArray, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    departmentAnnouncements, 
    departments, 
    users, 
    announcementRecipients, 
    notifications 
} from '../../../db/schema.js';

// Manager: Create department announcement
export const createAnnouncement = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                message: "Content cannot be empty!"
            });
        }

        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;
        const userRole = userData.role;

        if (!req.body.announcementTitle || !req.body.announcementDescription) {
            return res.status(400).json({
                message: "Title and description are required!"
            });
        }

        // Get current user's department
        const [currentUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!currentUser || !currentUser.departmentId) {
            return res.status(400).json({
                message: "Manager must be assigned to a department to create announcements!"
            });
        }

        // Managers can only create announcements for their own department
        const targetDepartmentId = currentUser.departmentId;
        let recipientUserIds = req.body.recipientUserIds || [];

        // If specific users are selected, ensure they're in manager's department
        if (recipientUserIds.length > 0) {
            const usersInDept = await db.select({ id: users.id })
                .from(users)
                .where(and(
                    eq(users.departmentId, currentUser.departmentId),
                    inArray(users.id, recipientUserIds),
                    inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER'])
                ));
            
            if (usersInDept.length !== recipientUserIds.length) {
                return res.status(403).json({
                    message: "You can only notify users within your own department!"
                });
            }
        } else {
            // If no specific users, get all employees and managers in the department
            const departmentUsers = await db.select({ id: users.id })
                .from(users)
                .where(and(
                    eq(users.departmentId, targetDepartmentId),
                    inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER'])
                ));
            
            recipientUserIds = departmentUsers.map(user => user.id);
        }

        // Create the announcement
        const [newAnnouncement] = await db.insert(departmentAnnouncements)
            .values({
                title: req.body.announcementTitle,
                description: req.body.announcementDescription,
                date: new Date(req.body.announcementDate || new Date()),
                departmentId: targetDepartmentId,
                createdBy: userId
            })
            .returning();

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
                title: 'New Department Announcement',
                message: `New announcement: ${req.body.announcementTitle}`,
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
        res.status(500).json({
            message: error.message || "Error occurred while creating announcement."
        });
    }
};

// Manager: Get department announcements
export const getDepartmentAnnouncements = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        // Get manager's department
        const [currentUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!currentUser || !currentUser.departmentId) {
            return res.status(400).json({
                message: "Manager must be assigned to a department!"
            });
        }

        const announcements = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            date: departmentAnnouncements.date,
            createdAt: departmentAnnouncements.createdAt,
            departmentId: departmentAnnouncements.departmentId,
            createdBy: departmentAnnouncements.createdBy,
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
        .where(eq(departmentAnnouncements.departmentId, currentUser.departmentId))
        .orderBy(desc(departmentAnnouncements.createdAt));

        res.json(announcements);

    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while retrieving announcements."
        });
    }
};

// Manager: Update department announcement
export const updateAnnouncement = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        // Check if announcement exists and belongs to manager's department
        const [announcement] = await db.select()
            .from(departmentAnnouncements)
            .where(eq(departmentAnnouncements.id, announcementId))
            .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        // Get manager's department
        const [currentUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!currentUser || announcement.departmentId !== currentUser.departmentId) {
            return res.status(403).json({
                message: "You can only update announcements from your own department!"
            });
        }

        const updateData = {};
        if (req.body.title) updateData.title = req.body.title;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.date) updateData.date = new Date(req.body.date);
        updateData.updatedAt = new Date();

        const [updatedAnnouncement] = await db.update(departmentAnnouncements)
            .set(updateData)
            .where(eq(departmentAnnouncements.id, announcementId))
            .returning();

        res.json({
            message: "Announcement updated successfully!",
            announcement: updatedAnnouncement
        });

    } catch (error) {
        res.status(500).json({
            message: error.message || "Error occurred while updating announcement."
        });
    }
};

// Manager: Delete department announcement
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        // Check if announcement exists and belongs to manager's department
        const [announcement] = await db.select()
            .from(departmentAnnouncements)
            .where(eq(departmentAnnouncements.id, announcementId))
            .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        // Get manager's department
        const [currentUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!currentUser || announcement.departmentId !== currentUser.departmentId) {
            return res.status(403).json({
                message: "You can only delete announcements from your own department!"
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
        res.status(500).json({
            message: error.message || "Error occurred while deleting announcement."
        });
    }
};