import { db } from '../db/index.js';
import { notifications, users, departments } from '../db/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';

/**
 * Enhanced Notification Service
 * Comprehensive notification management for all system events
 */

// Notification types
export const NotificationTypes = {
  // User Management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // Salary Management
  SALARY_GENERATED: 'salary_generated',
  SALARY_UPDATED: 'salary_updated',
  SALARY_APPROVED: 'salary_approved',
  SALARY_PAID: 'salary_paid',
  BONUS_ADDED: 'bonus_added',
  ADJUSTMENT_ADDED: 'adjustment_added',
  BASE_SALARY_CHANGED: 'base_salary_changed',
  
  // Payroll
  PAYROLL_GENERATED: 'payroll_generated',
  PAYROLL_APPROVED: 'payroll_approved',
  PAYROLL_PAID: 'payroll_paid',
  
  // Attendance
  ATTENDANCE_MARKED: 'attendance_marked',
  ATTENDANCE_CORRECTED: 'attendance_corrected',
  CORRECTION_REQUEST_SUBMITTED: 'correction_request_submitted',
  CORRECTION_REQUEST_APPROVED: 'correction_request_approved',
  CORRECTION_REQUEST_REJECTED: 'correction_request_rejected',
  LATE_ARRIVAL_ALERT: 'late_arrival_alert',
  ABSENCE_ALERT: 'absence_alert',
  ATTENDANCE_SUMMARY_GENERATED: 'attendance_summary_generated',
  SHIFT_ASSIGNED: 'shift_assigned',
  SHIFT_CHANGED: 'shift_changed',
  
  // Overtime
  OVERTIME_REQUEST_SUBMITTED: 'overtime_request_submitted',
  OVERTIME_REQUEST_APPROVED: 'overtime_request_approved',
  OVERTIME_REQUEST_REJECTED: 'overtime_request_rejected',
  OVERTIME_APPROVED: 'overtime_approved',
  
  // Applications/Leave
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_APPROVED: 'application_approved',
  APPLICATION_REJECTED: 'application_rejected',
  APPLICATION_UPDATED: 'application_updated',
  APPLICATION_DELETED: 'application_deleted',
  LEAVE_REQUEST_SUBMITTED: 'leave_request_submitted',
  LEAVE_REQUEST_APPROVED: 'leave_request_approved',
  LEAVE_REQUEST_REJECTED: 'leave_request_rejected',
  
  // Expenses
  EXPENSE_SUBMITTED: 'expense_submitted',
  EXPENSE_APPROVED: 'expense_approved',
  EXPENSE_REJECTED: 'expense_rejected',
  EXPENSE_PAID: 'expense_paid',
  
  // Announcements
  ANNOUNCEMENT_CREATED: 'announcement_created',
  ANNOUNCEMENT_UPDATED: 'announcement_updated',
  ANNOUNCEMENT_DELETED: 'announcement_deleted',
  
  // Holidays
  HOLIDAY_ADDED: 'holiday_added',
  
  // Department
  DEPARTMENT_CREATED: 'department_created',
  DEPARTMENT_UPDATED: 'department_updated',
  DEPARTMENT_ASSIGNED: 'department_assigned',
  DEPARTMENT_CHANGED: 'department_changed',
  
  // Job Posting
  JOB_POSTED: 'job_posted',
  JOB_APPLICATION_RECEIVED: 'job_application_received',
  JOB_APPLICATION_REVIEWED: 'job_application_reviewed',
  
  // System
  SYSTEM_ALERT: 'system_alert',
  REMINDER: 'reminder',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, title, message, type, relatedId = null, metadata = null) => {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type,
        relatedId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isRead: false
        // Let database handle createdAt and updatedAt with defaultNow()
      })
      .returning();

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications should not break main operations
    return null;
  }
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (userIds, title, message, type, relatedId = null, metadata = null) => {
  try {
    const notificationData = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
      relatedId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      isRead: false
      // Let database handle createdAt and updatedAt with defaultNow()
    }));

    const result = await db.insert(notifications).values(notificationData).returning();
    return result;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
  }
};

