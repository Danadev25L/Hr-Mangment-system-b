import { eq, and, gte, lte, desc, sql, inArray, or } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  attendanceRecords, 
  attendanceCorrections, 
  attendanceSummary,
  users,
  departments,
  workShifts,
  employeeShifts,
  attendancePolicies,
  departmentPolicies,
  breakTypes,
  attendanceBreaks,
  geofenceLocations,
  deviceWhitelist,
  attendanceLocationLogs,
  biometricLogs,
  overtimeRequests,
  overtimeTracking,
  attendanceAlerts,
  leaveBalances,
  dailyAttendanceReports,
  departmentAttendanceReports,
  attendanceAuditLog
} from '../../../db/schema.js';
import { createNotification } from '../../../services/notification.service.js';

/**
 * ==================== EMPLOYEE SELECTION & VIEWING ====================
 */

// Get all employees with their current attendance status
export const getAllEmployeesWithAttendance = async (req, res) => {
  try {
    const { date, departmentId, search } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all active users
    let userFilters = [eq(users.active, true)];
    if (departmentId) {
      userFilters.push(eq(users.departmentId, parseInt(departmentId)));
    }

    const allUsers = await db.select({
      id: users.id,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      email: users.email,
      phone: users.phone,
      jobTitle: users.jobTitle,
      department: departments.departmentName,
      departmentId: users.departmentId,
      role: users.role
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(...userFilters))
    .orderBy(users.fullName);

    // Filter by search if provided
    let filteredUsers = allUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = allUsers.filter(u => 
        u.fullName?.toLowerCase().includes(searchLower) ||
        u.employeeCode?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
      );
    }

    // Get attendance for each user on the target date
    const userIds = filteredUsers.map(u => u.id);
    let attendanceData = await db.select()
      .from(attendanceRecords)
      .where(and(
        inArray(attendanceRecords.userId, userIds),
        gte(attendanceRecords.date, targetDate),
        lte(attendanceRecords.date, new Date(targetDate.getTime() + 24 * 60 * 60 * 1000))
      ));

    // Auto-mark as present for past dates (if date is before today and no record exists)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isPastDate = targetDate < now;

    if (isPastDate && userIds.length > 0) {
      // Find users without attendance records
      const usersWithoutAttendance = filteredUsers.filter(user => 
        !attendanceData.find(a => a.userId === user.id)
      );

      // Create default attendance records for users without records
      if (usersWithoutAttendance.length > 0) {
        const defaultCheckInTime = new Date(targetDate);
        defaultCheckInTime.setHours(8, 0, 0, 0); // Default 8:00 AM check-in
        
        const defaultCheckOutTime = new Date(targetDate);
        defaultCheckOutTime.setHours(17, 0, 0, 0); // Default 5:00 PM check-out

        const workingMinutes = 9 * 60; // 9 hours = 540 minutes

        const newRecords = [];
        for (const user of usersWithoutAttendance) {
          const [newRecord] = await db.insert(attendanceRecords)
            .values({
              userId: user.id,
              date: targetDate,
              checkIn: defaultCheckInTime,
              checkOut: defaultCheckOutTime,
              workingHours: workingMinutes,
              status: 'present',
              isLate: false,
              lateMinutes: 0,
              isEarlyDeparture: false,
              earlyDepartureMinutes: 0,
              overtimeMinutes: 0,
              breakDuration: 0,
              location: 'Auto-marked',
              notes: 'Automatically marked as present for past date',
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
          
          newRecords.push(newRecord);
        }

        // Add newly created records to attendanceData
        attendanceData = [...attendanceData, ...newRecords];
      }
    }

    // Get current shifts for users - Simplified to avoid SQL errors
    let shiftsData = [];
    try {
      const today = new Date().toISOString().split('T')[0];
      shiftsData = await db.select({
        userId: employeeShifts.userId,
        shiftName: workShifts.shiftName,
        shiftCode: workShifts.shiftCode,
        startTime: workShifts.startTime,
        endTime: workShifts.endTime
      })
      .from(employeeShifts)
      .leftJoin(workShifts, eq(employeeShifts.shiftId, workShifts.id))
      .where(and(
        inArray(employeeShifts.userId, userIds),
        eq(employeeShifts.isActive, true),
        lte(employeeShifts.effectiveFrom, today)
      ));
    } catch (shiftError) {
      // If shift tables don't exist or query fails, continue without shift data
      console.log('Shift data not available:', shiftError.message);
      shiftsData = [];
    }

    // Combine data
    const employeesWithAttendance = filteredUsers.map(user => {
      const attendance = attendanceData.find(a => a.userId === user.id);
      const shift = shiftsData.find(s => s.userId === user.id);

      return {
        ...user,
        currentShift: shift || null,
        attendance: attendance ? {
          id: attendance.id,
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workingHours: attendance.workingHours,
          status: attendance.status,
          isLate: attendance.isLate,
          lateMinutes: attendance.lateMinutes,
          isEarlyDeparture: attendance.isEarlyDeparture,
          earlyDepartureMinutes: attendance.earlyDepartureMinutes,
          overtimeMinutes: attendance.overtimeMinutes,
          breakDuration: attendance.breakDuration,
          location: attendance.location,
          notes: attendance.notes
        } : null
      };
    });

    res.json({
      message: "Employees with attendance retrieved successfully",
      date: targetDate,
      employees: employeesWithAttendance,
      count: employeesWithAttendance.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving employees"
    });
  }
};

// Get detailed attendance history for a specific employee
export const getEmployeeAttendanceDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, month, year } = req.query;

    // Get employee info
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(employeeId)));

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Build date filters
    let filters = [eq(attendanceRecords.userId, parseInt(employeeId))];
    
    if (startDate && endDate) {
      filters.push(gte(attendanceRecords.date, new Date(startDate)));
      filters.push(lte(attendanceRecords.date, new Date(endDate)));
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filters.push(gte(attendanceRecords.date, start));
      filters.push(lte(attendanceRecords.date, end));
    }

    // Get attendance records
    const records = await db.select()
      .from(attendanceRecords)
      .where(and(...filters))
      .orderBy(desc(attendanceRecords.date));

    // Get break details for these records
    const recordIds = records.map(r => r.id);
    const breaks = recordIds.length > 0 ? await db.select({
      attendanceId: attendanceBreaks.attendanceId,
      breakStart: attendanceBreaks.breakStart,
      breakEnd: attendanceBreaks.breakEnd,
      durationMinutes: attendanceBreaks.durationMinutes,
      breakTypeName: breakTypes.breakName,
      breakReason: attendanceBreaks.breakReason
    })
    .from(attendanceBreaks)
    .leftJoin(breakTypes, eq(attendanceBreaks.breakTypeId, breakTypes.id))
    .where(inArray(attendanceBreaks.attendanceId, recordIds)) : [];

    // Get overtime records
    const overtime = recordIds.length > 0 ? await db.select()
      .from(overtimeTracking)
      .where(inArray(overtimeTracking.attendanceId, recordIds)) : [];

    // Combine data
    const detailedRecords = records.map(record => ({
      ...record,
      breaks: breaks.filter(b => b.attendanceId === record.id),
      overtime: overtime.find(o => o.attendanceId === record.id) || null
    }));

    // Get monthly summary
    let summary = null;
    if (month && year) {
      const [monthlySummary] = await db.select()
        .from(attendanceSummary)
        .where(and(
          eq(attendanceSummary.userId, parseInt(employeeId)),
          eq(attendanceSummary.month, parseInt(month)),
          eq(attendanceSummary.year, parseInt(year))
        ));
      
      // If no summary exists in the table, calculate it from attendance records
      if (monthlySummary) {
        summary = monthlySummary;
      } else if (records.length > 0) {
        // Calculate summary from attendance records
        const absentDays = records.filter(r => r.status === 'absent').length;
        const lateDays = records.filter(r => r.lateMinutes && r.lateMinutes > 0).length;
        const leaveDays = records.filter(r => r.status === 'on-leave' || r.status === 'permission').length;
        const presentDays = records.filter(r => r.status === 'present').length;
        
        // Calculate total working hours (convert from hours to minutes if needed)
        const totalWorkingHours = records.reduce((sum, r) => {
          if (r.hoursWorked) {
            // If hoursWorked is a number, add it directly
            return sum + (typeof r.hoursWorked === 'number' ? r.hoursWorked : parseFloat(r.hoursWorked) || 0);
          }
          return sum;
        }, 0);
        
        const totalWorkingDays = records.length;
        const attendancePercentage = totalWorkingDays > 0 
          ? ((presentDays / totalWorkingDays) * 100).toFixed(2) 
          : 0;
        
        summary = {
          userId: parseInt(employeeId),
          month: parseInt(month),
          year: parseInt(year),
          totalWorkingDays,
          presentDays,
          absentDays,
          lateDays,
          leaveDays,
          totalWorkingHours: Math.round(totalWorkingHours * 60), // Convert to minutes
          attendancePercentage: parseFloat(attendancePercentage)
        };
      }
    }

    res.json({
      message: "Employee attendance details retrieved successfully",
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        department: employee.department
      },
      attendance: detailedRecords,
      summary,
      count: detailedRecords.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while retrieving attendance details"
    });
  }
};

