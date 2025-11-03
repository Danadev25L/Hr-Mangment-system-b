import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  workShifts,
  employeeShifts,
  attendancePolicies,
  departmentPolicies,
  breakTypes,
  attendanceBreaks,
  overtimeRequests,
  overtimeTracking,
  geofenceLocations,
  users,
  departments
} from '../../../db/schema.js';

/**
 * ==================== SHIFT MANAGEMENT ====================
 */

// Get all work shifts
export const getAllShifts = async (req, res) => {
  try {
    const { isActive } = req.query;

    let filters = [];
    if (isActive !== undefined) {
      filters.push(eq(workShifts.isActive, isActive === 'true'));
    }

    const shifts = await db.select()
      .from(workShifts)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(workShifts.shiftName);

    res.json({
      message: "Work shifts retrieved successfully",
      shifts,
      count: shifts.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving shifts"
    });
  }
};

// Create new work shift
export const createShift = async (req, res) => {
  try {
    const {
      shiftName,
      shiftCode,
      startTime,
      endTime,
      gracePeriodMinutes,
      earlyDepartureThreshold,
      minimumWorkHours,
      halfDayThreshold,
      breakDuration,
      isNightShift,
      description
    } = req.body;

    if (!shiftName || !shiftCode || !startTime || !endTime) {
      return res.status(400).json({ 
        message: "Shift name, code, start time, and end time are required" 
      });
    }

    const [shift] = await db.insert(workShifts)
      .values({
        shiftName,
        shiftCode,
        startTime,
        endTime,
        gracePeriodMinutes: gracePeriodMinutes || 15,
        earlyDepartureThreshold: earlyDepartureThreshold || 15,
        minimumWorkHours: minimumWorkHours || 480,
        halfDayThreshold: halfDayThreshold || 240,
        breakDuration: breakDuration || 60,
        isNightShift: isNightShift || false,
        description: description || null
      })
      .returning();

    res.json({
      message: "Work shift created successfully",
      shift
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error creating shift"
    });
  }
};

// Update work shift
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    const [shift] = await db.update(workShifts)
      .set(updateData)
      .where(eq(workShifts.id, parseInt(id)))
      .returning();

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.json({
      message: "Work shift updated successfully",
      shift
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error updating shift"
    });
  }
};

// Assign shift to employee
export const assignShiftToEmployee = async (req, res) => {
  try {
    const { userId, shiftId, effectiveFrom, effectiveTo } = req.body;

    if (!userId || !shiftId || !effectiveFrom) {
      return res.status(400).json({ 
        message: "User ID, shift ID, and effective from date are required" 
      });
    }

    // Deactivate previous assignments
    await db.update(employeeShifts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employeeShifts.userId, parseInt(userId)));

    const [assignment] = await db.insert(employeeShifts)
      .values({
        userId: parseInt(userId),
        shiftId: parseInt(shiftId),
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        assignedBy: req.authData.id
      })
      .returning();

    res.json({
      message: "Shift assigned to employee successfully",
      assignment
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error assigning shift"
    });
  }
};

// Bulk assign shifts to multiple employees
export const bulkAssignShifts = async (req, res) => {
  try {
    const { userIds, shiftId, effectiveFrom } = req.body;

    if (!userIds || !Array.isArray(userIds) || !shiftId || !effectiveFrom) {
      return res.status(400).json({ 
        message: "User IDs array, shift ID, and effective from date are required" 
      });
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        // Deactivate previous assignments
        await db.update(employeeShifts)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(employeeShifts.userId, parseInt(userId)));

        const [assignment] = await db.insert(employeeShifts)
          .values({
            userId: parseInt(userId),
            shiftId: parseInt(shiftId),
            effectiveFrom,
            assignedBy: req.authData.id
          })
          .returning();

        results.push({ userId, success: true, assignment });

      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    res.json({
      message: `Shifts assigned: ${results.length} successful, ${errors.length} failed`,
      successful: results,
      failed: errors
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error in bulk assignment"
    });
  }
};

// Get employee shift assignments
export const getEmployeeShifts = async (req, res) => {
  try {
    const { userId } = req.params;

    const assignments = await db.select({
      id: employeeShifts.id,
      userId: employeeShifts.userId,
      effectiveFrom: employeeShifts.effectiveFrom,
      effectiveTo: employeeShifts.effectiveTo,
      isActive: employeeShifts.isActive,
      shiftName: workShifts.shiftName,
      shiftCode: workShifts.shiftCode,
      startTime: workShifts.startTime,
      endTime: workShifts.endTime
    })
    .from(employeeShifts)
    .leftJoin(workShifts, eq(employeeShifts.shiftId, workShifts.id))
    .where(eq(employeeShifts.userId, parseInt(userId)))
    .orderBy(desc(employeeShifts.effectiveFrom));

    res.json({
      message: "Employee shift assignments retrieved successfully",
      assignments
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving employee shifts"
    });
  }
};