// ==================== USER MANAGEMENT NOTIFICATIONS ====================

export const notifyUserCreated = async (userId, createdBy, userDetails) => {
  const creator = await getUserDetails(createdBy);
  const creatorName = creator?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '🎉 Welcome to the System',
    `Your account has been created by ${creatorName}. You can now access the HR Management System.`,
    NotificationTypes.USER_CREATED,
    userId,
    { createdBy, userDetails }
  );
};

export const notifyUserUpdated = async (userId, updatedBy, changes) => {
  const updater = await getUserDetails(updatedBy);
  const updaterName = updater?.fullName || 'Administrator';
  
  const changesList = Object.keys(changes).join(', ');
  
  return createNotification(
    userId,
    '📝 Profile Updated',
    `Your profile has been updated by ${updaterName}. Changes: ${changesList}`,
    NotificationTypes.USER_UPDATED,
    userId,
    { updatedBy, changes }
  );
};

export const notifyUserDeleted = async (userId, deletedBy) => {
  const deleter = await getUserDetails(deletedBy);
  const deleterName = deleter?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '⚠️ Account Deleted',
    `Your account has been deleted by ${deleterName}.`,
    NotificationTypes.USER_DELETED,
    userId,
    { deletedBy }
  );
};

// ==================== SALARY NOTIFICATIONS ====================

export const notifySalaryGenerated = async (userId, salaryId, amount, month, year) => {
  return createNotification(
    userId,
    '💰 Salary Generated',
    `Your salary for ${getMonthName(month)} ${year} has been generated. Net amount: $${amount.toLocaleString()}`,
    NotificationTypes.SALARY_GENERATED,
    salaryId,
    { amount, month, year }
  );
};

export const notifySalaryUpdated = async (userId, salaryId, changes, updatedBy) => {
  const updater = await getUserDetails(updatedBy);
  const updaterName = updater?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '📊 Salary Updated',
    `Your salary has been updated by ${updaterName}. Changes have been applied to your salary record.`,
    NotificationTypes.SALARY_UPDATED,
    salaryId,
    { updatedBy, changes }
  );
};

export const notifySalaryApproved = async (userId, salaryId, amount, approvedBy) => {
  const approver = await getUserDetails(approvedBy);
  const approverName = approver?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '✅ Salary Approved',
    `Your salary of $${amount.toLocaleString()} has been approved by ${approverName}.`,
    NotificationTypes.SALARY_APPROVED,
    salaryId,
    { amount, approvedBy }
  );
};

export const notifySalaryPaid = async (userId, salaryId, amount, paidBy) => {
  const payer = await getUserDetails(paidBy);
  const payerName = payer?.fullName || 'Finance Department';
  
  return createNotification(
    userId,
    '💵 Salary Paid',
    `Your salary of $${amount.toLocaleString()} has been paid by ${payerName}. Check your account.`,
    NotificationTypes.SALARY_PAID,
    salaryId,
    { amount, paidBy }
  );
};

export const notifyBonusAdded = async (userId, bonusId, amount, reason, addedBy) => {
  const adder = await getUserDetails(addedBy);
  const adderName = adder?.fullName || 'Management';
  
  return createNotification(
    userId,
    '🎁 Bonus Added',
    `Congratulations! You've received a bonus of $${amount.toLocaleString()} for ${reason}. Added by ${adderName}.`,
    NotificationTypes.BONUS_ADDED,
    bonusId,
    { amount, reason, addedBy }
  );
};

