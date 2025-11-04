import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  attendanceRecords, 
  attendanceCorrections, 
  attendanceSummary,
  users,
  departments
} from '../../../db/schema.js';

/**
 * Admin Attendance Controller
 * Handles admin attendance operations: view all attendance, generate reports, manage records
 */

// Get all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, month, year, userId, departmentId, status } = req.query;

    let filters = [];

    // Date filters
    if (startDate && endDate) {
      filters.push(gte(attendanceRecords.date, new Date(startDate)));
      filters.push(lte(attendanceRecords.date, new Date(endDate)));
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filters.push(gte(attendanceRecords.date, start));
      filters.push(lte(attendanceRecords.date, end));
    }

    if (userId) filters.push(eq(attendanceRecords.userId, parseInt(userId)));
    if (status) filters.push(eq(attendanceRecords.status, status));

    const records = await db.select({
      id: attendanceRecords.id,
      userId: attendanceRecords.userId,
      date: attendanceRecords.date,
      checkIn: attendanceRecords.checkIn,
      checkOut: attendanceRecords.checkOut,
      workingHours: attendanceRecords.workingHours,
      status: attendanceRecords.status,
      isLate: attendanceRecords.isLate,
      lateMinutes: attendanceRecords.lateMinutes,
      overtimeMinutes: attendanceRecords.overtimeMinutes,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        departmentId: users.departmentId,
        department: users.department
      }
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(attendanceRecords.date));

    // Filter by department if specified
    let filteredRecords = records;
    if (departmentId) {
      filteredRecords = records.filter(r => r.user.departmentId === parseInt(departmentId));
    }

    res.json({
      message: "Attendance records retrieved successfully",
      attendance: filteredRecords,
      count: filteredRecords.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving attendance"
    });
  }
};

// Get all attendance summaries
export const getAllAttendanceSummaries = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const summaries = await db.select({
      id: attendanceSummary.id,
      userId: attendanceSummary.userId,
      month: attendanceSummary.month,
      year: attendanceSummary.year,
      totalWorkingDays: attendanceSummary.totalWorkingDays,
      presentDays: attendanceSummary.presentDays,
      absentDays: attendanceSummary.absentDays,
      lateDays: attendanceSummary.lateDays,
      leaveDays: attendanceSummary.leaveDays,
      totalWorkingHours: attendanceSummary.totalWorkingHours,
      attendancePercentage: attendanceSummary.attendancePercentage,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        departmentId: users.departmentId,
        department: users.department
      }
    })
    .from(attendanceSummary)
    .leftJoin(users, eq(attendanceSummary.userId, users.id))
    .where(and(
      eq(attendanceSummary.month, targetMonth),
      eq(attendanceSummary.year, targetYear)
    ));

    let filteredSummaries = summaries;
    if (departmentId) {
      filteredSummaries = summaries.filter(s => s.user.departmentId === parseInt(departmentId));
    }

    res.json({
      message: "Attendance summaries retrieved successfully",
      summaries: filteredSummaries,
      month: targetMonth,
      year: targetYear
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving summaries"
    });
  }
};

// Get all correction requests
export const getAllCorrectionRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let filters = [];
    if (status) filters.push(eq(attendanceCorrections.status, status));

    const corrections = await db.select({
      id: attendanceCorrections.id,
      userId: attendanceCorrections.userId,
      date: attendanceCorrections.date,
      requestType: attendanceCorrections.requestType,
      originalCheckIn: attendanceCorrections.originalCheckIn,
      originalCheckOut: attendanceCorrections.originalCheckOut,
      requestedCheckIn: attendanceCorrections.requestedCheckIn,
      requestedCheckOut: attendanceCorrections.requestedCheckOut,
      reason: attendanceCorrections.reason,
      status: attendanceCorrections.status,
      reviewNotes: attendanceCorrections.reviewNotes,
      createdAt: attendanceCorrections.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        department: users.department
      }
    })
    .from(attendanceCorrections)
    .leftJoin(users, eq(attendanceCorrections.userId, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(attendanceCorrections.createdAt));

    res.json({
      message: "Correction requests retrieved successfully",
      corrections,
      count: corrections.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving corrections"
    });
  }
};

