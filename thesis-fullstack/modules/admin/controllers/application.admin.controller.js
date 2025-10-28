// Admin can create ANY application
export const createApplication = async (req, res) => {
  try {
    const adminId = req.authData?.id || null;
    const {
      title,
      reason,
      startDate,
      endDate,
      applicationType,
      priority,
      userId
    } = req.body;

    if (!title || !reason || !startDate || !endDate || !applicationType || !priority) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // If userId is not provided, default to admin (self-application)
    const applicantId = userId || adminId;

    const newApp = await db.insert(applications).values({
      title,
      reason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicationType,
      priority,
      userId: applicantId,
      status: 'pending',
      createdAt: new Date()
    }).returning();

    // Optionally, notify the applicant
    await db.insert(notifications).values({
      userId: applicantId,
      title: '📨 Application Submitted',
      message: `Your application "${title}" has been submitted and is pending review.`,
      type: 'info'
    });

    res.status(201).json({
      message: 'Application created successfully!',
      application: newApp[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to create application.'
    });
  }
};
import { eq, desc } from 'drizzle-orm';

import { db } from '../../../db/index.js';
import { 
    users, 
    applications,
    notifications,
    daysHoliday,
    departments
} from '../../../db/schema.js';

/**
 * Admin Application Controller
 * Admin has full access to view, edit, approve/reject, and delete ALL applications across all departments
 */

// Get ALL applications (admin can see everything)
export const getAllApplications = async (req, res) => {
  try {
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
      type: applications.applicationType, // For backwards compatibility with frontend
      userName: users.fullName,
      employeeCode: users.employeeCode,
      departmentName: departments.departmentName,
      submissionDate: applications.createdAt,
      description: applications.reason
    })
    .from(applications)
    .leftJoin(users, eq(applications.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .orderBy(desc(applications.createdAt));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving all applications."
    });
  }
};

// Get single application by ID (admin can view any)
export const getApplicationById = async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    
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
    
    res.json({
      message: "Application retrieved successfully",
      application: result
    });
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving Application with id=${req.params.id}`
    });
  }
};

// Admin can update ANY application
export const updateApplication = async (req, res) => {
  try {
    const adminId = req.authData.id;
    const applicationId = parseInt(req.params.id);
    
    // Get admin details
    const admin = await db.query.users.findFirst({
      where: eq(users.id, adminId)
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!"
      });
    }

    // Get the current application details
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId)
    });
    
    if (!application) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
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
      updateData.approvedBy = adminId;
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
          approvedBy: adminId,
          approvedAt: new Date()
        });
      }
      
      // Add rejection reason if provided
      if (req.body.rejectionReason) {
        updateData.rejectionReason = req.body.rejectionReason;
      }
      
      // Create notification for the applicant
      const notificationTitle = status === 'approved' 
        ? '✅ Leave Application Approved by Admin' 
        : '❌ Leave Application Rejected by Admin';
      
      const finalTitle = updateData.title || application.title || 'Leave Request';
      const finalStartDate = updateData.startDate || application.startDate;
      const finalEndDate = updateData.endDate || application.endDate;
      const finalApplicationType = updateData.applicationType || application.applicationType;
      
      const notificationMessage = status === 'approved'
        ? `Your ${finalApplicationType} application "${finalTitle}" from ${finalStartDate?.toDateString()} to ${finalEndDate?.toDateString()} has been approved by the administrator ${admin.fullName}.`
        : `Your ${finalApplicationType} application "${finalTitle}" from ${finalStartDate?.toDateString()} to ${finalEndDate?.toDateString()} has been rejected by the administrator ${admin.fullName}. Reason: ${req.body.rejectionReason || 'No reason provided'}`;
      
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
      message: `Error updating Application with id=${req.params.id}: ${error.message}`
    });
  }
};

// Admin can delete ANY application
export const deleteApplication = async (req, res) => {
  try {
    const adminId = req.authData.id;
    const applicationId = parseInt(req.params.id);

    // Get admin details
    const admin = await db.query.users.findFirst({
      where: eq(users.id, adminId)
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!"
      });
    }

    // Get the application details before deletion
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId)
    });

    if (!application) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
      });
    }

    // Delete the application
    await db.delete(applications)
      .where(eq(applications.id, applicationId));

    // Notify the employee about the deletion
    await db.insert(notifications).values({
      userId: application.userId,
      title: '🗑️ Application Deleted by Admin',
      message: `Your application "${application.title || 'Leave Request'}" (${application.applicationType}) from ${application.startDate?.toDateString()} to ${application.endDate?.toDateString()} has been deleted by the administrator ${admin.fullName}.`,
      type: 'warning'
    });

    res.json({
      message: "Application deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({
      message: `Error deleting Application with id=${req.params.id}: ${error.message}`
    });
  }
};

// Admin can approve ANY application
export const approveApplication = async (req, res) => {
  try {
    const adminId = req.authData.id;
    const applicationId = parseInt(req.params.id);
    
    // Get admin details
    const admin = await db.query.users.findFirst({
      where: eq(users.id, adminId)
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!"
      });
    }

    // Get the current application details
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId)
    });
    
    if (!application) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
      });
    }
    
    const updateData = {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date()
    };
    
    // Create a holiday record for approved application
    await db.insert(daysHoliday).values({
      userId: application.userId,
      reason: application.reason,
      startDate: application.startDate,
      endDate: application.endDate,
      status: 'approved',
      approvedBy: adminId,
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
      title: '✅ Leave Application Approved by Admin',
      message: `Your ${application.applicationType} application "${application.title || 'Leave Request'}" from ${application.startDate?.toDateString()} to ${application.endDate?.toDateString()} has been approved by the administrator ${admin.fullName}.`,
      type: 'success'
    });
    
    res.json({
      message: "Application approved successfully.",
      application: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: `Error approving application with id=${req.params.id}: ${error.message}`
    });
  }
};

// Admin can reject ANY application
export const rejectApplication = async (req, res) => {
  try {
    const adminId = req.authData.id;
    const applicationId = parseInt(req.params.id);
    const rejectionReason = req.body.rejectionReason || 'No reason provided';
    
    // Get admin details
    const admin = await db.query.users.findFirst({
      where: eq(users.id, adminId)
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!"
      });
    }

    // Get the current application details
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId)
    });
    
    if (!application) {
      return res.status(404).json({
        message: `Application with id=${applicationId} not found!`
      });
    }
    
    const updateData = {
      status: 'rejected',
      approvedBy: adminId,
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
      title: '❌ Leave Application Rejected by Admin',
      message: `Your ${application.applicationType} application "${application.title || 'Leave Request'}" from ${application.startDate?.toDateString()} to ${application.endDate?.toDateString()} has been rejected by the administrator ${admin.fullName}. Reason: ${rejectionReason}`,
      type: 'error'
    });
    
    res.json({
      message: "Application rejected successfully.",
      application: result[0]
    });
  } catch (error) {
    res.status(500).json({
      message: `Error rejecting application with id=${req.params.id}: ${error.message}`
    });
  }
};