export const notifyBaseSalaryChanged = async (userId, oldSalary, newSalary, changedBy) => {
  const changer = await getUserDetails(changedBy);
  const changerName = changer?.fullName || 'HR Department';
  
  const difference = newSalary - oldSalary;
  const change = difference > 0 ? `increased by $${difference.toLocaleString()}` : `decreased by $${Math.abs(difference).toLocaleString()}`;
  
  return createNotification(
    userId,
    '💼 Base Salary Changed',
    `Your base salary has been ${change} by ${changerName}. New salary: $${newSalary.toLocaleString()}/month`,
    NotificationTypes.BASE_SALARY_CHANGED,
    null,
    { oldSalary, newSalary, changedBy }
  );
};

// ==================== ATTENDANCE NOTIFICATIONS ====================

export const notifyAttendanceMarked = async (userId, attendanceId, date, status) => {
  const statusEmoji = status === 'present' ? '✅' : status === 'absent' ? '❌' : '⚠️';
  
  return createNotification(
    userId,
    `${statusEmoji} Attendance Marked`,
    `Your attendance for ${new Date(date).toDateString()} has been marked as ${status}.`,
    NotificationTypes.ATTENDANCE_MARKED,
    attendanceId,
    { date, status }
  );
};

export const notifyAttendanceCorrectionRequest = async (managerId, employeeId, correctionId, date) => {
  const employee = await getUserDetails(employeeId);
  const employeeName = employee?.fullName || 'An employee';
  
  return createNotification(
    managerId,
    '🔔 Attendance Correction Request',
    `${employeeName} has requested an attendance correction for ${new Date(date).toDateString()}.`,
    NotificationTypes.CORRECTION_REQUEST_SUBMITTED,
    correctionId,
    { employeeId, date }
  );
};

export const notifyAttendanceCorrectionApproved = async (userId, correctionId, date, approvedBy) => {
  const approver = await getUserDetails(approvedBy);
  const approverName = approver?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '✅ Attendance Correction Approved',
    `Your attendance correction request for ${new Date(date).toDateString()} has been approved by ${approverName}.`,
    NotificationTypes.CORRECTION_REQUEST_APPROVED,
    correctionId,
    { date, approvedBy }
  );
};

export const notifyAttendanceCorrectionRejected = async (userId, correctionId, date, rejectedBy, reason) => {
  const rejector = await getUserDetails(rejectedBy);
  const rejectorName = rejector?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '❌ Attendance Correction Rejected',
    `Your attendance correction request for ${new Date(date).toDateString()} has been rejected by ${rejectorName}. Reason: ${reason || 'Not provided'}`,
    NotificationTypes.CORRECTION_REQUEST_REJECTED,
    correctionId,
    { date, rejectedBy, reason }
  );
};

export const notifyLateArrival = async (userId, attendanceId, date, lateMinutes) => {
  return createNotification(
    userId,
    '⏰ Late Arrival Notice',
    `You were late by ${lateMinutes} minutes on ${new Date(date).toDateString()}. Please try to arrive on time.`,
    NotificationTypes.LATE_ARRIVAL_ALERT,
    attendanceId,
    { date, lateMinutes }
  );
};

export const notifyAbsence = async (userId, date, managerId) => {
  return createNotification(
    userId,
    '⚠️ Absence Recorded',
    `You were marked absent on ${new Date(date).toDateString()}. If this is incorrect, please submit a correction request.`,
    NotificationTypes.ABSENCE_ALERT,
    null,
    { date, managerId }
  );
};

export const notifyShiftAssigned = async (userId, shiftId, shiftName, effectiveDate, assignedBy) => {
  const assigner = await getUserDetails(assignedBy);
  const assignerName = assigner?.fullName || 'HR Department';
  
  return createNotification(
    userId,
    '📅 New Shift Assigned',
    `You have been assigned to ${shiftName} shift effective from ${new Date(effectiveDate).toDateString()} by ${assignerName}.`,
    NotificationTypes.SHIFT_ASSIGNED,
    shiftId,
    { shiftName, effectiveDate, assignedBy }
  );
};

// ==================== OVERTIME NOTIFICATIONS ====================

