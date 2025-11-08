import { eq, and, gte, lte, desc, sql, inArray, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { 
  attendanceRecords,
  attendanceCorrections,
  attendanceSummary,
  attendanceBreaks,
  attendanceLocationLogs,
  workShifts,
  employeeShifts,
  users,
  departments,
  applications
} from '../db/schema.js';

/**
 * Attendance Service
 * Centralized business logic for attendance operations
 * Consolidates logic from multiple attendance controllers
 */

// ==================== QUERY FUNCTIONS ====================

/**
 * Get attendance records with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>}
 */
export const getAttendanceRecords = async (filters = {}) => {
  const { startDate, endDate, month, year, userId, departmentId, status, limit, offset } = filters;

  let conditions = [];

  // Date filters
  if (startDate && endDate) {
    conditions.push(gte(attendanceRecords.date, new Date(startDate)));
    conditions.push(lte(attendanceRecords.date, new Date(endDate)));
  } else if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    conditions.push(gte(attendanceRecords.date, start));
    conditions.push(lte(attendanceRecords.date, end));
  }

  if (userId) conditions.push(eq(attendanceRecords.userId, parseInt(userId)));
  if (status) conditions.push(eq(attendanceRecords.status, status));

  let query = db.select({
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
    location: attendanceRecords.location,
    user: {
      id: users.id,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      departmentId: users.departmentId,
      department: users.department
    }
  })
  .from(attendanceRecords)
  .leftJoin(users, eq(attendanceRecords.userId, users.id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(attendanceRecords.date));

  if (limit) query = query.limit(limit);
  if (offset) query = query.offset(offset);

  const records = await query;

  // Filter by department if specified
  if (departmentId) {
    return records.filter(r => r.user.departmentId === parseInt(departmentId));
  }

  return records;
};

/**
 * Get attendance summaries
 * @param {Object} filters - Filter options  
 * @returns {Promise<Array>}
 */
export const getAttendanceSummaries = async (filters = {}) => {
  const { month, year, departmentId, userId } = filters;

  const now = new Date();
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year) : now.getFullYear();

  let conditions = [
    eq(attendanceSummary.month, targetMonth),
    eq(attendanceSummary.year, targetYear)
  ];

  if (userId) conditions.push(eq(attendanceSummary.userId, parseInt(userId)));

  const summaries = await db.select({
    id: attendanceSummary.id,
    userId: attendanceSummary.userId,
    month: attendanceSummary.month,
    year: attendanceSummary.year,
    totalWorkingDays: attendanceSummary.totalWorkingDays,
    presentDays: attendanceSummary.presentDays,
    absentDays: attendanceSummary.absentDays,
    lateDays: attendanceSummary.lateDays,
    totalWorkingHours: attendanceSummary.totalWorkingHours,
    overtimeHours: attendanceSummary.overtimeHours,
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
  .where(and(...conditions));

  // Filter by department if specified
  if (departmentId) {
    return summaries.filter(s => s.user.departmentId === parseInt(departmentId));
  }

  return summaries;
};

/**
 * Get correction requests
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>}
 */
export const getCorrectionRequests = async (filters = {}) => {
  const { status, userId, departmentId } = filters;

  let conditions = [];
  if (status) conditions.push(eq(attendanceCorrections.status, status));
  if (userId) conditions.push(eq(attendanceCorrections.userId, parseInt(userId)));

  const corrections = await db.select({
    id: attendanceCorrections.id,
    userId: attendanceCorrections.userId,
    attendanceId: attendanceCorrections.attendanceId,
    requestDate: attendanceCorrections.requestDate,
    correctionType: attendanceCorrections.correctionType,
    originalValue: attendanceCorrections.originalValue,
    requestedValue: attendanceCorrections.requestedValue,
    reason: attendanceCorrections.reason,
    status: attendanceCorrections.status,
    reviewedBy: attendanceCorrections.reviewedBy,
    reviewNotes: attendanceCorrections.reviewNotes,
    createdAt: attendanceCorrections.createdAt,
    user: {
      id: users.id,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      departmentId: users.departmentId,
      department: users.department
    }
  })
  .from(attendanceCorrections)
  .leftJoin(users, eq(attendanceCorrections.userId, users.id))
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(desc(attendanceCorrections.createdAt));

  // Filter by department if specified
  if (departmentId) {
    return corrections.filter(c => c.user.departmentId === parseInt(departmentId));
  }

  return corrections;
};

/**
 * Get employee attendance details with breaks and shifts
 * @param {number} employeeId - Employee ID
 * @param {Object} filters - Date filters
 * @returns {Promise<Object>}
 */
export const getEmployeeAttendanceDetails = async (employeeId, filters = {}) => {
  const { startDate, endDate, month, year } = filters;

  // Build date conditions
  let conditions = [eq(attendanceRecords.userId, employeeId)];
  
  if (startDate && endDate) {
    conditions.push(gte(attendanceRecords.date, new Date(startDate)));
    conditions.push(lte(attendanceRecords.date, new Date(endDate)));
  } else if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    conditions.push(gte(attendanceRecords.date, start));
    conditions.push(lte(attendanceRecords.date, end));
  }

  // Get attendance records
  const records = await db.select()
    .from(attendanceRecords)
    .where(and(...conditions))
    .orderBy(desc(attendanceRecords.date));

  // Get breaks for these records
  const recordIds = records.map(r => r.id);
  const breaks = recordIds.length > 0 ? await db.select()
    .from(attendanceBreaks)
    .where(inArray(attendanceBreaks.attendanceId, recordIds)) : [];

  // Get employee shifts
  const shifts = await db.select()
    .from(employeeShifts)
    .leftJoin(workShifts, eq(employeeShifts.shiftId, workShifts.id))
    .where(eq(employeeShifts.userId, employeeId));

  // Combine data
  const detailedRecords = records.map(record => ({
    ...record,
    breaks: breaks.filter(b => b.attendanceId === record.id)
  }));

  return {
    employee: { id: employeeId },
    records: detailedRecords,
    shifts: shifts,
    summary: {
      totalRecords: records.length,
      presentDays: records.filter(r => r.status === 'present').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      lateDays: records.filter(r => r.isLate).length,
      totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0)
    }
  };
};

