import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { notifications, users } from '../../../db/schema.js';

/**
 * Shared Notification Controller
 * Handles notifications for all user roles (Admin, Manager, Employee)
 */

// Create and Save a new Notification (Admin/Manager only)
export const createNotification = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content can not be empty!"
      });
    }

    // Check if user has permission to create notifications
    const userRole = req.user?.role;
    if (!['ROLE_ADMIN', 'ROLE_MANAGER'].includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. Only administrators and managers can create notifications."
      });
    }

    const newNotification = {
      userId: req.body.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'info',
      relatedId: req.body.relatedId || null,
      isRead: false
    };

    // Save Notification in the database
    const result = await db.insert(notifications)
      .values(newNotification)
      .returning();
    
    res.json({
      message: "Notification created successfully",
      notification: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the Notification."
    });
  }
};

// Retrieve all Notifications for current user with pagination, search, and filters
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user not found"
      });
    }

    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const status = req.query.status || ''; // 'read', 'unread', or empty for all
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(notifications.userId, userId)];

    // Add search filter (search in title and message)
    if (search) {
      conditions.push(
        or(
          like(notifications.title, `%${search}%`),
          like(notifications.message, `%${search}%`)
        )
      );
    }

    // Add type filter
    if (type) {
      conditions.push(like(notifications.type, `%${type}%`));
    }

    // Add status filter (read/unread)
    if (status === 'read') {
      conditions.push(eq(notifications.isRead, true));
    } else if (status === 'unread') {
      conditions.push(eq(notifications.isRead, false));
    }

    // Get total count for pagination
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    // Get paginated results
    const result = await db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    res.json({
      message: "Notifications retrieved successfully",
      notifications: result,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit)
      }
    });
  } catch (error) {
    console.error('Error in getMyNotifications:', error);
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving Notifications."
    });
  }
};

// Retrieve all Notifications for a specific user (Admin/Manager only)
export const getUserNotifications = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.id;

    // Check permissions
    if (!['ROLE_ADMIN', 'ROLE_MANAGER'].includes(currentUserRole)) {
      return res.status(403).json({
        message: "Access denied. Only administrators and managers can view other users' notifications."
      });
    }

    // For managers, verify the target user is in their department
    if (currentUserRole === 'ROLE_MANAGER') {
      const [manager] = await db.select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      const [targetUser] = await db.select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!manager || !targetUser || manager.departmentId !== targetUser.departmentId) {
        return res.status(403).json({
          message: "You can only view notifications for employees in your department."
        });
      }
    }
    
    const result = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    res.json({
      message: "User notifications retrieved successfully",
      notifications: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving user notifications."
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user not found"
      });
    }
    
    // Verify the notification belongs to the current user
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found!"
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        message: "You can only mark your own notifications as read."
      });
    }
    
    const result = await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date().toISOString()
      })
      .where(eq(notifications.id, id))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Notification marked as read.",
        notification: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update Notification with id=${id}. Maybe Notification was not found!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating Notification with id=${req.params.id}`
    });
  }
};

// Mark all notifications as read for current user
export const markAllMyNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user not found"
      });
    }
    
    const result = await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date().toISOString()
      })
      .where(eq(notifications.userId, userId))
      .returning();
    
    res.json({
      message: `${result.length} notifications marked as read.`,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({
      message: `Error marking all notifications as read for current user`
    });
  }
};

// Mark all notifications as read for a user (Admin/Manager only)
export const markAllUserNotificationsAsRead = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.id;

    // Check permissions
    if (!['ROLE_ADMIN', 'ROLE_MANAGER'].includes(currentUserRole)) {
      return res.status(403).json({
        message: "Access denied. Only administrators and managers can manage other users' notifications."
      });
    }

    // For managers, verify the target user is in their department
    if (currentUserRole === 'ROLE_MANAGER') {
      const [manager] = await db.select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      const [targetUser] = await db.select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!manager || !targetUser || manager.departmentId !== targetUser.departmentId) {
        return res.status(403).json({
          message: "You can only manage notifications for employees in your department."
        });
      }
    }
    
    const result = await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date().toISOString()
      })
      .where(eq(notifications.userId, userId))
      .returning();
    
    res.json({
      message: `${result.length} notifications marked as read for user.`,
      count: result.length
    });
  } catch (error) {
    res.status(500).json({
      message: `Error marking notifications as read for user ${req.params.userId}`
    });
  }
};

// Get unread count for current user
export const getMyUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user not found"
      });
    }
    
    const result = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    res.json({ 
      message: "Unread count retrieved successfully",
      count: result.length 
    });
  } catch (error) {
    console.error('Error in getMyUnreadCount:', error);
    res.status(500).json({
      message: error.message || "Some error occurred while getting unread count."
    });
  }
};

// Get unread count for a user (Admin/Manager only)
export const getUserUnreadCount = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.id;

    // Check permissions
    if (!['ROLE_ADMIN', 'ROLE_MANAGER'].includes(currentUserRole)) {
      return res.status(403).json({
        message: "Access denied. Only administrators and managers can view other users' notification counts."
      });
    }

    // For managers, verify the target user is in their department
    if (currentUserRole === 'ROLE_MANAGER') {
      const [manager] = await db.select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      const [targetUser] = await db.select({ departmentId: users.departmentId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!manager || !targetUser || manager.departmentId !== targetUser.departmentId) {
        return res.status(403).json({
          message: "You can only view notification counts for employees in your department."
        });
      }
    }
    
    const result = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    res.json({ 
      message: "User unread count retrieved successfully",
      count: result.length 
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while getting user unread count."
    });
  }
};

// Delete notification (own notifications only, or Admin can delete any)
export const deleteNotification = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - user not found"
      });
    }

    // Get the notification first
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found!"
      });
    }

    // Check permissions: users can delete their own notifications, admins can delete any
    if (notification.userId !== userId && userRole !== 'ROLE_ADMIN') {
      return res.status(403).json({
        message: "You can only delete your own notifications."
      });
    }

    const result = await db.delete(notifications)
      .where(eq(notifications.id, id))
      .returning();

    if (result.length > 0) {
      res.json({
        message: "Notification deleted successfully!"
      });
    } else {
      res.status(500).json({
        message: "Failed to delete notification."
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete Notification with id=${req.params.id}`
    });
  }
};