/**
 * ==================== ATTENDANCE POLICIES ====================
 */

// Get all attendance policies
export const getAllPolicies = async (req, res) => {
  try {
    const policies = await db.select()
      .from(attendancePolicies)
      .where(eq(attendancePolicies.isActive, true))
      .orderBy(attendancePolicies.policyName);

    res.json({
      message: "Attendance policies retrieved successfully",
      policies,
      count: policies.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving policies"
    });
  }
};

// Create attendance policy
export const createPolicy = async (req, res) => {
  try {
    const policyData = {
      ...req.body
    };

    if (!policyData.policyName || !policyData.policyCode) {
      return res.status(400).json({ 
        message: "Policy name and code are required" 
      });
    }

    const [policy] = await db.insert(attendancePolicies)
      .values(policyData)
      .returning();

    res.json({
      message: "Attendance policy created successfully",
      policy
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error creating policy"
    });
  }
};

// Update attendance policy
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    const [policy] = await db.update(attendancePolicies)
      .set(updateData)
      .where(eq(attendancePolicies.id, parseInt(id)))
      .returning();

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.json({
      message: "Attendance policy updated successfully",
      policy
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error updating policy"
    });
  }
};

// Assign policy to department
export const assignPolicyToDepartment = async (req, res) => {
  try {
    const { departmentId, policyId, effectiveFrom } = req.body;

    if (!departmentId || !policyId || !effectiveFrom) {
      return res.status(400).json({ 
        message: "Department ID, policy ID, and effective from date are required" 
      });
    }

    // Deactivate previous policies
    await db.update(departmentPolicies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(departmentPolicies.departmentId, parseInt(departmentId)));

    const [assignment] = await db.insert(departmentPolicies)
      .values({
        departmentId: parseInt(departmentId),
        policyId: parseInt(policyId),
        effectiveFrom
      })
      .returning();

    res.json({
      message: "Policy assigned to department successfully",
      assignment
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error assigning policy"
    });
  }
};

/**
 * ==================== OVERTIME MANAGEMENT ====================
 */

// Get all overtime requests
export const getAllOvertimeRequests = async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;

    let filters = [];
    if (status) filters.push(eq(overtimeRequests.status, status));
    if (userId) filters.push(eq(overtimeRequests.userId, parseInt(userId)));
    if (startDate) filters.push(gte(overtimeRequests.requestDate, new Date(startDate)));
    if (endDate) filters.push(lte(overtimeRequests.requestDate, new Date(endDate)));

    const requests = await db.select({
      id: overtimeRequests.id,
      userId: overtimeRequests.userId,
      requestDate: overtimeRequests.requestDate,
      plannedHours: overtimeRequests.plannedHours,
      reason: overtimeRequests.reason,
      status: overtimeRequests.status,
      approvedAt: overtimeRequests.approvedAt,
      rejectionReason: overtimeRequests.rejectionReason,
      createdAt: overtimeRequests.createdAt,
      user: {
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        department: users.department
      }
    })
    .from(overtimeRequests)
    .leftJoin(users, eq(overtimeRequests.userId, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(overtimeRequests.createdAt));

    res.json({
      message: "Overtime requests retrieved successfully",
      requests,
      count: requests.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving overtime requests"
    });
  }
};

// Approve overtime request
export const approveOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [request] = await db.update(overtimeRequests)
      .set({
        status: 'approved',
        approvedBy: req.authData.id,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(overtimeRequests.id, parseInt(id)))
      .returning();

    if (!request) {
      return res.status(404).json({ message: "Overtime request not found" });
    }

    res.json({
      message: "Overtime request approved successfully",
      request
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error approving overtime"
    });
  }
};

// Reject overtime request
export const rejectOvertimeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const [request] = await db.update(overtimeRequests)
      .set({
        status: 'rejected',
        approvedBy: req.authData.id,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
        updatedAt: new Date()
      })
      .where(eq(overtimeRequests.id, parseInt(id)))
      .returning();

    if (!request) {
      return res.status(404).json({ message: "Overtime request not found" });
    }

    res.json({
      message: "Overtime request rejected",
      request
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error rejecting overtime"
    });
  }
};

