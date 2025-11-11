import express from 'express';
import * as sharedNotificationController from '../controllers/notification.shared.controller.js';
import * as sharedPersonalEventController from '../controllers/personalEvent.shared.controller.js';
import * as sharedProfileController from '../controllers/profile.shared.controller.js';
import * as sharedDepartmentController from '../controllers/department.shared.controller.js';
import calendarRoutes from './calendar.routes.js';

const router = express.Router();

// Profile Routes (available to all authenticated users)
router.get('/profile', sharedProfileController.getCurrentUserProfile);

// Departments Routes (available to all authenticated users for reference)
router.get('/departments', sharedDepartmentController.getAllDepartments);

// Shared Notification Routes (available to all authenticated users)
router.post('/notifications', sharedNotificationController.createNotification); // Admin/Manager only
router.get('/notifications', sharedNotificationController.getMyNotifications);
router.get('/notifications/user/:userId', sharedNotificationController.getUserNotifications); // Admin/Manager only
router.put('/notifications/:id/read', sharedNotificationController.markNotificationAsRead);
router.put('/notifications/read-all', sharedNotificationController.markAllMyNotificationsAsRead);
router.put('/notifications/user/:userId/read-all', sharedNotificationController.markAllUserNotificationsAsRead); // Admin/Manager only
router.get('/notifications/unread-count', sharedNotificationController.getMyUnreadCount);
router.get('/notifications/user/:userId/unread-count', sharedNotificationController.getUserUnreadCount); // Admin/Manager only
// DISABLED: Notifications should never be deleted - keep historical record
// router.delete('/notifications/:id', sharedNotificationController.deleteNotification);

// Personal Events Routes (available to all authenticated users)
router.post('/personal-events', sharedPersonalEventController.createPersonalEvent);
router.get('/personal-events', sharedPersonalEventController.getUserPersonalEvents);
router.get('/personal-events/:id', sharedPersonalEventController.getPersonalEvent);
router.put('/personal-events/:id', sharedPersonalEventController.updatePersonalEvent);
router.delete('/personal-events/:id', sharedPersonalEventController.deletePersonalEvent);

// Calendar Routes (available to all authenticated users)
router.use('/calendar', calendarRoutes);

export default router;