export const notifyOvertimeRequestSubmitted = async (managerId, employeeId, requestId, date, hours) => {
  const employee = await getUserDetails(employeeId);
  const employeeName = employee?.fullName || 'An employee';
  
  return createNotification(
    managerId,
    '⏱️ Overtime Request',
    `${employeeName} has requested ${hours} hours of overtime for ${new Date(date).toDateString()}.`,
    NotificationTypes.OVERTIME_REQUEST_SUBMITTED,
    requestId,
    { employeeId, date, hours }
  );
};

export const notifyOvertimeApproved = async (userId, requestId, date, hours, approvedBy) => {
  const approver = await getUserDetails(approvedBy);
  const approverName = approver?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '✅ Overtime Approved',
    `Your overtime request for ${hours} hours on ${new Date(date).toDateString()} has been approved by ${approverName}.`,
    NotificationTypes.OVERTIME_REQUEST_APPROVED,
    requestId,
    { date, hours, approvedBy }
  );
};

export const notifyOvertimeRejected = async (userId, requestId, date, hours, rejectedBy, reason) => {
  const rejector = await getUserDetails(rejectedBy);
  const rejectorName = rejector?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '❌ Overtime Rejected',
    `Your overtime request for ${hours} hours on ${new Date(date).toDateString()} has been rejected by ${rejectorName}. Reason: ${reason || 'Not provided'}`,
    NotificationTypes.OVERTIME_REQUEST_REJECTED,
    requestId,
    { date, hours, rejectedBy, reason }
  );
};

// ==================== APPLICATION/LEAVE NOTIFICATIONS ====================

export const notifyApplicationSubmitted = async (managerId, employeeId, applicationId, title, startDate, endDate) => {
  const employee = await getUserDetails(employeeId);
  const employeeName = employee?.fullName || 'An employee';
  
  return createNotification(
    managerId,
    '📝 New Application',
    `${employeeName} has submitted an application: "${title}" from ${new Date(startDate).toDateString()} to ${new Date(endDate).toDateString()}.`,
    NotificationTypes.APPLICATION_SUBMITTED,
    applicationId,
    { employeeId, title, startDate, endDate }
  );
};

export const notifyApplicationApproved = async (userId, applicationId, title, approvedBy) => {
  const approver = await getUserDetails(approvedBy);
  const approverName = approver?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '✅ Application Approved',
    `Your application "${title}" has been approved by ${approverName}.`,
    NotificationTypes.APPLICATION_APPROVED,
    applicationId,
    { title, approvedBy }
  );
};

export const notifyApplicationRejected = async (userId, applicationId, title, rejectedBy, reason) => {
  const rejector = await getUserDetails(rejectedBy);
  const rejectorName = rejector?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '❌ Application Rejected',
    `Your application "${title}" has been rejected by ${rejectorName}. Reason: ${reason || 'Not provided'}`,
    NotificationTypes.APPLICATION_REJECTED,
    applicationId,
    { title, rejectedBy, reason }
  );
};

export const notifyApplicationUpdated = async (userId, applicationId, title, updatedBy, changes) => {
  const updater = await getUserDetails(updatedBy);
  const updaterName = updater?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '📝 Application Updated',
    `Your application "${title}" has been updated by ${updaterName}.`,
    NotificationTypes.APPLICATION_UPDATED,
    applicationId,
    { title, updatedBy, changes }
  );
};

export const notifyApplicationDeleted = async (userId, title, deletedBy) => {
  const deleter = await getUserDetails(deletedBy);
  const deleterName = deleter?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '🗑️ Application Deleted',
    `Your application "${title}" has been deleted by ${deleterName}.`,
    NotificationTypes.APPLICATION_DELETED,
    null,
    { title, deletedBy }
  );
};

// ==================== EXPENSE NOTIFICATIONS ====================