/**
 * ==================== ATTENDANCE MARKING & MANAGEMENT ====================
 */

// Mark attendance for employee (check-in)
export const markEmployeeCheckIn = async (req, res) => {
  try {
    const { employeeId, checkInTime, expectedCheckInTime, location, latitude, longitude, notes } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const userId = parseInt(employeeId);
    const checkIn = checkInTime ? new Date(checkInTime) : new Date();
    const today = new Date(checkIn);
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const [existing] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, today),
        lte(attendanceRecords.date, new Date(today.getTime() + 24 * 60 * 60 * 1000))
      ));

    if (existing && existing.checkIn) {
      return res.status(400).json({ 
        message: "Employee has already checked in today",
        existingRecord: existing
      });
    }

    // Calculate if late - PRIORITY: use expectedCheckInTime from frontend, fallback to shift time
    let isLate = false;
    let lateMinutes = 0;
    let expectedTime = null;
    
    // First, try to use the expected check-in time from the frontend (default check-in time)
    if (expectedCheckInTime) {
      expectedTime = new Date(expectedCheckInTime);
      const diffMs = checkIn - expectedTime;
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes > 0) { // Late if check-in is after expected time
        isLate = true;
        lateMinutes = diffMinutes;
      }
    } else {
      // Fallback: Get employee's shift
      const todayStr = today.toISOString().split('T')[0];
      const [shiftAssignment] = await db.select({
        shiftId: employeeShifts.shiftId,
        startTime: workShifts.startTime,
        endTime: workShifts.endTime,
        gracePeriodMinutes: workShifts.gracePeriodMinutes
      })
      .from(employeeShifts)
      .leftJoin(workShifts, eq(employeeShifts.shiftId, workShifts.id))
      .where(and(
        eq(employeeShifts.userId, userId),
        eq(employeeShifts.isActive, true),
        lte(employeeShifts.effectiveFrom, todayStr)
      ))
      .limit(1);
      
      if (shiftAssignment && shiftAssignment.startTime) {
        const [hours, minutes] = shiftAssignment.startTime.split(':');
        const shiftStart = new Date(checkIn);
        shiftStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const gracePeriod = shiftAssignment.gracePeriodMinutes || 15;
        const graceTime = new Date(shiftStart.getTime() + gracePeriod * 60000);
        
        if (checkIn > graceTime) {
          isLate = true;
          lateMinutes = Math.floor((checkIn - shiftStart) / 60000);
        }
      }
    }

    const attendanceData = {
      userId,
      date: today,
      checkIn,
      status: isLate ? 'late' : 'present',
      isLate,
      lateMinutes,
      location: location || null,
      notes: notes || null,
      isManualEntry: true,
      approvedBy: req.authData.id,
      approvedAt: new Date()
    };

    // Save location log if provided
    let locationLog = null;
    if (latitude && longitude) {
      // Check geofence
      const geofences = await db.select()
        .from(geofenceLocations)
        .where(eq(geofenceLocations.isActive, true));

      let isWithinGeofence = false;
      let geofenceId = null;

      for (const fence of geofences) {
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude),
          parseFloat(fence.latitude),
          parseFloat(fence.longitude)
        );
        
        if (distance <= fence.radiusMeters) {
          isWithinGeofence = true;
          geofenceId = fence.id;
          break;
        }
      }

      if (!isWithinGeofence) {
        attendanceData.notes = (attendanceData.notes || '') + ' [Outside geofence]';
      }
    }

    const [record] = existing 
      ? await db.update(attendanceRecords)
          .set(attendanceData)
          .where(eq(attendanceRecords.id, existing.id))
          .returning()
      : await db.insert(attendanceRecords)
          .values(attendanceData)
          .returning();

    // Log location if provided
    if (latitude && longitude && record) {
      const geofences = await db.select()
        .from(geofenceLocations)
        .where(eq(geofenceLocations.isActive, true));

      let isWithinGeofence = false;
      let geofenceId = null;

      for (const fence of geofences) {
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude),
          parseFloat(fence.latitude),
          parseFloat(fence.longitude)
        );
        
        if (distance <= fence.radiusMeters) {
          isWithinGeofence = true;
          geofenceId = fence.id;
          break;
        }
      }

      await db.insert(attendanceLocationLogs).values({
        attendanceId: record.id,
        logType: 'checkin',
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        geofenceId,
        isWithinGeofence,
        ipAddress: req.ip || null,
        timestamp: checkIn
      });
    }

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId,
      actionType: existing ? 'update' : 'create',
      actionBy: req.authData.id,
      newValues: attendanceData,
      reason: 'Admin marked check-in',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Create alert if late
    if (isLate) {
      await db.insert(attendanceAlerts).values({
        userId,
        alertType: 'late_arrival',
        alertDate: today,
        severity: lateMinutes > 30 ? 'high' : 'medium',
        message: `Employee checked in ${lateMinutes} minutes late`
      });
    }

    res.json({
      message: `Check-in recorded successfully${isLate ? ' (Late arrival)' : ''}`,
      attendance: record,
      isLate,
      lateMinutes
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      message: error.message || "Error occurred while marking check-in"
    });
  }
};

