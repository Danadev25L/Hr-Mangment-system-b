const db = require('../../db');
const { notifications, users } = require('../../db/schema');
const { eq } = require('drizzle-orm');

/**
 * Notification Service
 * Helper functions to create notifications for various events
 */

/**
 * Create a notification for a user
 */
const createNotification = async (userId, title, message, type, relatedId = null) => {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type,
        relatedId,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification for new announcement
 */
const notifyNewAnnouncement = async (announcementId, title, userIds) => {
  try {
    const promises = userIds.map(userId =>
      createNotification(
        userId,
        'New Announcement',
        `New announcement: ${title}`,
        'announcement',
        announcementId
      )
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying about new announcement:', error);
  }
};

/**
 * Create notification for application status change
 */
const notifyApplicationStatusChange = async (userId, applicationId, status, applicationType) => {
  try {
    const statusMessages = {
      approved: 'Your application has been approved',
      rejected: 'Your application has been rejected',
      pending: 'Your application is pending review'
    };

    await createNotification(
      userId,
      'Application Status Update',
      `${applicationType}: ${statusMessages[status] || 'Status updated'}`,
      'application',
      applicationId
    );
  } catch (error) {
    console.error('Error notifying about application status change:', error);
  }
};

/**
 * Create notification for salary update
 */
const notifySalaryUpdate = async (userId, salaryId, amount) => {
  try {
    await createNotification(
      userId,
      'Salary Update',
      `Your salary has been updated. New amount: $${amount}`,
      'salary',
      salaryId
    );
  } catch (error) {
    console.error('Error notifying about salary update:', error);
  }
};

/**
 * Create notification for leave request status
 */
const notifyLeaveRequestStatus = async (userId, leaveRequestId, status) => {
  try {
    const statusMessages = {
      approved: 'Your leave request has been approved',
      rejected: 'Your leave request has been rejected',
      pending: 'Your leave request is pending review'
    };

    await createNotification(
      userId,
      'Leave Request Status',
      statusMessages[status] || 'Leave request status updated',
      'leave',
      leaveRequestId
    );
  } catch (error) {
    console.error('Error notifying about leave request status:', error);
  }
};

/**
 * Create notification for all users in a department
 */
const notifyDepartment = async (departmentId, title, message, type, relatedId = null) => {
  try {
    const departmentUsers = await db
      .select()
      .from(users)
      .where(eq(users.departmentId, departmentId));

    const promises = departmentUsers.map(user =>
      createNotification(user.id, title, message, type, relatedId)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying department:', error);
  }
};

/**
 * Create notification for all employees
 */
const notifyAllEmployees = async (title, message, type, relatedId = null) => {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'ROLE_EMPLOYEE'));

    const promises = allUsers.map(user =>
      createNotification(user.id, title, message, type, relatedId)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying all employees:', error);
  }
};

module.exports = {
  createNotification,
  notifyNewAnnouncement,
  notifyApplicationStatusChange,
  notifySalaryUpdate,
  notifyLeaveRequestStatus,
  notifyDepartment,
  notifyAllEmployees
};
