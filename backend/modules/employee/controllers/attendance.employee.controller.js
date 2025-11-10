import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  attendanceRecords, 
  attendanceCorrections, 
  attendanceSummary,
  users, 
  daysWorking,
  applications,
  daysHoliday
} from '../../../db/schema.js';
import { notifications } from '../../../db/schema.js';

/**
 * Employee Attendance Controller
 * VIEW-ONLY: Employees can only view their attendance records
 * All attendance actions (check-in, check-out, edit) are handled by admins only
 */

// Get my attendance records
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.authData.id;
    const { startDate, endDate, month, year } = req.query;

    let dateFilter;
    if (startDate && endDate) {
      dateFilter = and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, new Date(startDate)),
        lte(attendanceRecords.date, new Date(endDate))
      );
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      dateFilter = and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, start),
        lte(attendanceRecords.date, end)
      );
    } else {
      // Default to current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, start),
        lte(attendanceRecords.date, end)
      );
    }

    const records = await db.select()
      .from(attendanceRecords)
      .where(dateFilter)
      .orderBy(desc(attendanceRecords.date));

    res.json({
      message: "Attendance records retrieved successfully",
      attendance: records,
      count: records.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving attendance"
    });
  }
};

// Get today's attendance
export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.authData.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, today),
        lte(attendanceRecords.date, tomorrow)
      ))
      .limit(1);

    if (attendance.length === 0) {
      return res.json({
        message: "No attendance record for today",
        attendance: null,
        hasCheckedIn: false,
        hasCheckedOut: false
      });
    }

    res.json({
      message: "Today's attendance retrieved successfully",
      attendance: attendance[0],
      hasCheckedIn: !!attendance[0].checkIn,
      hasCheckedOut: !!attendance[0].checkOut
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving today's attendance"
    });
  }
};

// Get my attendance summary
export const getMyAttendanceSummary = async (req, res) => {
  try {
    const userId = req.authData.id;
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const summary = await db.select()
      .from(attendanceSummary)
      .where(and(
        eq(attendanceSummary.userId, userId),
        eq(attendanceSummary.month, targetMonth),
        eq(attendanceSummary.year, targetYear)
      ))
      .limit(1);

    if (summary.length === 0) {
      // Generate summary if not exists
      const start = new Date(targetYear, targetMonth - 1, 1);
      const end = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const records = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, start),
          lte(attendanceRecords.date, end)
        ));

      const presentDays = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentDays = records.filter(r => r.status === 'absent').length;
      const lateDays = records.filter(r => r.isLate).length;
      const leaveDays = records.filter(r => r.status === 'on_leave').length;
      const totalWorkingHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);

      return res.json({
        message: "Attendance summary generated",
        summary: {
          month: targetMonth,
          year: targetYear,
          presentDays,
          absentDays,
          lateDays,
          leaveDays,
          totalWorkingHours: Math.floor(totalWorkingHours / 60), // Convert to hours
          totalWorkingMinutes: totalWorkingHours,
          attendancePercentage: presentDays > 0 ? Math.round((presentDays / (presentDays + absentDays)) * 100) : 0
        }
      });
    }

    res.json({
      message: "Attendance summary retrieved successfully",
      summary: summary[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving attendance summary"
    });
  }
};

// Request attendance correction
export const requestCorrection = async (req, res) => {
  try {
    const userId = req.authData.id;
    const { 
      date, 
      requestType, 
      requestedCheckIn, 
      requestedCheckOut, 
      reason 
    } = req.body;

    if (!date || !requestType || !reason) {
      return res.status(400).json({
        message: "Date, request type, and reason are required"
      });
    }

    // Find existing attendance record for that date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendance = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, targetDate),
        lte(attendanceRecords.date, nextDay)
      ))
      .limit(1);

    const correctionData = {
      userId,
      attendanceId: attendance.length > 0 ? attendance[0].id : null,
      date: new Date(date),
      requestType,
      originalCheckIn: attendance.length > 0 ? attendance[0].checkIn : null,
      originalCheckOut: attendance.length > 0 ? attendance[0].checkOut : null,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : null,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : null,
      reason,
      status: 'pending'
    };

    const [correction] = await db.insert(attendanceCorrections)
      .values(correctionData)
      .returning();

    // Get user's manager to send notification
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length > 0 && user[0].departmentId) {
      const managers = await db.select()
        .from(users)
        .where(and(
          eq(users.departmentId, user[0].departmentId),
          eq(users.role, 'ROLE_MANAGER')
        ));

      for (const manager of managers) {
        await db.insert(notifications).values({
          userId: manager.id,
          title: 'Attendance Correction Request',
          message: `${user[0].fullName} has requested an attendance correction for ${new Date(date).toLocaleDateString()}`,
          type: 'warning',
          relatedId: correction.id
        });
      }
    }

    res.json({
      message: "Correction request submitted successfully",
      correction
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while submitting correction request"
    });
  }
};

// Get my correction requests
export const getMyCorrectionRequests = async (req, res) => {
  try {
    const userId = req.authData.id;

    const corrections = await db.select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.userId, userId))
      .orderBy(desc(attendanceCorrections.createdAt));

    res.json({
      message: "Correction requests retrieved successfully",
      corrections,
      count: corrections.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving correction requests"
    });
  }
};

export default {
  getMyAttendance,
  getTodayAttendance,
  getMyAttendanceSummary,
  requestCorrection,
  getMyCorrectionRequests
};
