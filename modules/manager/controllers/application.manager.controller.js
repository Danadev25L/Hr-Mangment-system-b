import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    users, 
    applications,
    notifications,
    daysHoliday,
    departments
} from '../../../db/schema.js';
import {
  notifyApplicationApproved,
  notifyApplicationRejected,
  notifyApplicationUpdated
} from '../../../services/notification.enhanced.service.js';

/**
 * Manager Application Controller
 * Handles application review and management for department managers
 */

// Get applications from manager's department with pagination and filters
export const getDepartmentApplications = async (req, res) => {
  try {
    const managerId = req.authData.id;

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    if (!manager.departmentId) {
      return res.status(400).json({
        message: "Manager must be assigned to a department!"
      });
    }

    // Get pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const applicationType = req.query.applicationType || '';
    const priority = req.query.priority || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [
      eq(users.departmentId, manager.departmentId), // Only this department's applications
    ];

    // Search filter (title, reason, or user name)
    if (search) {
      whereConditions.push(
        sql`(${applications.title} ILIKE ${'%' + search + '%'} OR ${applications.reason} ILIKE ${'%' + search + '%'} OR ${users.fullName} ILIKE ${'%' + search + '%'})`
      );
    }

    // Status filter
    if (status && status !== 'all') {
      whereConditions.push(eq(applications.status, status));
    }

    // Application type filter
    if (applicationType && applicationType !== 'all') {
      whereConditions.push(eq(applications.applicationType, applicationType));
    }

    // Priority filter
    if (priority && priority !== 'all') {
      whereConditions.push(eq(applications.priority, priority));
    }

    // Date range filter
    if (startDate && endDate) {
      whereConditions.push(
        sql`${applications.createdAt} >= ${new Date(startDate)} AND ${applications.createdAt} <= ${new Date(endDate)}`
      );
    }

    // Get applications with pagination
    const query = await db.select({
      id: applications.id,
      title: applications.title,
      reason: applications.reason,
      startDate: applications.startDate,
      endDate: applications.endDate,
      status: applications.status,
      applicationType: applications.applicationType,
      priority: applications.priority,
      userId: applications.userId,
      approvedBy: applications.approvedBy,
      approvedAt: applications.approvedAt,
      rejectedBy: applications.rejectedBy,
      rejectedAt: applications.rejectedAt,
      rejectionReason: applications.rejectionReason,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      userName: users.fullName,
      userEmail: users.email,
      userRole: users.role,
      employeeCode: users.employeeCode,
      departmentId: users.departmentId,
      departmentName: departments.departmentName,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(...whereConditions))
    .orderBy(desc(applications.createdAt))
    .limit(limit)
    .offset(offset);

    // Get total count for pagination
    const countResult = await db.select({ count: sql`count(*)` })
      .from(applications)
      .innerJoin(users, eq(applications.userId, users.id))
      .where(and(...whereConditions));

    const totalCount = parseInt(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Format applications
    const formattedApplications = query.map(app => ({
      ...app,
      userName: app.userRole === 'ROLE_ADMIN' ? 'Admin' : app.userName,
      departmentName: app.departmentName || 'No Department'
    }));

    res.json({
      success: true,
      data: formattedApplications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      },
      filters: {
        search,
        status,
        applicationType,
        priority,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error in getDepartmentApplications:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Some error occurred while retrieving department applications."
    });
  }
};

// Get recent applications from manager's department (from 2 weeks ago to 1 week ahead)
export const getRecentDepartmentApplications = async (req, res) => {
  try {
    const managerId = req.authData.id;

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const oneWeekAhead = new Date();
    oneWeekAhead.setDate(oneWeekAhead.getDate() + 7);
    
    const result = await db.select({
      id: applications.id,
      title: applications.title,
      reason: applications.reason,
      startDate: applications.startDate,
      endDate: applications.endDate,
      status: applications.status,
      applicationType: applications.applicationType,
      priority: applications.priority,
      userId: applications.userId,
      createdAt: applications.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        departmentId: users.departmentId
      }
    })
    .from(applications)
    .leftJoin(users, eq(applications.userId, users.id))
    .where(and(
      gte(applications.startDate, twoWeeksAgo),
      lte(applications.startDate, oneWeekAhead),
      eq(users.departmentId, manager.departmentId)
    ));
    
    res.json({
      message: "Recent department applications retrieved successfully",
      applications: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving recent department applications."
    });
  }
};

// Get applications for a specific employee in manager's department
export const getDepartmentEmployeeApplications = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const userId = parseInt(req.params.userId);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Verify employee is in manager's department
    const employee = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!employee || employee.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only view applications for employees in your department!"
      });
    }
    
    const result = await db.select({
      id: applications.id,
      title: applications.title,
      reason: applications.reason,
      startDate: applications.startDate,
      endDate: applications.endDate,
      status: applications.status,
      applicationType: applications.applicationType,
      priority: applications.priority,
      userId: applications.userId,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        departmentId: users.departmentId
      }
    })
    .from(applications)
    .leftJoin(users, eq(applications.userId, users.id))
    .where(eq(applications.userId, userId));
    
    res.json({
      message: "Employee applications retrieved successfully",
      applications: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving employee applications."
    });
  }
};