// Manual attendance entry (Admin only)
export const createManualAttendance = async (req, res) => {
  try {
    const { userId, date, checkIn, checkOut, status, notes } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ message: "User ID and date are required" });
    }

    const attendanceData = {
      userId: parseInt(userId),
      date: new Date(date),
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status: status || 'present',
      notes: notes || null,
      isManualEntry: true,
      approvedBy: req.authData.id,
      approvedAt: new Date()
    };

    // Calculate working hours if both check-in and check-out provided
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      attendanceData.workingHours = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
    }

    const [record] = await db.insert(attendanceRecords)
      .values(attendanceData)
      .returning();

    res.json({
      message: "Manual attendance entry created successfully",
      attendance: record
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while creating attendance"
    });
  }
};

// Update attendance record (Admin only)
export const updateAttendance = async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const { checkIn, checkOut, status, notes } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (checkIn) updateData.checkIn = new Date(checkIn);
    if (checkOut) updateData.checkOut = new Date(checkOut);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate working hours if both times present
    if (updateData.checkIn && updateData.checkOut) {
      updateData.workingHours = Math.floor((updateData.checkOut - updateData.checkIn) / (1000 * 60));
    }

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, recordId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json({
      message: "Attendance record updated successfully",
      attendance: updated
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while updating attendance"
    });
  }
};

// Delete attendance record (Admin only)
export const deleteAttendance = async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);

    await db.delete(attendanceRecords)
      .where(eq(attendanceRecords.id, recordId));

    res.json({
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while deleting attendance"
    });
  }
};

// Generate monthly summaries for all users (Admin only)
export const generateMonthlySummaries = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.active, true));

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    for (const user of allUsers) {
      // Get attendance records for the month
      const records = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, user.id),
          gte(attendanceRecords.date, start),
          lte(attendanceRecords.date, end)
        ));

      const presentDays = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentDays = records.filter(r => r.status === 'absent').length;
      const lateDays = records.filter(r => r.isLate).length;
      const leaveDays = records.filter(r => r.status === 'on_leave').length;
      const halfDays = records.filter(r => r.status === 'half_day').length;
      const totalWorkingHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
      const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

      const totalWorkingDays = new Date(targetYear, targetMonth, 0).getDate();
      const attendancePercentage = totalWorkingDays > 0 
        ? Math.round((presentDays / totalWorkingDays) * 100) 
        : 0;

      // Insert or update summary
      await db.insert(attendanceSummary)
        .values({
          userId: user.id,
          month: targetMonth,
          year: targetYear,
          totalWorkingDays,
          presentDays,
          absentDays,
          lateDays,
          halfDays,
          leaveDays,
          totalWorkingHours,
          totalOvertimeHours,
          attendancePercentage
        })
        .onConflictDoUpdate({
          target: [attendanceSummary.userId, attendanceSummary.month, attendanceSummary.year],
          set: {
            totalWorkingDays,
            presentDays,
            absentDays,
            lateDays,
            halfDays,
            leaveDays,
            totalWorkingHours,
            totalOvertimeHours,
            attendancePercentage,
            updatedAt: new Date()
          }
        });
    }

    res.json({
      message: `Monthly summaries generated successfully for ${allUsers.length} employees`,
      month: targetMonth,
      year: targetYear
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while generating summaries"
    });
  }
};

// Add latency to employee attendance
export const addLatency = async (req, res) => {
  try {
    const { employeeId, attendanceId, date, lateMinutes, reason } = req.body;

    if (!employeeId || !date || !lateMinutes) {
      return res.status(400).json({ message: 'Employee ID, date, and late minutes are required' });
    }

    // Find or create attendance record for the date
    let attendance;
    if (attendanceId) {
      [attendance] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, attendanceId)).limit(1);
    } else {
      [attendance] = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, employeeId),
          sql`DATE(${attendanceRecords.date}) = DATE(${date})`
        ))
        .limit(1);
    }

    if (!attendance) {
      // Create new attendance record if doesn't exist
      [attendance] = await db.insert(attendanceRecords)
        .values({
          userId: employeeId,
          date: new Date(date),
          status: 'late',
          isLate: true,
          lateMinutes: parseInt(lateMinutes),
          notes: reason || 'Late arrival added manually',
          isManualEntry: true
        })
        .returning();
    } else {
      // Update existing record
      [attendance] = await db.update(attendanceRecords)
        .set({
          isLate: true,
          lateMinutes: sql`${attendanceRecords.lateMinutes} + ${parseInt(lateMinutes)}`,
          status: 'late',
          notes: reason ? sql`COALESCE(${attendanceRecords.notes}, '') || '\n' || ${reason}` : attendanceRecords.notes,
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, attendance.id))
        .returning();
    }

    res.json({
      message: 'Latency added successfully',
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error occurred while adding latency'
    });
  }
};

