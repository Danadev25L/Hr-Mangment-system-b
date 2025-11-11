import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    departmentAnnouncements, 
    departments, 
    users, 
    announcementRecipients 
} from '../../../db/schema.js';

// Employee: Get announcements for their department and company-wide announcements
export const getMyAnnouncements = async (req, res) => {
    try {
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        // Get current user's department
        const [currentUser] = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found!"
            });
        }

        // Get announcements where:
        // 1. User is a recipient
        // 2. Announcement is active
        const myRecipients = await db.select({
            announcementId: announcementRecipients.announcementId,
            isRead: announcementRecipients.isRead,
            readAt: announcementRecipients.readAt
        })
        .from(announcementRecipients)
        .where(eq(announcementRecipients.userId, userId));

        const announcementIds = myRecipients.map(r => r.announcementId);

        if (announcementIds.length === 0) {
            return res.json({ announcements: [] });
        }

        const announcements = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            date: departmentAnnouncements.date,
            isActive: departmentAnnouncements.isActive,
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
        .where(and(
            inArray(departmentAnnouncements.id, announcementIds),
            eq(departmentAnnouncements.isActive, true)
        ))
        .orderBy(desc(departmentAnnouncements.createdAt));

        // Add read status to each announcement
        const announcementsWithReadStatus = announcements.map(announcement => {
            const recipientInfo = myRecipients.find(r => r.announcementId === announcement.id);
            return {
                ...announcement,
                isRead: recipientInfo?.isRead || false,
                readAt: recipientInfo?.readAt
            };
        });

        res.json({ announcements: announcementsWithReadStatus });

    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({
            message: error.message || "Error occurred while retrieving announcements."
        });
    }
};

// Employee: Get single announcement by ID (if they are a recipient)
export const getAnnouncementById = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        // Check if user is a recipient of this announcement
        const [recipient] = await db.select()
            .from(announcementRecipients)
            .where(and(
                eq(announcementRecipients.announcementId, announcementId),
                eq(announcementRecipients.userId, userId)
            ))
            .limit(1);

        if (!recipient) {
            return res.status(403).json({
                message: "You don't have access to this announcement!"
            });
        }

        const [announcement] = await db.select({
            id: departmentAnnouncements.id,
            title: departmentAnnouncements.title,
            description: departmentAnnouncements.description,
            date: departmentAnnouncements.date,
            isActive: departmentAnnouncements.isActive,
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
        .where(eq(departmentAnnouncements.id, announcementId))
        .limit(1);

        if (!announcement) {
            return res.status(404).json({
                message: "Announcement not found!"
            });
        }

        res.json({ 
            announcement: {
                ...announcement,
                isRead: recipient.isRead,
                readAt: recipient.readAt
            }
        });

    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({
            message: error.message || "Error occurred while retrieving announcement."
        });
    }
};

// Employee: Mark announcement as read
export const markAnnouncementAsRead = async (req, res) => {
    try {
        const announcementId = parseInt(req.params.id);
        const userData = JSON.parse(req.headers.user || '{}');
        const userId = userData.id;

        // Check if user is a recipient
        const [recipient] = await db.select()
            .from(announcementRecipients)
            .where(and(
                eq(announcementRecipients.announcementId, announcementId),
                eq(announcementRecipients.userId, userId)
            ))
            .limit(1);

        if (!recipient) {
            return res.status(403).json({
                message: "You don't have access to this announcement!"
            });
        }

        // Update read status
        await db.update(announcementRecipients)
            .set({ 
                isRead: true,
                readAt: new Date()
            })
            .where(and(
                eq(announcementRecipients.announcementId, announcementId),
                eq(announcementRecipients.userId, userId)
            ));

        res.json({
            message: "Announcement marked as read!"
        });

    } catch (error) {
        console.error('Error marking announcement as read:', error);
        res.status(500).json({
            message: error.message || "Error occurred while marking announcement as read."
        });
    }
};