// Mark checkout for employee
export const markEmployeeCheckOut = async (req, res) => {
  try {
    const { employeeId, checkOutTime, expectedCheckOutTime, location, latitude, longitude, notes } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const userId = parseInt(employeeId);
    const checkOut = checkOutTime ? new Date(checkOutTime) : new Date();
    const today = new Date(checkOut);
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const [record] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, today),
        lte(attendanceRecords.date, new Date(today.getTime() + 24 * 60 * 60 * 1000))
      ));

    if (!record) {
      return res.status(404).json({ 
        message: "No check-in record found for today. Please check-in first."
      });
    }

    if (record.checkOut) {
      return res.status(400).json({ 
        message: "Employee has already checked out today"
      });
    }

    // Calculate working hours
    const checkInTime = new Date(record.checkIn);
    const workingMinutes = Math.floor((checkOut - checkInTime) / 60000);
    
    // Calculate early departure and overtime - PRIORITY: use expectedCheckOutTime from frontend
    let isEarlyDeparture = false;
    let earlyDepartureMinutes = 0;
    let overtimeMinutes = 0;
    
    if (expectedCheckOutTime) {
      // Use the expected check-out time from frontend (default check-out time)
      const expectedTime = new Date(expectedCheckOutTime);
      const diffMs = expectedTime - checkOut;
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes > 0) { // Early if check-out is before expected time
        isEarlyDeparture = true;
        earlyDepartureMinutes = diffMinutes;
      } else if (diffMinutes < 0) { // Overtime if check-out is after expected time
        overtimeMinutes = Math.abs(diffMinutes);
      }
    } else {
      // Fallback: Get employee's shift for overtime calculation
      const todayStr = today.toISOString().split('T')[0];
      let shiftAssignment = null;
      try {
        const [assignment] = await db.select({
          endTime: workShifts.endTime,
          earlyDepartureThreshold: workShifts.earlyDepartureThreshold,
          minimumWorkHours: workShifts.minimumWorkHours
        })
        .from(employeeShifts)
        .leftJoin(workShifts, eq(employeeShifts.shiftId, workShifts.id))
        .where(and(
          eq(employeeShifts.userId, userId),
          eq(employeeShifts.isActive, true),
          lte(employeeShifts.effectiveFrom, todayStr)
        ))
        .limit(1);
        
        shiftAssignment = assignment;
      } catch (shiftError) {
        console.log('Could not fetch shift data for check-out:', shiftError.message);
        shiftAssignment = null;
      }
      
      if (shiftAssignment && shiftAssignment.endTime) {
        const [hours, minutes] = shiftAssignment.endTime.split(':');
        const shiftEnd = new Date(checkOut);
        shiftEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const threshold = shiftAssignment.earlyDepartureThreshold || 15;
        const earlyThreshold = new Date(shiftEnd.getTime() - threshold * 60000);
        
        if (checkOut < earlyThreshold) {
          isEarlyDeparture = true;
          earlyDepartureMinutes = Math.floor((shiftEnd - checkOut) / 60000);
        } else if (checkOut > shiftEnd) {
          const overtimeThreshold = shiftAssignment.overtimeStartAfterMinutes || 30;
          const minutesAfterShift = Math.floor((checkOut - shiftEnd) / 60000);
          
          if (minutesAfterShift > overtimeThreshold) {
            overtimeMinutes = minutesAfterShift;
          }
        }
      }
    }

    // Determine status
    let status = 'present';
    if (record.isLate) status = 'late';
    if (isEarlyDeparture) status = 'early_departure';

    const updateData = {
      checkOut,
      workingHours: workingMinutes,
      status,
      isEarlyDeparture,
      earlyDepartureMinutes,
      overtimeMinutes,
      location: location || record.location,
      notes: notes ? (record.notes ? record.notes + '; ' + notes : notes) : record.notes,
      updatedAt: new Date()
    };

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Log location if provided
    if (latitude && longitude) {
      const geofences = await db.select()
        .from(geofenceLocations)
        .where(eq(geofenceLocations.isActive, true));

      let isWithinGeofence = false;
      let geofenceId = null;

      for (const fence of geofences) {
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude),
          parseFloat(fence.latitude),
          parseFloat(fence.longitude)
        );
        
        if (distance <= fence.radiusMeters) {
          isWithinGeofence = true;
          geofenceId = fence.id;
          break;
        }
      }

      await db.insert(attendanceLocationLogs).values({
        attendanceId: record.id,
        logType: 'checkout',
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        geofenceId,
        isWithinGeofence,
        ipAddress: req.ip || null,
        timestamp: checkOut
      });
    }

    // Create overtime tracking if applicable
    if (overtimeMinutes > 0) {
      await db.insert(overtimeTracking).values({
        userId,
        attendanceId: record.id,
        date: today,
        overtimeMinutes,
        overtimeRate: '1.5',
        isApproved: false
      });
    }

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues: record,
      newValues: updateData,
      reason: 'Admin marked check-out',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Create alerts
    if (isEarlyDeparture) {
      await db.insert(attendanceAlerts).values({
        userId,
        alertType: 'early_departure',
        alertDate: today,
        severity: earlyDepartureMinutes > 30 ? 'high' : 'medium',
        message: `Employee checked out ${earlyDepartureMinutes} minutes early`
      });
    }

    res.json({
      message: `Check-out recorded successfully`,
      attendance: updated,
      workingHours: Math.floor(workingMinutes / 60) + 'h ' + (workingMinutes % 60) + 'm',
      overtimeMinutes,
      isEarlyDeparture,
      earlyDepartureMinutes
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      message: error.message || "Error occurred while marking check-out"
    });
  }
};

