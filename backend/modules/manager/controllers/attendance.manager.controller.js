import { eq, and, gte, lte, desc, sql, or } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  attendanceRecords, 
  attendanceCorrections, 
  attendanceSummary,
  users,
  daysWorking,
  notifications
} from '../../../db/schema.js';

/**
 * Manager Attendance Controller
 * Handles manager attendance operations: view team attendance, approve corrections, reports
 */

// Get team attendance records
export const getTeamAttendance = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const { startDate, endDate, month, year, userId } = req.query;

    // Get manager's department
    const manager = await db.select().from(users).where(eq(users.id, managerId)).limit(1);
    if (manager.length === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const departmentId = manager[0].departmentId;
    if (!departmentId) {
      return res.status(403).json({ message: "No department assigned" });
    }

    // Get team members
    const teamMembers = await db.select()
      .from(users)
      .where(and(
        eq(users.departmentId, departmentId),
        eq(users.active, true)
      ));

    const teamIds = teamMembers.map(u => u.id);

    // Build date filter
    let dateFilter;
    if (startDate && endDate) {
      dateFilter = and(
        sql`${attendanceRecords.userId} = ANY(${teamIds})`,
        gte(attendanceRecords.date, new Date(startDate)),
        lte(attendanceRecords.date, new Date(endDate))
      );
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      dateFilter = and(
        sql`${attendanceRecords.userId} = ANY(${teamIds})`,
        gte(attendanceRecords.date, start),
        lte(attendanceRecords.date, end)
      );
    } else {
      // Default to current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = and(
        sql`${attendanceRecords.userId} = ANY(${teamIds})`,
        gte(attendanceRecords.date, start),
        lte(attendanceRecords.date, end)
      );
    }

    // If specific user requested, filter by that user
    if (userId) {
      const userIdNum = parseInt(userId);
      if (!teamIds.includes(userIdNum)) {
        return res.status(403).json({ message: "User not in your department" });
      }
      dateFilter = and(dateFilter, eq(attendanceRecords.userId, userIdNum));
    }

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
      isEarlyDeparture: attendanceRecords.isEarlyDeparture,
      earlyDepartureMinutes: attendanceRecords.earlyDepartureMinutes,
      overtimeMinutes: attendanceRecords.overtimeMinutes,
      notes: attendanceRecords.notes,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        jobTitle: users.jobTitle
      }
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(dateFilter)
    .orderBy(desc(attendanceRecords.date), users.fullName);

    res.json({
      message: "Team attendance records retrieved successfully",
      attendance: records,
      count: records.length,
      teamSize: teamMembers.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving team attendance"
    });
  }
};

// Get team attendance summary
export const getTeamAttendanceSummary = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Get manager's department
    const manager = await db.select().from(users).where(eq(users.id, managerId)).limit(1);
    if (manager.length === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const departmentId = manager[0].departmentId;
    if (!departmentId) {
      return res.status(403).json({ message: "No department assigned" });
    }

    // Get team members
    const teamMembers = await db.select()
      .from(users)
      .where(and(
        eq(users.departmentId, departmentId),
        eq(users.active, true)
      ));

    const teamIds = teamMembers.map(u => u.id);

    // Get summaries for all team members
    const summaries = [];
    for (const member of teamMembers) {
      const summary = await db.select()
        .from(attendanceSummary)
        .where(and(
          eq(attendanceSummary.userId, member.id),
          eq(attendanceSummary.month, targetMonth),
          eq(attendanceSummary.year, targetYear)
        ))
        .limit(1);

      summaries.push({
        user: {
          id: member.id,
          fullName: member.fullName,
          employeeCode: member.employeeCode,
          jobTitle: member.jobTitle
        },
        summary: summary.length > 0 ? summary[0] : null
      });
    }

    // Calculate department statistics
    const stats = {
      totalEmployees: teamMembers.length,
      avgAttendancePercentage: 0,
      totalPresentDays: 0,
      totalAbsentDays: 0,
      totalLateDays: 0
    };

    summaries.forEach(s => {
      if (s.summary) {
        stats.totalPresentDays += s.summary.presentDays || 0;
        stats.totalAbsentDays += s.summary.absentDays || 0;
        stats.totalLateDays += s.summary.lateDays || 0;
        stats.avgAttendancePercentage += s.summary.attendancePercentage || 0;
      }
    });

    stats.avgAttendancePercentage = summaries.length > 0 
      ? Math.round(stats.avgAttendancePercentage / summaries.length) 
      : 0;

    res.json({
      message: "Team attendance summary retrieved successfully",
      month: targetMonth,
      year: targetYear,
      teamSummaries: summaries,
      departmentStats: stats
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving team attendance summary"
    });
  }
};