// Find a single Application in manager's department
export const getDepartmentApplication = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const applicationId = parseInt(req.params.id);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }
    
    const result = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: {
        user: {
          with: {
            department: true,
            personalInformation: true
          }
        },
        approver: {
          columns: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    if (!result) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found.`
      });
    }

    // Verify the application is from the manager's department
    if (result.user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only view applications from employees in your department!"
      });
    }
    
    res.json({
      message: "Department application retrieved successfully",
      application: result
    });
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving Application with id=${req.params.id}`
    });
  }
};

// Approve application by manager
export const approveApplication = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const applicationId = parseInt(req.params.id);
    
    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get the current application details
    const currentApplication = await db.select()
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .where(eq(applications.id, applicationId))
      .limit(1);
    
    if (currentApplication.length === 0) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
      });
    }
    
    const application = currentApplication[0].applications;
    const user = currentApplication[0].users;

    // Verify application is from manager's department
    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only approve applications from employees in your department!"
      });
    }
    
    const updateData = {
      status: 'approved',
      approvedBy: managerId,
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update the application
    const result = await db.update(applications)
      .set(updateData)
      .where(eq(applications.id, applicationId))
      .returning();
    
    // Notify the applicant using enhanced notification service
    try {
      await notifyApplicationApproved(
        application.userId,
        applicationId,
        application.title || 'Leave Request',
        managerId
      );
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }
    
    res.json({
      message: "Application approved successfully.",
      application: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: `Error approving application with id=${req.params.id}`
    });
  }
};

// Reject application by manager
export const rejectApplication = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const applicationId = parseInt(req.params.id);
    const rejectionReason = req.body.rejectionReason || 'No reason provided';
    
    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get the current application details
    const currentApplication = await db.select()
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .where(eq(applications.id, applicationId))
      .limit(1);
    
    if (currentApplication.length === 0) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
      });
    }
    
    const application = currentApplication[0].applications;
    const user = currentApplication[0].users;

    // Verify application is from manager's department
    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only reject applications from employees in your department!"
      });
    }
    
    const updateData = {
      status: 'rejected',
      rejectedBy: managerId,
      rejectedAt: new Date(),
      rejectionReason: rejectionReason,
      updatedAt: new Date()
    };
    
    // Update the application
    const result = await db.update(applications)
      .set(updateData)
      .where(eq(applications.id, applicationId))
      .returning();
    
    // Notify the applicant using enhanced notification service
    try {
      await notifyApplicationRejected(
        application.userId,
        applicationId,
        application.title || 'Leave Request',
        managerId,
        rejectionReason
      );
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }
    
    res.json({
      message: "Application rejected successfully.",
      application: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: `Error rejecting application with id=${req.params.id}`
    });
  }
};