// Mark employee as absent
export const markEmployeeAbsent = async (req, res) => {
  try {
    const { employeeId, date, reason } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ message: "Employee ID and date are required" });
    }

    const userId = parseInt(employeeId);
    const absentDate = new Date(date);
    absentDate.setHours(0, 0, 0, 0);

    // Check if record exists
    const [existing] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, absentDate),
        lte(attendanceRecords.date, new Date(absentDate.getTime() + 24 * 60 * 60 * 1000))
      ));

    const attendanceData = {
      userId,
      date: absentDate,
      status: 'absent',
      workingHours: 0,
      notes: reason || 'Marked absent by admin',
      isManualEntry: true,
      approvedBy: req.authData.id,
      approvedAt: new Date()
    };

    const [record] = existing
      ? await db.update(attendanceRecords)
          .set(attendanceData)
          .where(eq(attendanceRecords.id, existing.id))
          .returning()
      : await db.insert(attendanceRecords)
          .values(attendanceData)
          .returning();

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId,
      actionType: existing ? 'update' : 'create',
      actionBy: req.authData.id,
      newValues: attendanceData,
      reason: 'Admin marked as absent',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Check for continuous absent days
    const last7Days = new Date(absentDate);
    last7Days.setDate(last7Days.getDate() - 7);

    const recentAbsences = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.status, 'absent'),
        gte(attendanceRecords.date, last7Days),
        lte(attendanceRecords.date, absentDate)
      ))
      .orderBy(desc(attendanceRecords.date));

    if (recentAbsences.length >= 3) {
      await db.insert(attendanceAlerts).values({
        userId,
        alertType: 'continuous_absent',
        alertDate: absentDate,
        severity: 'high',
        message: `Employee has been absent for ${recentAbsences.length} days in the last week`
      });
    }

    res.json({
      message: "Employee marked as absent successfully",
      attendance: record
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred while marking absent"
    });
  }
};