// Get pending correction requests
export const getPendingCorrections = async (req, res) => {
  try {
    const managerId = req.authData.id;

    // Get manager's department
    const manager = await db.select().from(users).where(eq(users.id, managerId)).limit(1);
    if (manager.length === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const departmentId = manager[0].departmentId;
    if (!departmentId) {
      return res.status(403).json({ message: "No department assigned" });
    }

    // Get team members
    const teamMembers = await db.select()
      .from(users)
      .where(eq(users.departmentId, departmentId));

    const teamIds = teamMembers.map(u => u.id);

    // Get pending corrections for team members
    const corrections = await db.select({
      id: attendanceCorrections.id,
      userId: attendanceCorrections.userId,
      attendanceId: attendanceCorrections.attendanceId,
      date: attendanceCorrections.date,
      requestType: attendanceCorrections.requestType,
      originalCheckIn: attendanceCorrections.originalCheckIn,
      originalCheckOut: attendanceCorrections.originalCheckOut,
      requestedCheckIn: attendanceCorrections.requestedCheckIn,
      requestedCheckOut: attendanceCorrections.requestedCheckOut,
      reason: attendanceCorrections.reason,
      status: attendanceCorrections.status,
      createdAt: attendanceCorrections.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        jobTitle: users.jobTitle
      }
    })
    .from(attendanceCorrections)
    .leftJoin(users, eq(attendanceCorrections.userId, users.id))
    .where(and(
      sql`${attendanceCorrections.userId} = ANY(${teamIds})`,
      eq(attendanceCorrections.status, 'pending')
    ))
    .orderBy(desc(attendanceCorrections.createdAt));

    res.json({
      message: "Pending correction requests retrieved successfully",
      corrections,
      count: corrections.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving corrections"
    });
  }
};

// Approve correction request
export const approveCorrection = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const correctionId = parseInt(req.params.id);
    const { reviewNotes } = req.body;

    // Get correction request
    const correction = await db.select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.id, correctionId))
      .limit(1);

    if (correction.length === 0) {
      return res.status(404).json({ message: "Correction request not found" });
    }

    // Verify employee is in manager's department
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, correction[0].userId))
      .limit(1);

    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);

    if (employee[0].departmentId !== manager[0].departmentId) {
      return res.status(403).json({ message: "Cannot approve correction for employee outside your department" });
    }

    // Update correction status
    await db.update(attendanceCorrections)
      .set({
        status: 'approved',
        reviewedBy: managerId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        updatedAt: new Date()
      })
      .where(eq(attendanceCorrections.id, correctionId));

    // Update or create attendance record
    if (correction[0].attendanceId) {
      // Update existing record
      await db.update(attendanceRecords)
        .set({
          checkIn: correction[0].requestedCheckIn || undefined,
          checkOut: correction[0].requestedCheckOut || undefined,
          isManualEntry: true,
          approvedBy: managerId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, correction[0].attendanceId));
    } else {
      // Create new attendance record
      await db.insert(attendanceRecords).values({
        userId: correction[0].userId,
        date: correction[0].date,
        checkIn: correction[0].requestedCheckIn,
        checkOut: correction[0].requestedCheckOut,
        status: 'present',
        isManualEntry: true,
        approvedBy: managerId,
        approvedAt: new Date()
      });
    }

    // Send notification to employee
    await db.insert(notifications).values({
      userId: correction[0].userId,
      title: 'Attendance Correction Approved',
      message: `Your attendance correction request for ${new Date(correction[0].date).toLocaleDateString()} has been approved`,
      type: 'success',
      relatedId: correctionId
    });

    res.json({
      message: "Correction request approved successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while approving correction"
    });
  }
};