// Update application (general update for department applications)
export const updateDepartmentApplication = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const applicationId = parseInt(req.params.id);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }
    
    // Get the current application details
    const currentApplication = await db.select()
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .where(eq(applications.id, applicationId))
      .limit(1);
    
    if (currentApplication.length === 0) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
      });
    }
    
    const application = currentApplication[0].applications;
    const user = currentApplication[0].users;

    // Verify application is from manager's department
    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only update applications from employees in your department!"
      });
    }
    
    const updateData = { ...req.body };
    
    // Convert date strings to Date objects if they exist
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          message: "Invalid startDate format. Please provide a valid date."
        });
      }
      updateData.startDate = startDate;
    }
    
    if (updateData.endDate) {
      const endDate = new Date(updateData.endDate);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid endDate format. Please provide a valid date."
        });
      }
      updateData.endDate = endDate;
    }
    
    // Validate date logic if both dates are being updated
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return res.status(400).json({
          message: "End date must be after start date."
        });
      }
    }
    
    // If status is being changed to approved or rejected
    if (req.body.status && ['approved', 'rejected'].includes(req.body.status.toLowerCase())) {
      updateData.approvedBy = managerId;
      updateData.approvedAt = new Date();
      
      const status = req.body.status.toLowerCase();
      
      // If approved, create a holiday record
      if (status === 'approved') {
        const holidayStartDate = updateData.startDate || application.startDate;
        const holidayEndDate = updateData.endDate || application.endDate;
        const holidayReason = updateData.reason || application.reason;
        
        await db.insert(daysHoliday).values({
          userId: application.userId,
          reason: holidayReason,
          startDate: holidayStartDate,
          endDate: holidayEndDate,
          status: 'approved',
          approvedBy: managerId,
          approvedAt: new Date()
        });
      }
      
      // Add rejection reason if provided
      if (req.body.rejectionReason) {
        updateData.rejectionReason = req.body.rejectionReason;
      }
      
      // Create notification for the applicant
      const notificationTitle = status === 'approved' 
        ? '✅ Leave Application Approved' 
        : '❌ Leave Application Rejected';
      
      const finalTitle = updateData.title || application.title || 'Leave Request';
      const finalStartDate = updateData.startDate || application.startDate;
      const finalEndDate = updateData.endDate || application.endDate;
      const finalApplicationType = updateData.applicationType || application.applicationType;
      
      const notificationMessage = status === 'approved'
        ? `Great news! Your ${finalApplicationType} application "${finalTitle}" from ${finalStartDate?.toDateString()} to ${finalEndDate?.toDateString()} has been approved by your department manager ${manager.fullName}.`
        : `Your ${finalApplicationType} application "${finalTitle}" from ${finalStartDate?.toDateString()} to ${finalEndDate?.toDateString()} has been rejected by your department manager ${manager.fullName}. Reason: ${req.body.rejectionReason || 'No reason provided'}`;
      
      await db.insert(notifications).values({
        userId: application.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'approved' ? 'success' : 'error'
      });
    }
    
    const result = await db.update(applications)
      .set(updateData)
      .where(eq(applications.id, applicationId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: `Application was ${req.body.status || 'updated'} successfully.`,
        application: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update Application with id=${applicationId}. Maybe Application was not found or req.body is empty!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating Application with id=${req.params.id}`
    });
  }
};

// Create application for employee in manager's department
export const createDepartmentApplication = async (req, res) => {
  try {
    console.log('createDepartmentApplication - req.authData:', req.authData);
    console.log('createDepartmentApplication - req.user:', req.user);
    console.log('createDepartmentApplication - req.headers.user:', req.headers.user);
    
    if (!req.authData || !req.authData.id) {
      console.error('createDepartmentApplication - No authData found!');
      return res.status(401).json({
        message: 'Authentication data not found'
      });
    }
    
    const managerId = req.authData.id;
    
    // Get manager's department
    const [manager] = await db.select()
      .from(users)
      .where(eq(users.id, managerId));
    
    if (!manager || !manager.departmentId) {
      return res.status(403).json({
        message: 'Manager must be assigned to a department'
      });
    }
    
    // Verify the target user is in the manager's department
    const targetUserId = req.body.userId;
    if (!targetUserId) {
      return res.status(400).json({
        message: 'userId is required'
      });
    }
    
    const [targetUser] = await db.select()
      .from(users)
      .where(eq(users.id, targetUserId));
    
    if (!targetUser) {
      return res.status(404).json({
        message: 'Target user not found'
      });
    }
    
    if (targetUser.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: 'You can only create applications for employees in your department'
      });
    }
    
    // Create the application - only include fields that exist in the schema
    const applicationData = {
      userId: targetUserId,
      title: req.body.title,
      reason: req.body.reason,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      applicationType: req.body.applicationType,
      priority: req.body.priority || 'medium',
      status: req.body.status || 'pending',
      jobId: req.body.jobId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating application with data:', applicationData);
    
    const result = await db.insert(applications)
      .values(applicationData)
      .returning();
    
    if (result.length > 0) {
      // Send notification to the target user
      const notificationMessage = targetUserId === managerId
        ? `You created a new ${req.body.applicationType || 'leave'} application "${req.body.title}" from ${req.body.startDate} to ${req.body.endDate}.`
        : `Your manager ${manager.fullName} has created a ${req.body.applicationType || 'leave'} application "${req.body.title}" on your behalf from ${req.body.startDate} to ${req.body.endDate}.`;
      
      await db.insert(notifications).values({
        userId: targetUserId,
        title: '📝 New Application Created',
        message: notificationMessage,
        type: 'info',
        relatedId: result[0].id
      });
      
      res.status(201).json({
        message: 'Application created successfully',
        application: result[0]
      });
    } else {
      res.status(400).json({
        message: 'Failed to create application'
      });
    }
  } catch (error) {
    console.error('Error creating department application:', error);
    res.status(500).json({
      message: 'Error creating application'
    });
  }
};

// Delete application from manager's department
export const deleteDepartmentApplication = async (req, res) => {
  try {
    console.log('deleteDepartmentApplication - req.authData:', req.authData);
    console.log('deleteDepartmentApplication - req.user:', req.user);
    
    if (!req.authData || !req.authData.id) {
      console.error('deleteDepartmentApplication - No authData found!');
      return res.status(401).json({
        message: 'Authentication data not found'
      });
    }
    
    const managerId = req.authData.id;
    const applicationId = parseInt(req.params.id);
    
    // Get manager's department
    const [manager] = await db.select()
      .from(users)
      .where(eq(users.id, managerId));
    
    if (!manager || !manager.departmentId) {
      return res.status(403).json({
        message: 'Manager must be assigned to a department'
      });
    }
    
    // Get the application with user info
    const [application] = await db.select({
      application: applications,
      user: users
    })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .where(eq(applications.id, applicationId));
    
    if (!application) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found`
      });
    }
    
    // Verify the application belongs to a user in manager's department
    if (application.user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: 'You can only delete applications from your department'
      });
    }
    
    // Delete the application
    await db.delete(applications)
      .where(eq(applications.id, applicationId));
    
    res.json({
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department application:', error);
    res.status(500).json({
      message: `Error deleting Application with id=${req.params.id}`
    });
  }
};