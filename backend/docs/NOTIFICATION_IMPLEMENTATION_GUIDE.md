# Comprehensive Notification System Implementation Guide

## Overview
This document provides a complete guide for implementing the enhanced notification system across the HR Management System. The notification system will automatically alert users about all important events and changes that affect them.

## Notification Service

The notification service (`notification.enhanced.service.js`) provides functions for all types of notifications in the system.

### Import the Service
```javascript
import {
  notifyUserCreated,
  notifyUserUpdated,
  notifySalaryGenerated,
  notifyApplicationApproved,
  notifyExpenseSubmitted,
  // ... etc
} from '../../../services/notification.enhanced.service.js';
```

## Implementation Checklist

### ✅ User Management
- [ ] User created → Notify the new user
- [ ] User updated → Notify the user about changes
- [ ] User deleted → Notify the user (if possible)
- [ ] User activated/deactivated → Notify the user
- [ ] Base salary changed → Notify the user
- [ ] Department assigned/changed → Notify the user

### ✅ Salary Management
- [ ] Monthly salary generated → Notify each employee
- [ ] Salary approved → Notify employee
- [ ] Salary paid → Notify employee
- [ ] Bonus added → Notify employee
- [ ] Adjustment made → Notify employee
- [ ] Deduction applied → Notify employee

### ✅ Payroll Management
- [ ] Payroll generated → Notify all employees
- [ ] Payroll approved → Notify all employees
- [ ] Payroll paid → Notify all employees

### ✅ Attendance Management
- [ ] Attendance marked → Notify employee (if late/absent)
- [ ] Attendance correction requested → Notify manager
- [ ] Attendance correction approved/rejected → Notify employee
- [ ] Late arrival → Notify employee
- [ ] Absence recorded → Notify employee
- [ ] Monthly summary generated → Notify employee
- [ ] Shift assigned → Notify employee
- [ ] Shift changed → Notify employee

### ✅ Overtime Management
- [ ] Overtime requested → Notify manager
- [ ] Overtime approved → Notify employee
- [ ] Overtime rejected → Notify employee with reason

### ✅ Applications/Leave
- [ ] Application submitted → Notify manager/admin
- [ ] Application approved → Notify employee
- [ ] Application rejected → Notify employee with reason
- [ ] Application updated → Notify employee
- [ ] Application deleted → Notify employee

### ✅ Expense Management
- [ ] Expense submitted → Notify manager/admin
- [ ] Expense approved → Notify employee
- [ ] Expense rejected → Notify employee with reason
- [ ] Expense paid → Notify employee

### ✅ Announcements
- [ ] Announcement created → Notify all recipients
- [ ] Announcement updated → Notify all recipients
- [ ] Announcement deleted → Notify all recipients

### ✅ Job Postings
- [ ] Job posted → Notify relevant users
- [ ] Application received → Notify hiring manager
- [ ] Application reviewed → Notify applicant

## Implementation Examples

### Example 1: User Salary Update

#### In `user.admin.controller.js` - updateUser function:

```javascript
import { notifyBaseSalaryChanged } from '../../../services/notification.enhanced.service.js';

export const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.authData.id;
    
    // Get current user data
    const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const oldSalary = currentUser[0]?.baseSalary;
    
    // Update user
    const updateData = { ...req.body };
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    // Check if salary changed
    if (updateData.baseSalary && oldSalary !== updateData.baseSalary) {
      await notifyBaseSalaryChanged(
        userId,
        oldSalary,
        updateData.baseSalary,
        adminId
      );
    }
    
    res.json({ message: 'User updated successfully', user: result[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Example 2: Expense Approval

#### In `expense.manager.controller.js` - approveExpense function:

```javascript
import { notifyExpenseApproved } from '../../../services/notification.enhanced.service.js';

export const approveExpense = async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    const managerId = req.authData.id;
    
    // Get expense details
    const expense = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
    
    if (!expense[0]) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Update expense
    await db.update(expenses)
      .set({
        status: 'approved',
        approvedBy: managerId,
        approvedAt: new Date()
      })
      .where(eq(expenses.id, expenseId));
    
    // Notify employee
    await notifyExpenseApproved(
      expense[0].userId,
      expenseId,
      expense[0].itemName || 'Expense',
      expense[0].amount,
      managerId
    );
    
    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Example 3: Application Submission

#### In `application.employee.controller.js` - createApplication function:

```javascript
import { 
  notifyApplicationSubmitted,
  getDepartmentManager,
  getAllAdminIds 
} from '../../../services/notification.enhanced.service.js';

export const createApplication = async (req, res) => {
  try {
    const employeeId = req.authData.id;
    const { title, reason, startDate, endDate, applicationType } = req.body;
    
    // Create application
    const [application] = await db.insert(applications)
      .values({
        userId: employeeId,
        title,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applicationType,
        status: 'pending'
      })
      .returning();
    
    // Get employee department
    const employee = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
    
    // Notify manager if employee has department
    if (employee[0].departmentId) {
      const managerId = await getDepartmentManager(employee[0].departmentId);
      if (managerId) {
        await notifyApplicationSubmitted(
          managerId,
          employeeId,
          application.id,
          title,
          startDate,
          endDate
        );
      }
    }
    
    // Also notify all admins
    const adminIds = await getAllAdminIds();
    for (const adminId of adminIds) {
      await notifyApplicationSubmitted(
        adminId,
        employeeId,
        application.id,
        title,
        startDate,
        endDate
      );
    }
    
    res.status(201).json({ 
      message: 'Application submitted successfully',
      application 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Example 4: Attendance Correction Request

#### In `attendance.employee.controller.js` - requestCorrection function:

```javascript
import { 
  notifyAttendanceCorrectionRequest,
  getDepartmentManager,
  getAllAdminIds 
} from '../../../services/notification.enhanced.service.js';

