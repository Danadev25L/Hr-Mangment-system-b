import { eq, and, lte, gte, isNull, or } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { jobs, users } from '../../../db/schema.js';

/**
 * Manager Job Controller
 * Handles job posting management for department managers
 */

// Create and Save a new Job for department employees
export const createDepartmentJob = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content cannot be empty!"
      });
    }

    const managerId = req.authData.id;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required!"
      });
    }

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get user information and verify they're in the same department
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found!"
      });
    }

    // Verify user is in manager's department
    if (user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only create jobs for employees in your department!"
      });
    }

    // Use user's baseSalary as default
    const salary = user.baseSalary || req.body.salary || null;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();

    // Create new job with jobTitle
    const [newJob] = await db.insert(jobs)
      .values({
        jobTitle: req.body.jobTitle,
        startDate: startDate,
        endDate: null,
        userId: userId,
        description: req.body.description,
        salary: salary ? parseInt(salary) : null,
        isActive: true
      })
      .returning();

    res.json({
      message: "Department job created successfully",
      job: newJob
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while creating the Job."
    });
  }
};

// Retrieve all Jobs for manager's department
export const getDepartmentJobs = async (req, res) => {
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

    const departmentJobs = await db.query.jobs.findMany({
      where: eq(jobs.departmentId, manager.departmentId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            fullName: true,
            jobTitle: true,
            role: true,
            baseSalary: true,
            departmentId: true
          },
          with: {
            department: {
              columns: {
                id: true,
                departmentName: true
              }
            }
          }
        }
      },
      orderBy: [jobs.startDate, jobs.endDate]
    });

    res.json({
      message: "Department jobs retrieved successfully",
      jobs: departmentJobs
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving department jobs."
    });
  }
};

// Retrieve Jobs by specific user in manager's department
export const getDepartmentEmployeeJobs = async (req, res) => {
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

    // Verify user is in manager's department
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only view jobs for employees in your department!"
      });
    }

    const userJobs = await db.select()
      .from(jobs)
      .where(eq(jobs.userId, userId));

    res.json({
      message: "Employee jobs retrieved successfully",
      jobs: userJobs
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving employee jobs."
    });
  }
};

// Update a Job by the id in the request (for department employees only)
export const updateDepartmentJob = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const jobId = parseInt(req.params.id);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get the job and verify it belongs to an employee in the manager's department
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: {
        user: true
      }
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found!"
      });
    }

    if (job.user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only update jobs for employees in your department!"
      });
    }

    const [updatedJob] = await db.update(jobs)
      .set({
        jobTitle: req.body.jobTitle,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        userId: req.body.userId ? parseInt(req.body.userId) : undefined,
        description: req.body.description,
        salary: req.body.salary ? parseInt(req.body.salary) : null,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, jobId))
      .returning();

    if (!updatedJob) {
      return res.status(404).json({
        message: `Cannot update Job with id=${jobId}. Job not found!`
      });
    }

    res.json({
      message: "Department job was updated successfully.",
      job: updatedJob
    });
  } catch (error) {
    res.status(500).json({
      message: `Error updating Job with id=${req.params.id}`
    });
  }
};

// Delete a Job (for department employees only)
export const deleteDepartmentJob = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const jobId = parseInt(req.params.id);

    // Get manager's department
    const manager = await db.query.users.findFirst({
      where: eq(users.id, managerId)
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found!"
      });
    }

    // Get the job and verify it belongs to an employee in the manager's department
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: {
        user: true
      }
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found!"
      });
    }

    if (job.user.departmentId !== manager.departmentId) {
      return res.status(403).json({
        message: "You can only delete jobs for employees in your department!"
      });
    }

    const [deletedJob] = await db.delete(jobs)
      .where(eq(jobs.id, jobId))
      .returning();

    if (!deletedJob) {
      return res.status(404).json({
        message: `Cannot delete Job with id=${jobId}. Job not found!`
      });
    }

    res.json({
      message: "Department job was deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({
      message: `Could not delete Job with id=${req.params.id}`
    });
  }
};

// Get active jobs for manager's department
export const getActiveDepartmentJobs = async (req, res) => {
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

    const now = new Date();
    
    const activeJobs = await db.query.jobs.findMany({
      where: and(
        eq(jobs.isActive, true),
        or(
          isNull(jobs.endDate),
          gte(jobs.endDate, now)
        )
      ),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            fullName: true,
            jobTitle: true,
            role: true,
            baseSalary: true,
            departmentId: true
          },
          with: {
            department: {
              columns: {
                id: true,
                departmentName: true
              }
            }
          },
          where: eq(users.departmentId, manager.departmentId)
        }
      },
      orderBy: [jobs.createdAt]
    });

    // Filter out jobs where user is null (not in manager's department)
    const filteredJobs = activeJobs.filter(job => job.user !== null);

    res.json({
      message: "Active department jobs retrieved successfully",
      jobs: filteredJobs
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving active department jobs"
    });
  }
};