// Get overtime tracking records
export const getOvertimeTracking = async (req, res) => {
  try {
    const { userId, month, year, isApproved } = req.query;

    let filters = [];
    if (userId) filters.push(eq(overtimeTracking.userId, parseInt(userId)));
    if (isApproved !== undefined) {
      filters.push(eq(overtimeTracking.isApproved, isApproved === 'true'));
    }

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filters.push(gte(overtimeTracking.date, start));
      filters.push(lte(overtimeTracking.date, end));
    }

    const tracking = await db.select({
      id: overtimeTracking.id,
      userId: overtimeTracking.userId,
      date: overtimeTracking.date,
      overtimeMinutes: overtimeTracking.overtimeMinutes,
      overtimeRate: overtimeTracking.overtimeRate,
      isApproved: overtimeTracking.isApproved,
      remarks: overtimeTracking.remarks,
      user: {
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        department: users.department
      }
    })
    .from(overtimeTracking)
    .leftJoin(users, eq(overtimeTracking.userId, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(overtimeTracking.date));

    // Calculate totals
    const totalOvertimeMinutes = tracking.reduce((sum, t) => sum + t.overtimeMinutes, 0);
    const approvedOvertimeMinutes = tracking
      .filter(t => t.isApproved)
      .reduce((sum, t) => sum + t.overtimeMinutes, 0);

    res.json({
      message: "Overtime tracking retrieved successfully",
      tracking,
      summary: {
        totalRecords: tracking.length,
        totalOvertimeHours: `${Math.floor(totalOvertimeMinutes / 60)}h ${totalOvertimeMinutes % 60}m`,
        approvedOvertimeHours: `${Math.floor(approvedOvertimeMinutes / 60)}h ${approvedOvertimeMinutes % 60}m`,
        pendingApprovalCount: tracking.filter(t => !t.isApproved).length
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving overtime tracking"
    });
  }
};

// Approve overtime tracking
export const approveOvertimeTracking = async (req, res) => {
  try {
    const { id } = req.params;

    const [tracking] = await db.update(overtimeTracking)
      .set({
        isApproved: true,
        approvedBy: req.authData.id,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(overtimeTracking.id, parseInt(id)))
      .returning();

    if (!tracking) {
      return res.status(404).json({ message: "Overtime tracking record not found" });
    }

    res.json({
      message: "Overtime tracking approved successfully",
      tracking
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error approving overtime tracking"
    });
  }
};

/**
 * ==================== GEOFENCE MANAGEMENT ====================
 */

// Get all geofence locations
export const getAllGeofences = async (req, res) => {
  try {
    const locations = await db.select()
      .from(geofenceLocations)
      .where(eq(geofenceLocations.isActive, true))
      .orderBy(geofenceLocations.locationName);

    res.json({
      message: "Geofence locations retrieved successfully",
      locations,
      count: locations.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving geofences"
    });
  }
};

// Create geofence location
export const createGeofence = async (req, res) => {
  try {
    const { locationName, locationCode, latitude, longitude, radiusMeters, address } = req.body;

    if (!locationName || !locationCode || !latitude || !longitude) {
      return res.status(400).json({ 
        message: "Location name, code, latitude, and longitude are required" 
      });
    }

    const [location] = await db.insert(geofenceLocations)
      .values({
        locationName,
        locationCode,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radiusMeters: radiusMeters || 100,
        address: address || null
      })
      .returning();

    res.json({
      message: "Geofence location created successfully",
      location
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error creating geofence"
    });
  }
};

// Update geofence location
export const updateGeofence = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    if (updateData.latitude) updateData.latitude = updateData.latitude.toString();
    if (updateData.longitude) updateData.longitude = updateData.longitude.toString();

    const [location] = await db.update(geofenceLocations)
      .set(updateData)
      .where(eq(geofenceLocations.id, parseInt(id)))
      .returning();

    if (!location) {
      return res.status(404).json({ message: "Geofence location not found" });
    }

    res.json({
      message: "Geofence location updated successfully",
      location
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error updating geofence"
    });
  }
};

/**
 * ==================== BREAK TYPES MANAGEMENT ====================
 */

// Get all break types
export const getAllBreakTypes = async (req, res) => {
  try {
    const breakTypesList = await db.select()
      .from(breakTypes)
      .orderBy(breakTypes.breakName);

    res.json({
      message: "Break types retrieved successfully",
      breakTypes: breakTypesList,
      count: breakTypesList.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error retrieving break types"
    });
  }
};

// Create break type
export const createBreakType = async (req, res) => {
  try {
    const { breakName, breakCode, durationMinutes, isPaid, isMandatory, description } = req.body;

    if (!breakName || !breakCode || !durationMinutes) {
      return res.status(400).json({ 
        message: "Break name, code, and duration are required" 
      });
    }

    const [breakType] = await db.insert(breakTypes)
      .values({
        breakName,
        breakCode,
        durationMinutes,
        isPaid: isPaid || false,
        isMandatory: isMandatory || false,
        description: description || null
      })
      .returning();

    res.json({
      message: "Break type created successfully",
      breakType
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error creating break type"
    });
  }
};

export default {
  getAllShifts,
  createShift,
  updateShift,
  assignShiftToEmployee,
  bulkAssignShifts,
  getEmployeeShifts,
  getAllPolicies,
  createPolicy,
  updatePolicy,
  assignPolicyToDepartment,
  getAllOvertimeRequests,
  approveOvertimeRequest,
  rejectOvertimeRequest,
  getOvertimeTracking,
  approveOvertimeTracking,
  getAllGeofences,
  createGeofence,
  updateGeofence,
  getAllBreakTypes,
  createBreakType
};