export const requestAttendanceCorrection = async (req, res) => {
  try {
    const employeeId = req.authData.id;
    const { date, requestType, reason, requestedCheckIn, requestedCheckOut } = req.body;
    
    // Create correction request
    const [correction] = await db.insert(attendanceCorrections)
      .values({
        userId: employeeId,
        date: new Date(date),
        requestType,
        reason,
        requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : null,
        requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : null,
        status: 'pending'
      })
      .returning();
    
    // Get employee department and notify manager
    const employee = await db.select().from(users).where(eq(users.id, employeeId)).limit(1);
    
    if (employee[0].departmentId) {
      const managerId = await getDepartmentManager(employee[0].departmentId);
      if (managerId) {
        await notifyAttendanceCorrectionRequest(
          managerId,
          employeeId,
          correction.id,
          date
        );
      }
    }
    
    // Also notify admins
    const adminIds = await getAllAdminIds();
    for (const adminId of adminIds) {
      await notifyAttendanceCorrectionRequest(
        adminId,
        employeeId,
        correction.id,
        date
      );
    }
    
    res.status(201).json({ 
      message: 'Correction request submitted successfully',
      correction 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Example 5: Bonus Addition

#### In `salary.admin.controller.js` - addBonus function:

```javascript
import { notifyBonusAdded } from '../../../services/notification.enhanced.service.js';

export const addBonus = async (req, res) => {
  try {
    const adminId = req.authData.id;
    const { employeeId, amount, reason, month, year } = req.body;
    
    // Add bonus record
    const [bonus] = await db.insert(payrollBonuses)
      .values({
        employeeId,
        amount,
        reason,
        month,
        year,
        createdBy: adminId
      })
      .returning();
    
    // Notify employee
    await notifyBonusAdded(
      employeeId,
      bonus.id,
      amount,
      reason,
      adminId
    );
    
    res.status(201).json({ 
      message: 'Bonus added successfully',
      bonus 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

## Key Points for Implementation

### 1. Always Use Try-Catch
Notifications should never break the main operation:

```javascript
try {
  await notifySomething(...);
} catch (notifError) {
  console.error('Notification error:', notifError);
  // Continue with main operation
}
```

### 2. Notify All Relevant Parties
- Employee's manager
- All admins (for critical actions)
- The affected user
- Department members (if relevant)

### 3. Include Context
Always provide rich context in notifications:
- Who performed the action
- What was changed
- When it happened
- Why (if applicable)
- Amount/dates (if relevant)

### 4. Use Appropriate Notification Types
The service provides specific notification types for each event. Use them consistently.

### 5. Provide Clear Messages
Messages should be:
- Clear and concise
- Actionable when needed
- Include all relevant details
- Professional in tone

## Controllers to Update

### High Priority (Most User-Impacting)
1. ✅ `application.admin.controller.js` - DONE in example
2. `application.manager.controller.js`
3. `expense.manager.controller.js`
4. `salary.admin.controller.js`
5. `user.admin.controller.js`
6. `attendance.admin.controller.js`
7. `attendance.manager.controller.js`

### Medium Priority
8. `employee.manager.controller.js`
9. `financialInfo.admin.controller.js`
10. `payroll.admin.controller.js`
11. `attendance.enhanced.admin.controller.js`
12. `attendance.features.admin.controller.js`

### Lower Priority
13. `announcement.admin.controller.js`
14. `department.admin.controller.js`
15. `holidays.admin.controller.js`
16. `job.manager.controller.js`

## Testing Notifications

### Test Cases
1. Submit an application → Check manager receives notification
2. Approve expense → Check employee receives notification
3. Add bonus → Check employee receives notification
4. Change salary → Check employee receives notification
5. Mark attendance → Check employee receives notification if late/absent
6. Request overtime → Check manager receives notification
7. Create announcement → Check all recipients receive notification

### Verification
- Check database notifications table
- Verify isRead status
- Check notification counts endpoint
- Test mark as read functionality
- Verify bulk operations

## Database Queries for Monitoring

```sql
-- Get unread notifications count by user
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id;

-- Get most common notification types
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Get recent notifications
SELECT n.*, u.full_name
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.created_at > NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;
```

## Performance Considerations

1. **Batch Operations**: Use `createBulkNotifications` for multiple users
2. **Async Processing**: Notifications run asynchronously
3. **Indexes**: Added indexes on key columns for faster queries
4. **Metadata**: Use JSONB metadata for flexible context storage

## Future Enhancements

- [ ] Email notifications for critical events
- [ ] Push notifications (web/mobile)
- [ ] Notification preferences per user
- [ ] Notification digests (daily/weekly summary)
- [ ] Real-time notifications via WebSocket
- [ ] Notification templates
- [ ] Multi-language notifications

## Support

For questions or issues with the notification system, refer to:
- Service file: `backend/services/notification.enhanced.service.js`
- Migration: `backend/db/migrations/0014_add_metadata_to_notifications.sql`
- Schema: `backend/db/schema.js` (notifications table)