// Add early departure to employee attendance
export const addEarlyDeparture = async (req, res) => {
  try {
    const { employeeId, attendanceId, date, earlyMinutes, reason } = req.body;

    if (!employeeId || !date || !earlyMinutes) {
      return res.status(400).json({ message: 'Employee ID, date, and early minutes are required' });
    }

    // Find or create attendance record
    let attendance;
    if (attendanceId) {
      [attendance] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, attendanceId)).limit(1);
    } else {
      [attendance] = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, employeeId),
          sql`DATE(${attendanceRecords.date}) = DATE(${date})`
        ))
        .limit(1);
    }

    if (!attendance) {
      // Create new attendance record
      [attendance] = await db.insert(attendanceRecords)
        .values({
          userId: employeeId,
          date: new Date(date),
          status: 'present',
          isEarlyDeparture: true,
          earlyDepartureMinutes: parseInt(earlyMinutes),
          notes: reason || 'Early departure added manually',
          isManualEntry: true
        })
        .returning();
    } else {
      // Update existing record
      [attendance] = await db.update(attendanceRecords)
        .set({
          isEarlyDeparture: true,
          earlyDepartureMinutes: sql`${attendanceRecords.earlyDepartureMinutes} + ${parseInt(earlyMinutes)}`,
          notes: reason ? sql`COALESCE(${attendanceRecords.notes}, '') || '\n' || ${reason}` : attendanceRecords.notes,
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, attendance.id))
        .returning();
    }

    res.json({
      message: 'Early departure added successfully',
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error occurred while adding early departure'
    });
  }
};

// Add partial day leave (e.g., 12 PM - 1 PM)
export const addPartialLeave = async (req, res) => {
  try {
    const { employeeId, attendanceId, date, startTime, endTime, reason } = req.body;

    if (!employeeId || !date || !startTime || !endTime || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Calculate leave duration in minutes
    const start = new Date(startTime);
    const end = new Date(endTime);
    const leaveMinutes = Math.floor((end - start) / (1000 * 60));

    // Find or create attendance record
    let attendance;
    if (attendanceId) {
      [attendance] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, attendanceId)).limit(1);
    } else {
      [attendance] = await db.select().from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, employeeId),
          sql`DATE(${attendanceRecords.date}) = DATE(${date})`
        ))
        .limit(1);
    }

    const leaveNote = `Partial leave: ${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (${leaveMinutes} min). Reason: ${reason}`;

    if (!attendance) {
      // Create new attendance record
      [attendance] = await db.insert(attendanceRecords)
        .values({
          userId: employeeId,
          date: new Date(date),
          status: 'present',
          breakDuration: leaveMinutes,
          notes: leaveNote,
          isManualEntry: true
        })
        .returning();
    } else {
      // Update existing record
      [attendance] = await db.update(attendanceRecords)
        .set({
          breakDuration: sql`${attendanceRecords.breakDuration} + ${leaveMinutes}`,
          notes: sql`COALESCE(${attendanceRecords.notes}, '') || '\n' || ${leaveNote}`,
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, attendance.id))
        .returning();
    }

    res.json({
      message: 'Partial leave added successfully',
      attendance,
      leaveMinutes
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error occurred while adding partial leave'
    });
  }
};

// Check if employee has approved leave for a date
export const checkEmployeeLeave = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and date are required' });
    }

    // Import applications from schema
    const { applications } = await import('../../../db/schema.js');

    // Check if there's an approved leave application for this date
    const targetDate = new Date(date);
    const approvedLeaves = await db.select()
      .from(applications)
      .where(and(
        eq(applications.userId, parseInt(employeeId)),
        eq(applications.status, 'approved'),
        lte(applications.startDate, targetDate),
        gte(applications.endDate, targetDate)
      ));

    res.json({
      hasLeave: approvedLeaves.length > 0,
      leaveApplications: approvedLeaves
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error occurred while checking employee leave'
    });
  }
};

export default {
  getAllAttendance,
  getAllAttendanceSummaries,
  getAllCorrectionRequests,
  createManualAttendance,
  updateAttendance,
  deleteAttendance,
  generateMonthlySummaries,
  addLatency,
  addEarlyDeparture,
  addPartialLeave,
  checkEmployeeLeave
};