/**
 * ==================== BULK OPERATIONS ====================
 */

// Bulk mark attendance for multiple employees
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { employees, date, status, notes } = req.body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ message: "Employees array is required" });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    for (const empId of employees) {
      try {
        const attendanceData = {
          userId: parseInt(empId),
          date: targetDate,
          status: status || 'present',
          workingHours: status === 'absent' ? 0 : null,
          notes: notes || null,
          isManualEntry: true,
          approvedBy: req.authData.id,
          approvedAt: new Date()
        };

        // Check if exists
        const [existing] = await db.select()
          .from(attendanceRecords)
          .where(and(
            eq(attendanceRecords.userId, parseInt(empId)),
            gte(attendanceRecords.date, targetDate),
            lte(attendanceRecords.date, new Date(targetDate.getTime() + 24 * 60 * 60 * 1000))
          ));

        const [record] = existing
          ? await db.update(attendanceRecords)
              .set(attendanceData)
              .where(eq(attendanceRecords.id, existing.id))
              .returning()
          : await db.insert(attendanceRecords)
              .values(attendanceData)
              .returning();

        results.push({ employeeId: empId, success: true, record });

        // Create audit log
        await db.insert(attendanceAuditLog).values({
          attendanceId: record.id,
          userId: parseInt(empId),
          actionType: existing ? 'update' : 'create',
          actionBy: req.authData.id,
          newValues: attendanceData,
          reason: 'Bulk attendance marking',
          ipAddress: req.ip || null
        });

      } catch (error) {
        errors.push({ employeeId: empId, error: error.message });
      }
    }

    res.json({
      message: `Bulk attendance marked: ${results.length} successful, ${errors.length} failed`,
      successful: results,
      failed: errors,
      totalProcessed: employees.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error occurred during bulk operation"
    });
  }
};

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export default {
  getAllEmployeesWithAttendance,
  getEmployeeAttendanceDetails,
  markEmployeeCheckIn,
  markEmployeeCheckOut,
  markEmployeeAbsent,
  bulkMarkAttendance
};