// Reject correction request
export const rejectCorrection = async (req, res) => {
  try {
    const managerId = req.authData.id;
    const correctionId = parseInt(req.params.id);
    const { reviewNotes } = req.body;

    if (!reviewNotes) {
      return res.status(400).json({ message: "Review notes are required for rejection" });
    }

    // Get correction request
    const correction = await db.select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.id, correctionId))
      .limit(1);

    if (correction.length === 0) {
      return res.status(404).json({ message: "Correction request not found" });
    }

    // Verify employee is in manager's department
    const employee = await db.select()
      .from(users)
      .where(eq(users.id, correction[0].userId))
      .limit(1);

    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);

    if (employee[0].departmentId !== manager[0].departmentId) {
      return res.status(403).json({ message: "Cannot reject correction for employee outside your department" });
    }

    // Update correction status
    await db.update(attendanceCorrections)
      .set({
        status: 'rejected',
        reviewedBy: managerId,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date()
      })
      .where(eq(attendanceCorrections.id, correctionId));

    // Send notification to employee
    await db.insert(notifications).values({
      userId: correction[0].userId,
      title: 'Attendance Correction Rejected',
      message: `Your attendance correction request for ${new Date(correction[0].date).toLocaleDateString()} has been rejected. Reason: ${reviewNotes}`,
      type: 'error',
      relatedId: correctionId
    });

    res.json({
      message: "Correction request rejected"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while rejecting correction"
    });
  }
};

// Get today's team attendance
export const getTodayTeamAttendance = async (req, res) => {
  try {
    const managerId = req.authData.id;

    // Get manager's department
    const manager = await db.select().from(users).where(eq(users.id, managerId)).limit(1);
    if (manager.length === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const departmentId = manager[0].departmentId;
    if (!departmentId) {
      return res.status(403).json({ message: "No department assigned" });
    }

    // Get team members
    const teamMembers = await db.select()
      .from(users)
      .where(and(
        eq(users.departmentId, departmentId),
        eq(users.active, true)
      ));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const teamIds = teamMembers.map(u => u.id);

    const records = await db.select({
      id: attendanceRecords.id,
      userId: attendanceRecords.userId,
      checkIn: attendanceRecords.checkIn,
      checkOut: attendanceRecords.checkOut,
      status: attendanceRecords.status,
      isLate: attendanceRecords.isLate,
      lateMinutes: attendanceRecords.lateMinutes,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        jobTitle: users.jobTitle
      }
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(and(
      sql`${attendanceRecords.userId} = ANY(${teamIds})`,
      gte(attendanceRecords.date, today),
      lte(attendanceRecords.date, tomorrow)
    ));

    // Calculate statistics
    const stats = {
      totalTeamMembers: teamMembers.length,
      present: records.filter(r => r.checkIn).length,
      absent: teamMembers.length - records.filter(r => r.checkIn).length,
      late: records.filter(r => r.isLate).length,
      checkedOut: records.filter(r => r.checkOut).length
    };

    res.json({
      message: "Today's team attendance retrieved successfully",
      attendance: records,
      stats
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving today's attendance"
    });
  }
};

export default {
  getTeamAttendance,
  getTeamAttendanceSummary,
  getPendingCorrections,
  approveCorrection,
  rejectCorrection,
  getTodayTeamAttendance
};