// ==================== MUTATION FUNCTIONS ====================

/**
 * Create manual attendance record
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<Object>}
 */
export const createAttendanceRecord = async (attendanceData) => {
  const result = await db.insert(attendanceRecords)
    .values(attendanceData)
    .returning();
  
  return result[0];
};

/**
 * Update attendance record
 * @param {number} attendanceId - Attendance ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>}
 */
export const updateAttendanceRecord = async (attendanceId, updateData) => {
  const result = await db.update(attendanceRecords)
    .set(updateData)
    .where(eq(attendanceRecords.id, attendanceId))
    .returning();
  
  return result[0];
};

/**
 * Delete attendance record
 * @param {number} attendanceId - Attendance ID
 * @returns {Promise<boolean>}
 */
export const deleteAttendanceRecord = async (attendanceId) => {
  await db.delete(attendanceRecords)
    .where(eq(attendanceRecords.id, attendanceId));
  
  return true;
};

/**
 * Request attendance correction
 * @param {Object} correctionData - Correction request data
 * @returns {Promise<Object>}
 */
export const requestCorrection = async (correctionData) => {
  const result = await db.insert(attendanceCorrections)
    .values({
      ...correctionData,
      status: 'pending',
      createdAt: new Date()
    })
    .returning();
  
  return result[0];
};

/**
 * Approve or reject correction request
 * @param {number} correctionId - Correction ID
 * @param {string} action - 'approve' or 'reject'
 * @param {Object} reviewData - Review data (reviewedBy, reviewNotes)
 * @returns {Promise<Object>}
 */
export const reviewCorrection = async (correctionId, action, reviewData) => {
  const result = await db.update(attendanceCorrections)
    .set({
      status: action === 'approve' ? 'approved' : 'rejected',
      ...reviewData,
      reviewedAt: new Date()
    })
    .where(eq(attendanceCorrections.id, correctionId))
    .returning();
  
  return result[0];
};

/**
 * Check if employee is on leave for a date
 * @param {number} userId - User ID
 * @param {Date} date - Date to check
 * @returns {Promise<Object>}
 */
export const checkEmployeeLeave = async (userId, date) => {
  const leaveApplications = await db.select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        eq(applications.status, 'approved'),
        lte(applications.startDate, date),
        gte(applications.endDate, date)
      )
    );

  return {
    isOnLeave: leaveApplications.length > 0,
    leaveDetails: leaveApplications.length > 0 ? leaveApplications[0] : null
  };
};

/**
 * Generate monthly summaries for all employees
 * @param {number} month - Month
 * @param {number} year - Year
 * @returns {Promise<Array>}
 */
export const generateMonthlySummaries = async (month, year) => {
  // Get all active employees
  const employees = await db.select({ id: users.id })
    .from(users)
    .where(inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER']));

  const summaries = [];

  for (const employee of employees) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await db.select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, employee.id),
          gte(attendanceRecords.date, startDate),
          lte(attendanceRecords.date, endDate)
        )
      );

    const totalWorkingDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.isLate).length;
    const totalWorkingHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const overtimeHours = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0) / 60;

    const [summary] = await db.insert(attendanceSummary)
      .values({
        userId: employee.id,
        month,
        year,
        totalWorkingDays,
        presentDays,
        absentDays,
        lateDays,
        totalWorkingHours,
        overtimeHours,
        createdAt: new Date()
      })
      .onConflictDoUpdate({
        target: [attendanceSummary.userId, attendanceSummary.month, attendanceSummary.year],
        set: {
          totalWorkingDays,
          presentDays,
          absentDays,
          lateDays,
          totalWorkingHours,
          overtimeHours,
          updatedAt: new Date()
        }
      })
      .returning();

    summaries.push(summary);
  }

  return summaries;
};
