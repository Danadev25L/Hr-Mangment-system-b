import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    users, 
    applications,
    notifications,
    daysHoliday
} from '../../../db/schema.js';

/**
 * Manager Application Controller
 * Handles application review and management for department managers
 */

// Get applications from manager's department
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

    // Get applications from manager's department
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
      approvedBy: applications.approvedBy,
      approvedAt: applications.approvedAt,
      rejectionReason: applications.rejectionReason,
      createdAt: applications.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        departmentId: users.departmentId,
        role: users.role
      }
    })
    .from(applications)
    .leftJoin(users, eq(applications.userId, users.id))
    .where(eq(users.departmentId, manager.departmentId));
    
    res.json({
      message: "Department applications retrieved successfully",
      applications: result
    });
  } catch (error) {
    res.status(500).json({
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
      approvedAt: new Date()
    };
    
    // Create a holiday record for approved application
    await db.insert(daysHoliday).values({
      userId: application.userId,
      reason: application.reason,
      startDate: application.startDate,
      endDate: application.endDate,
      status: 'approved',
      approvedBy: managerId,
      approvedAt: new Date()
    });
    
    // Update the application
    const result = await db.update(applications)
      .set(updateData)
      .where(eq(applications.id, applicationId))
      .returning();
    
    // Create notification for the applicant
    await db.insert(notifications).values({
      userId: application.userId,
      title: '✅ Leave Application Approved',
      message: `Great news! Your ${application.applicationType} application "${application.title || 'Leave Request'}" from ${application.startDate?.toDateString()} to ${application.endDate?.toDateString()} has been approved by your department manager ${manager.fullName}. You can now take your planned leave.`,
      type: 'success'
    });
    
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
      approvedBy: managerId,
      approvedAt: new Date(),
      rejectionReason: rejectionReason
    };
    
    // Update the application
    const result = await db.update(applications)
      .set(updateData)
      .where(eq(applications.id, applicationId))
      .returning();
    
    // Create notification for the applicant
    await db.insert(notifications).values({
      userId: application.userId,
      title: '❌ Leave Application Rejected',
      message: `Your ${application.applicationType} application "${application.title || 'Leave Request'}" from ${application.startDate?.toDateString()} to ${application.endDate?.toDateString()} has been rejected by your department manager ${manager.fullName}. Reason: ${rejectionReason}. Please contact your manager if you have questions.`,
      type: 'error'
    });
    
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