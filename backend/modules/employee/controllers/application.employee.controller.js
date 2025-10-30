import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
    users, 
    applications,
    notifications
} from '../../../db/schema.js';

/**
 * Employee Application Controller
 * Handles application submission and management for employees
 */

// Create and Save a new Application
export const submitApplication = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content can not be empty!"
      });
    }

    const userId = req.authData.id;

    // Validate required fields
    if (!req.body.reason || !req.body.startDate || !req.body.endDate || !req.body.title) {
      return res.status(400).json({
        message: "Missing required fields: title, reason, startDate, and endDate are required."
      });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Please provide valid dates."
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "End date must be after start date."
      });
    }

    // Create an Application
    const newApplication = {
      title: String(req.body.title).trim(),
      reason: String(req.body.reason).trim(),
      startDate: startDate,
      endDate: endDate,
      status: "pending",
      applicationType: req.body.applicationType || req.body.type || "leave_request",
      priority: req.body.priority || "medium",
      userId: userId,
    };

    // Save Application in the database
    const result = await db.insert(applications)
      .values(newApplication)
      .returning();
    
    // Get user information for notifications
    const [applicant] = await db.select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      departmentId: users.departmentId
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
    if (applicant) {
      // Create notification for applicant
      await db.insert(notifications).values({
        userId: applicant.id,
        title: '📝 Application Submitted Successfully',
        message: `Your ${newApplication.applicationType} application "${newApplication.title}" from ${newApplication.startDate.toDateString()} to ${newApplication.endDate.toDateString()} has been submitted and is pending review.`,
        type: 'info'
      });
      
      // Find and notify managers in the same department
      const managers = await db.select({
        id: users.id,
        fullName: users.fullName,
        username: users.username
      })
      .from(users)
      .where(
        and(
          eq(users.departmentId, applicant.departmentId),
          eq(users.role, 'ROLE_MANAGER')
        )
      );
      
      // Create notifications for all managers in the department
      for (const manager of managers) {
        await db.insert(notifications).values({
          userId: manager.id,
          title: '📋 New Application Requires Review',
          message: `${applicant.fullName} has submitted a new ${newApplication.applicationType} application "${newApplication.title}" from ${newApplication.startDate.toDateString()} to ${newApplication.endDate.toDateString()}. Please review and approve/reject.`,
          type: 'info'
        });
      }
    }
    
    res.json({
      message: "Application submitted successfully",
      application: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the Application.",
      details: error.message
    });
  }
};

// Retrieve employee's own applications
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.authData.id;
    
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
      createdAt: applications.createdAt
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(applications.createdAt);
    
    res.json({
      message: "My applications retrieved successfully",
      applications: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving your applications."
    });
  }
};

// Get employee's recent applications (from 2 weeks ago to 1 week ahead)
export const getMyRecentApplications = async (req, res) => {
  try {
    const userId = req.authData.id;
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
      createdAt: applications.createdAt
    })
    .from(applications)
    .where(and(
      gte(applications.startDate, twoWeeksAgo),
      lte(applications.startDate, oneWeekAhead),
      eq(applications.userId, userId)
    ));
    
    res.json({
      message: "My recent applications retrieved successfully",
      applications: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving your recent applications."
    });
  }
};

// Find employee's single application with an id
export const getMyApplication = async (req, res) => {
  try {
    const userId = req.authData.id;
    const id = parseInt(req.params.id);
    
    const result = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, id),
        eq(applications.userId, userId)
      ),
      with: {
        approver: {
          columns: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });
    
    if (result) {
      res.json({
        message: "Application retrieved successfully",
        application: result
      });
    } else {
      res.status(404).json({
        message: `Application with id=${id} not found or you don't have permission to view it.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving Application with id=${req.params.id}`
    });
  }
};

// Update employee's own pending application
export const updateMyApplication = async (req, res) => {
  try {
    const userId = req.authData.id;
    const id = parseInt(req.params.id);
    
    // Get the current application details
    const currentApplication = await db.select()
      .from(applications)
      .where(and(
        eq(applications.id, id),
        eq(applications.userId, userId)
      ))
      .limit(1);
    
    if (currentApplication.length === 0) {
      return res.status(404).json({
        message: `Application with id=${id} not found or you don't have permission to update it.`
      });
    }
    
    const application = currentApplication[0];
    const isPending = application.status?.toLowerCase() === 'pending';
    
    // Only allow updates to pending applications
    if (!isPending) {
      return res.status(401).json({
        message: "You can only edit pending applications. This application has already been processed."
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
    
    // Employees can only update basic fields, not approval-related fields
    const allowedFields = ['title', 'reason', 'startDate', 'endDate', 'applicationType', 'priority'];
    const filteredUpdateData = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }
    
    const result = await db.update(applications)
      .set(filteredUpdateData)
      .where(and(
        eq(applications.id, id),
        eq(applications.userId, userId)
      ))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Application updated successfully.",
        application: result[0]
      });
    } else {
      res.status(404).json({
        message: `Cannot update Application with id=${id}. Maybe Application was not found!`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error updating Application with id=${req.params.id}`
    });
  }
};

// Delete employee's own pending application
export const deleteMyApplication = async (req, res) => {
  try {
    const userId = req.authData.id;
    const id = parseInt(req.params.id);
    
    // First, get the application to check permissions and status
    const applicationToDelete = await db.select()
      .from(applications)
      .where(and(
        eq(applications.id, id),
        eq(applications.userId, userId)
      ))
      .limit(1);
    
    if (applicationToDelete.length === 0) {
      return res.status(404).json({
        message: `Application with id=${id} not found or you don't have permission to delete it.`
      });
    }
    
    const application = applicationToDelete[0];
    
    // Only allow deletion of pending applications
    if (application.status?.toLowerCase() !== 'pending') {
      return res.status(403).json({
        message: "You can only delete pending applications. This application has already been processed."
      });
    }
    
    // Delete the application
    const result = await db.delete(applications)
      .where(and(
        eq(applications.id, id),
        eq(applications.userId, userId)
      ))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Application was deleted successfully!",
        deletedApplication: result[0]
      });
    } else {
      res.status(500).json({
        message: `Failed to delete Application with id=${id}`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete Application with id=${req.params.id}`
    });
  }
};

// Get application statistics for employee
export const getMyApplicationStats = async (req, res) => {
  try {
    const userId = req.authData.id;

    // Get all applications for the user
    const allApplications = await db.select()
      .from(applications)
      .where(eq(applications.userId, userId));

    const stats = {
      total: allApplications.length,
      pending: allApplications.filter(app => app.status === 'pending').length,
      approved: allApplications.filter(app => app.status === 'approved').length,
      rejected: allApplications.filter(app => app.status === 'rejected').length,
      byType: {}
    };

    // Group by application type
    allApplications.forEach(app => {
      const type = app.applicationType || 'leave_request';
      if (!stats.byType[type]) {
        stats.byType[type] = {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        };
      }
      stats.byType[type].total++;
      stats.byType[type][app.status]++;
    });

    res.json({
      message: "Application statistics retrieved successfully",
      stats
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving application statistics."
    });
  }
};