export const notifyExpenseSubmitted = async (managerId, employeeId, expenseId, itemName, amount) => {
  const employee = await getUserDetails(employeeId);
  const employeeName = employee?.fullName || 'An employee';
  
  return createNotification(
    managerId,
    '💳 New Expense',
    `${employeeName} has submitted an expense for ${itemName} - $${amount.toLocaleString()}.`,
    NotificationTypes.EXPENSE_SUBMITTED,
    expenseId,
    { employeeId, itemName, amount }
  );
};

export const notifyExpenseApproved = async (userId, expenseId, itemName, amount, approvedBy) => {
  const approver = await getUserDetails(approvedBy);
  const approverName = approver?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '✅ Expense Approved',
    `Your expense for ${itemName} ($${amount.toLocaleString()}) has been approved by ${approverName}.`,
    NotificationTypes.EXPENSE_APPROVED,
    expenseId,
    { itemName, amount, approvedBy }
  );
};

export const notifyExpenseRejected = async (userId, expenseId, itemName, amount, rejectedBy, reason) => {
  const rejector = await getUserDetails(rejectedBy);
  const rejectorName = rejector?.fullName || 'Manager';
  
  return createNotification(
    userId,
    '❌ Expense Rejected',
    `Your expense for ${itemName} ($${amount.toLocaleString()}) has been rejected by ${rejectorName}. Reason: ${reason || 'Not provided'}`,
    NotificationTypes.EXPENSE_REJECTED,
    expenseId,
    { itemName, amount, rejectedBy, reason }
  );
};

export const notifyExpensePaid = async (userId, expenseId, itemName, amount, paidBy) => {
  const payer = await getUserDetails(paidBy);
  const payerName = payer?.fullName || 'Finance Department';
  
  return createNotification(
    userId,
    '💵 Expense Paid',
    `Your expense for ${itemName} ($${amount.toLocaleString()}) has been paid by ${payerName}.`,
    NotificationTypes.EXPENSE_PAID,
    expenseId,
    { itemName, amount, paidBy }
  );
};

// ==================== ANNOUNCEMENT NOTIFICATIONS ====================

export const notifyNewAnnouncement = async (userIds, announcementId, title) => {
  return createBulkNotifications(
    userIds,
    '📢 New Announcement',
    `New announcement: ${title}`,
    NotificationTypes.ANNOUNCEMENT_CREATED,
    announcementId,
    { title }
  );
};

export const notifyAnnouncementUpdated = async (userIds, announcementId, title) => {
  return createBulkNotifications(
    userIds,
    '📝 Announcement Updated',
    `The announcement "${title}" has been updated.`,
    NotificationTypes.ANNOUNCEMENT_UPDATED,
    announcementId,
    { title }
  );
};

// ==================== HOLIDAY NOTIFICATIONS ====================

export const notifyNewHoliday = async (holidayId, holidayName, holidayDate) => {
  try {
    // Get all users (employees, managers, and admins)
    const allUsers = await db.select({ id: users.id }).from(users);
    const userIds = allUsers.map(u => u.id);
    
    const formattedDate = new Date(holidayDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return createBulkNotifications(
      userIds,
      'notification.holiday_added.title',
      'notification.holiday_added.message',
      NotificationTypes.HOLIDAY_ADDED,
      holidayId,
      { 
        holidayName, 
        holidayDate,
        formattedDate,
        translatable: true // Flag to indicate frontend should translate
      }
    );
  } catch (error) {
    console.error('Error notifying new holiday:', error);
    return [];
  }
};

// ==================== DEPARTMENT NOTIFICATIONS ====================

export const notifyDepartmentAssigned = async (userId, departmentId, departmentName, assignedBy) => {
  const assigner = await getUserDetails(assignedBy);
  const assignerName = assigner?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '🏢 Department Assigned',
    `You have been assigned to the ${departmentName} department by ${assignerName}.`,
    NotificationTypes.DEPARTMENT_ASSIGNED,
    departmentId,
    { departmentName, assignedBy }
  );
};

export const notifyDepartmentChanged = async (userId, oldDepartment, newDepartment, changedBy) => {
  const changer = await getUserDetails(changedBy);
  const changerName = changer?.fullName || 'Administrator';
  
  return createNotification(
    userId,
    '🔄 Department Changed',
    `Your department has been changed from ${oldDepartment} to ${newDepartment} by ${changerName}.`,
    NotificationTypes.DEPARTMENT_CHANGED,
    null,
    { oldDepartment, newDepartment, changedBy }
  );
};

// Notify all users in a department
export const notifyDepartment = async (departmentId, title, message, type, relatedId = null) => {
  try {
    const departmentUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.departmentId, departmentId));

    const userIds = departmentUsers.map(u => u.id);
    return createBulkNotifications(userIds, title, message, type, relatedId);
  } catch (error) {
    console.error('Error notifying department:', error);
    return [];
  }
};

// Notify all employees
export const notifyAllEmployees = async (title, message, type, relatedId = null) => {
  try {
    const allEmployees = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'ROLE_EMPLOYEE'));

    const userIds = allEmployees.map(u => u.id);
    return createBulkNotifications(userIds, title, message, type, relatedId);
  } catch (error) {
    console.error('Error notifying all employees:', error);
    return [];
  }
};

// Notify all managers
export const notifyAllManagers = async (title, message, type, relatedId = null) => {
  try {
    const allManagers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'ROLE_MANAGER'));

    const userIds = allManagers.map(u => u.id);
    return createBulkNotifications(userIds, title, message, type, relatedId);
  } catch (error) {
    console.error('Error notifying all managers:', error);
    return [];
  }
};

// Notify all admins
export const notifyAllAdmins = async (title, message, type, relatedId = null) => {
  try {
    const allAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'ROLE_ADMIN'));

    const userIds = allAdmins.map(u => u.id);
    return createBulkNotifications(userIds, title, message, type, relatedId);
  } catch (error) {
    console.error('Error notifying all admins:', error);
    return [];
  }
};

// ==================== HELPER FUNCTIONS ====================

const getUserDetails = async (userId) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || 'Unknown';
};

// Get manager of a department
export const getDepartmentManager = async (departmentId) => {
  try {
    const [manager] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.departmentId, departmentId),
        eq(users.role, 'ROLE_MANAGER')
      ))
      .limit(1);
    
    return manager?.id;
  } catch (error) {
    console.error('Error fetching department manager:', error);
    return null;
  }
};

// Get all admins
export const getAllAdminIds = async () => {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'ROLE_ADMIN'));
    
    return admins.map(a => a.id);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
};

export default {
  createNotification,
  createBulkNotifications,
  NotificationTypes,
  // Export all notification functions
  notifyUserCreated,
  notifyUserUpdated,
  notifyUserDeleted,
  notifySalaryGenerated,
  notifySalaryUpdated,
  notifySalaryApproved,
  notifySalaryPaid,
  notifyBonusAdded,
  notifyBaseSalaryChanged,
  notifyAttendanceMarked,
  notifyAttendanceCorrectionRequest,
  notifyAttendanceCorrectionApproved,
  notifyAttendanceCorrectionRejected,
  notifyLateArrival,
  notifyAbsence,
  notifyShiftAssigned,
  notifyOvertimeRequestSubmitted,
  notifyOvertimeApproved,
  notifyOvertimeRejected,
  notifyApplicationSubmitted,
  notifyApplicationApproved,
  notifyApplicationRejected,
  notifyApplicationUpdated,
  notifyApplicationDeleted,
  notifyExpenseSubmitted,
  notifyExpenseApproved,
  notifyExpenseRejected,
  notifyExpensePaid,
  notifyNewAnnouncement,
  notifyAnnouncementUpdated,
  notifyNewHoliday,
  notifyDepartmentAssigned,
  notifyDepartmentChanged,
  notifyDepartment,
  notifyAllEmployees,
  notifyAllManagers,
  notifyAllAdmins,
  getDepartmentManager,
  getAllAdminIds
};
