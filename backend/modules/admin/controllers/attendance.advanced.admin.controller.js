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
  daysHoliday,
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

    // Check if the selected date is a holiday
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const holidayCheck = await db.select()
      .from(daysHoliday)
      .where(and(
        gte(daysHoliday.date, startOfDay.toISOString()),
        lte(daysHoliday.date, endOfDay.toISOString())
      ))
      .limit(1);

    const isHoliday = holidayCheck.length > 0;
    const holidayInfo = isHoliday ? holidayCheck[0] : null;

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
    // DISABLED: This should NOT auto-create attendance records
    // Admin must manually mark attendance for each employee
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isPastDate = targetDate < now;

    // NOTE: Auto-marking disabled to prevent incorrect attendance records
    // if (isPastDate && userIds.length > 0) {
    //   // This was creating false "present" records for all employees
    // }

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
      isHoliday: isHoliday,
      holiday: holidayInfo,
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
    const { employeeId, checkInTime, expectedCheckInTime, location, latitude, longitude, notes, date } = req.body;

    // Validation
    if (!employeeId) {
      return res.status(400).json({ 
        success: false,
        message: "Employee ID is required" 
      });
    }

    const userId = parseInt(employeeId);
    
    // Validate userId is a number
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Employee ID format. Employee ID must be a valid number." 
      });
    }

    // Verify the user exists
    const [userExists] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userExists) {
      return res.status(404).json({ 
        success: false,
        message: `Employee with ID ${userId} not found in the system` 
      });
    }

    const checkIn = checkInTime ? new Date(checkInTime) : new Date();
    
    // Validate checkIn is a valid date
    if (isNaN(checkIn.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid check-in time format" 
      });
    }

    // VALIDATE: Check-in must be within reasonable working hours
    if (expectedCheckInTime) {
      const expectedTime = new Date(expectedCheckInTime);
      const checkInHour = checkIn.getHours();
      const checkInMinute = checkIn.getMinutes();
      const expectedHour = expectedTime.getHours();
      const expectedMinute = expectedTime.getMinutes();
      
      // Allow check-in from 1 hour before default time to 1 hour after default check-out time
      // Example: if default is 8 AM - 5 PM, allow 7 AM - 6 PM
      const earliestAllowed = (expectedHour - 1) * 60 + expectedMinute;
      const latestAllowed = (expectedHour + 9) * 60 + expectedMinute; // 9 hours = work day
      const checkInTimeInMinutes = checkInHour * 60 + checkInMinute;
      
      if (checkInTimeInMinutes < earliestAllowed || checkInTimeInMinutes > latestAllowed) {
        const expectedTimeStr = expectedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return res.status(400).json({ 
          success: false,
          message: `Check-in time must be within working hours (expected check-in: ${expectedTimeStr})` 
        });
      }
    }

    // Use the date from the request if provided, otherwise calculate from checkInTime
    let today;
    if (date) {
      today = new Date(date);
      today.setHours(0, 0, 0, 0);
    } else {
      today = new Date(checkIn);
      today.setHours(0, 0, 0, 0);
    }

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
        success: false,
        message: "Employee has already checked in today. Cannot check-in twice.",
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
      const diffMs = checkIn - expectedTime; // Positive means late, negative means early
      const diffMinutes = Math.floor(diffMs / (1000 * 60)); // Convert milliseconds to minutes
      
      // DEBUG LOGGING
      console.log('=== CHECK-IN CALCULATION ===');
      console.log('Expected Check-In:', expectedTime.toISOString());
      console.log('Actual Check-In:', checkIn.toISOString());
      console.log('Difference (ms):', diffMs);
      console.log('Difference (minutes):', diffMinutes);
      console.log('Is Late?:', diffMinutes > 0);
      
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

    console.log('=== FINAL RESPONSE ===');
    console.log('Status:', record.status);
    console.log('isLate:', record.isLate);
    console.log('lateMinutes:', record.lateMinutes);

    res.json({
      success: true,
      message: `Check-in recorded successfully${isLate ? ' (Late arrival)' : ''}`,
      attendance: record,
      isLate,
      lateMinutes
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error occurred while marking check-in"
    });
  }
};

// Mark checkout for employee
export const markEmployeeCheckOut = async (req, res) => {
  try {
    const { employeeId, checkOutTime, expectedCheckOutTime, location, latitude, longitude, notes, date } = req.body;

    // Validation
    if (!employeeId) {
      return res.status(400).json({ 
        success: false,
        message: "Employee ID is required" 
      });
    }

    const userId = parseInt(employeeId);
    
    // Validate userId is a number
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Employee ID format. Employee ID must be a valid number." 
      });
    }

    // Verify the user exists
    const [userExists] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userExists) {
      return res.status(404).json({ 
        success: false,
        message: `Employee with ID ${userId} not found in the system` 
      });
    }

    const checkOut = checkOutTime ? new Date(checkOutTime) : new Date();
    
    // Validate checkOut is a valid date
    if (isNaN(checkOut.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid check-out time format" 
      });
    }

    // VALIDATE: Check-out must be within reasonable working hours
    if (expectedCheckOutTime) {
      const expectedTime = new Date(expectedCheckOutTime);
      const checkOutHour = checkOut.getHours();
      const checkOutMinute = checkOut.getMinutes();
      const expectedHour = expectedTime.getHours();
      const expectedMinute = expectedTime.getMinutes();
      
      // Allow check-out from 1 hour before default time to 2 hours after
      // Example: if default is 5 PM, allow 4 PM - 7 PM
      const earliestAllowed = (expectedHour - 1) * 60 + expectedMinute;
      const latestAllowed = (expectedHour + 2) * 60 + expectedMinute;
      const checkOutTimeInMinutes = checkOutHour * 60 + checkOutMinute;
      
      if (checkOutTimeInMinutes < earliestAllowed || checkOutTimeInMinutes > latestAllowed) {
        const expectedTimeStr = expectedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return res.status(400).json({ 
          success: false,
          message: `Check-out time must be within working hours (expected check-out: ${expectedTimeStr})` 
        });
      }
    }

    // Use the date from the request if provided, otherwise calculate from checkOutTime
    let today;
    if (date) {
      today = new Date(date);
      today.setHours(0, 0, 0, 0);
    } else {
      today = new Date(checkOut);
      today.setHours(0, 0, 0, 0);
    }

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
        success: false,
        message: "No check-in record found for today. Employee must check-in first before checking out."
      });
    }

    if (record.checkOut) {
      return res.status(400).json({ 
        success: false,
        message: "Employee has already checked out today. Cannot check-out twice."
      });
    }

    // Validate check-out is after check-in
    const recordCheckInTime = new Date(record.checkIn);
    if (checkOut <= recordCheckInTime) {
      return res.status(400).json({ 
        success: false,
        message: "Check-out time must be after check-in time"
      });
    }

    // Calculate working hours (just check-out - check-in, don't subtract breaks)
    const workingMinutes = Math.floor((checkOut - recordCheckInTime) / 60000);
    
    // VALIDATE: Minimum working hours (at least 4 hours)
    if (workingMinutes < 240) { // 4 hours minimum
      return res.status(400).json({ 
        success: false,
        message: "Must work at least 4 hours before checking out"
      });
    }
    
    // Calculate early departure and overtime - PRIORITY: use expectedCheckOutTime from frontend
    let isEarlyDeparture = false;
    let earlyDepartureMinutes = 0;
    let overtimeMinutes = 0;
    
    if (expectedCheckOutTime) {
      // Use the expected check-out time from frontend (default check-out time)
      const expectedTime = new Date(expectedCheckOutTime);
      const diffMs = expectedTime - checkOut; // Positive means early, negative means overtime
      const diffMinutes = Math.floor(diffMs / (1000 * 60)); // Convert milliseconds to minutes
      
      // DEBUG LOGGING
      console.log('=== CHECK-OUT CALCULATION ===');
      console.log('Expected Check-Out:', expectedTime.toISOString());
      console.log('Actual Check-Out:', checkOut.toISOString());
      console.log('Difference (ms):', diffMs);
      console.log('Difference (minutes):', diffMinutes);
      console.log('Is Early Departure?:', diffMinutes > 0);
      console.log('Is Overtime?:', diffMinutes < 0);
      
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

    console.log('About to update attendance (check-out). record.id:', record.id, 'type:', typeof record.id);
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

    console.log('=== FINAL CHECK-OUT RESPONSE ===');
    console.log('Status:', updated.status);
    console.log('isEarlyDeparture:', updated.isEarlyDeparture);
    console.log('earlyDepartureMinutes:', updated.earlyDepartureMinutes);
    console.log('overtimeMinutes:', updated.overtimeMinutes);
    console.log('workingMinutes:', workingMinutes);

    // Format working hours nicely
    const workingHrs = Math.floor(workingMinutes / 60);
    const workingMins = workingMinutes % 60;
    const workingHoursFormatted = workingHrs > 0 
      ? (workingMins > 0 ? `${workingHrs}h ${workingMins}m` : `${workingHrs}h`)
      : `${workingMins}m`;

    res.json({
      success: true,
      message: `Check-out recorded successfully`,
      attendance: updated,
      workingHours: workingHoursFormatted,
      workingMinutes,
      overtimeMinutes,
      isEarlyDeparture,
      earlyDepartureMinutes
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
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
      success: true,
      message: "Employee marked as absent successfully",
      attendance: record
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error occurred while marking absent"
    });
  }
};

/**
 * ==================== EDIT/UPDATE OPERATIONS ====================
 */

// Edit check-in time
export const editCheckInTime = async (req, res) => {
  try {
    const { attendanceId, employeeId, date, checkInTime, expectedCheckInTime, reason } = req.body;

    // DEBUG LOGGING
    console.log('=== EDIT CHECK-IN DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('attendanceId:', attendanceId, 'type:', typeof attendanceId);
    console.log('employeeId:', employeeId, 'type:', typeof employeeId);
    console.log('date:', date);

    // Validation
    if (!checkInTime) {
      console.log('ERROR: No checkInTime provided');
      return res.status(400).json({ 
        success: false, 
        message: "Check-in time is required" 
      });
    }

    // CRITICAL: Make sure we have SOMETHING to search with
    if (!attendanceId && (!employeeId || !date)) {
      console.log('ERROR: Missing search parameters');
      console.log('attendanceId:', attendanceId);
      console.log('employeeId:', employeeId);
      console.log('date:', date);
      return res.status(400).json({ 
        success: false, 
        message: "Either attendanceId OR (employeeId + date) is required",
        debug: { 
          receivedAttendanceId: attendanceId,
          receivedEmployeeId: employeeId,
          receivedDate: date,
          bodyKeys: Object.keys(req.body)
        }
      });
    }

    // Find the attendance record
    let record;
    if (attendanceId) {
      console.log('Searching by attendanceId:', attendanceId);
      const results = await db.select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, parseInt(attendanceId)));
      
      console.log('Results from attendanceId search:', results.length, 'records found');
      if (results.length > 0) {
        console.log('First result:', JSON.stringify(results[0], null, 2));
      }
      [record] = results;
    } else {
      const userId = parseInt(employeeId);
      console.log('Searching by employeeId:', userId, 'and date:', date);
      
      // Verify user exists
      const [userExists] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userExists) {
        console.log('User not found:', userId);
        return res.status(404).json({ 
          success: false,
          message: `Employee with ID ${userId} not found` 
        });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate.getTime() + 86400000);

      console.log('Date range:', targetDate, 'to', endDate);

      const results = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, targetDate),
          lte(attendanceRecords.date, endDate)
        ));
      
      console.log('Results from date search:', results.length, 'records found');
      if (results.length > 0) {
        console.log('First result:', JSON.stringify(results[0], null, 2));
      }
      [record] = results;
    }

    if (!record) {
      console.log('NO RECORD FOUND!');
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found",
        debug: {
          searchedBy: attendanceId ? 'attendanceId' : 'employeeId+date',
          attendanceId,
          employeeId,
          date
        }
      });
    }

    console.log('Found record with ID:', record.id);

    const newCheckIn = new Date(checkInTime);
    
    // Validate check-in is a valid date
    if (isNaN(newCheckIn.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid check-in time format" 
      });
    }

    // Calculate working hours if checkout exists
    let workingMinutes = record.workingHours || 0;
    if (record.checkOut) {
      workingMinutes = Math.floor((new Date(record.checkOut) - newCheckIn) / 60000);
      if (workingMinutes < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Check-in time cannot be after check-out time" 
        });
      }
    }

    // Recalculate late status
    let isLate = false;
    let lateMinutes = 0;
    
    if (expectedCheckInTime) {
      const expectedTime = new Date(expectedCheckInTime);
      const diffMs = newCheckIn - expectedTime;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes > 0) {
        isLate = true;
        lateMinutes = diffMinutes;
      }
    }

    // Determine status
    let status = 'present';
    if (isLate) status = 'late';
    if (record.isEarlyDeparture) status = 'early_departure';

    const updateData = {
      checkIn: newCheckIn,
      workingHours: workingMinutes,
      isLate,
      lateMinutes,
      status,
      updatedAt: new Date()
    };

    // Store old values for audit
    const oldValues = {
      checkIn: record.checkIn,
      workingHours: record.workingHours,
      isLate: record.isLate,
      lateMinutes: record.lateMinutes,
      status: record.status
    };

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId: record.userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues,
      newValues: updateData,
      reason: reason || 'Admin edited check-in time',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({ 
      success: true, 
      message: "Check-in time updated successfully", 
      attendance: updated 
    });
  } catch (error) {
    console.error('Edit check-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error updating check-in time" 
    });
  }
};

// Edit check-out time
export const editCheckOutTime = async (req, res) => {
  try {
    const { attendanceId, employeeId, date, checkOutTime, expectedCheckOutTime, reason } = req.body;

    // Validation
    if (!checkOutTime) {
      return res.status(400).json({ 
        success: false, 
        message: "Check-out time is required" 
      });
    }

    if (!attendanceId && (!employeeId || !date)) {
      return res.status(400).json({ 
        success: false, 
        message: "Either attendanceId OR (employeeId + date) is required" 
      });
    }

    // Find the attendance record
    let record;
    if (attendanceId) {
      [record] = await db.select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, parseInt(attendanceId)));
    } else {
      const userId = parseInt(employeeId);
      
      // Verify user exists
      const [userExists] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userExists) {
        return res.status(404).json({ 
          success: false,
          message: `Employee with ID ${userId} not found` 
        });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate.getTime() + 86400000);

      [record] = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, targetDate),
          lte(attendanceRecords.date, endDate)
        ));
    }

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    if (!record.checkIn) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot edit check-out: No check-in time exists" 
      });
    }

    const newCheckOut = new Date(checkOutTime);
    
    // Validate check-out is a valid date
    if (isNaN(newCheckOut.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid check-out time format" 
      });
    }

    // Calculate working hours
    const workingMinutes = Math.floor((newCheckOut - new Date(record.checkIn)) / 60000);

    if (workingMinutes < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Check-out time cannot be before check-in time" 
      });
    }

    // Recalculate early departure and overtime
    let isEarlyDeparture = false;
    let earlyDepartureMinutes = 0;
    let overtimeMinutes = 0;
    
    if (expectedCheckOutTime) {
      const expectedTime = new Date(expectedCheckOutTime);
      const diffMs = expectedTime - newCheckOut;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes > 0) {
        isEarlyDeparture = true;
        earlyDepartureMinutes = diffMinutes;
      } else if (diffMinutes < 0) {
        overtimeMinutes = Math.abs(diffMinutes);
      }
    }

    // Determine status
    let status = 'present';
    if (record.isLate) status = 'late';
    if (isEarlyDeparture) status = 'early_departure';

    const updateData = {
      checkOut: newCheckOut,
      workingHours: workingMinutes,
      isEarlyDeparture,
      earlyDepartureMinutes,
      overtimeMinutes,
      status,
      updatedAt: new Date()
    };

    // Store old values for audit
    const oldValues = {
      checkOut: record.checkOut,
      workingHours: record.workingHours,
      isEarlyDeparture: record.isEarlyDeparture,
      earlyDepartureMinutes: record.earlyDepartureMinutes,
      overtimeMinutes: record.overtimeMinutes,
      status: record.status
    };

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Update overtime tracking if applicable
    if (overtimeMinutes > 0) {
      // Check if overtime record exists
      const [existingOT] = await db.select()
        .from(overtimeTracking)
        .where(eq(overtimeTracking.attendanceId, record.id));

      if (existingOT) {
        await db.update(overtimeTracking)
          .set({
            overtimeMinutes,
            updatedAt: new Date()
          })
          .where(eq(overtimeTracking.id, existingOT.id));
      } else {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        
        await db.insert(overtimeTracking).values({
          userId: record.userId,
          attendanceId: record.id,
          date: recordDate,
          overtimeMinutes,
          overtimeRate: '1.5',
          isApproved: false
        });
      }
    } else if (overtimeMinutes === 0) {
      // Remove overtime tracking if no longer overtime
      await db.delete(overtimeTracking)
        .where(eq(overtimeTracking.attendanceId, record.id));
    }

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId: record.userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues,
      newValues: updateData,
      reason: reason || 'Admin edited check-out time',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({ 
      success: true, 
      message: "Check-out time updated successfully", 
      attendance: updated 
    });
  } catch (error) {
    console.error('Edit check-out error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error updating check-out time" 
    });
  }
};

// Edit break duration (REPLACES the total break duration)
export const editBreakDuration = async (req, res) => {
  try {
    const { attendanceId, employeeId, date, breakDurationHours, reason } = req.body;

    // Validation
    if (breakDurationHours === undefined || breakDurationHours === null) {
      return res.status(400).json({ 
        success: false, 
        message: "Break duration is required" 
      });
    }

    if (!attendanceId && (!employeeId || !date)) {
      return res.status(400).json({ 
        success: false, 
        message: "Either attendanceId OR (employeeId + date) is required" 
      });
    }

    // Find the attendance record
    let record;
    if (attendanceId) {
      [record] = await db.select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, parseInt(attendanceId)));
    } else {
      const userId = parseInt(employeeId);
      
      // Verify user exists
      const [userExists] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userExists) {
        return res.status(404).json({ 
          success: false,
          message: `Employee with ID ${userId} not found` 
        });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate.getTime() + 86400000);

      [record] = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, targetDate),
          lte(attendanceRecords.date, endDate)
        ));
    }

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    // Validate break duration
    if (parseFloat(breakDurationHours) < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Break duration cannot be negative" 
      });
    }

    const breakMinutes = Math.floor(parseFloat(breakDurationHours) * 60);

    // Store old values for audit
    const oldValues = {
      breakDuration: record.breakDuration
    };

    const updateData = {
      breakDuration: breakMinutes,
      updatedAt: new Date()
    };

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId: record.userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues,
      newValues: updateData,
      reason: reason || 'Admin edited break duration',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Format break duration nicely
    const hours = Math.floor(breakMinutes / 60);
    const mins = breakMinutes % 60;
    const durationText = hours > 0 
      ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
      : `${mins}m`;

    res.json({ 
      success: true, 
      message: `Break duration updated to ${durationText}`, 
      attendance: updated,
      breakDuration: durationText
    });
  } catch (error) {
    console.error('Edit break duration error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error updating break duration" 
    });
  }
};

// Add/Edit overtime hours
export const addOvertimeHours = async (req, res) => {
  try {
    const { attendanceId, employeeId, date, overtimeHours, reason } = req.body;

    // Validation
    if (overtimeHours === undefined || overtimeHours === null) {
      return res.status(400).json({ 
        success: false, 
        message: "Overtime hours is required" 
      });
    }

    if (!attendanceId && (!employeeId || !date)) {
      return res.status(400).json({ 
        success: false, 
        message: "Either attendanceId OR (employeeId + date) is required" 
      });
    }

    // Find the attendance record
    let record;
    if (attendanceId) {
      [record] = await db.select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, parseInt(attendanceId)));
    } else {
      const userId = parseInt(employeeId);
      
      // Verify user exists
      const [userExists] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userExists) {
        return res.status(404).json({ 
          success: false,
          message: `Employee with ID ${userId} not found` 
        });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate.getTime() + 86400000);

      [record] = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, targetDate),
          lte(attendanceRecords.date, endDate)
        ));
    }

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    // Validate overtime hours
    if (parseFloat(overtimeHours) < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Overtime hours cannot be negative" 
      });
    }

    const overtimeMinutes = Math.floor(parseFloat(overtimeHours) * 60);

    // Store old values for audit
    const oldValues = {
      overtimeMinutes: record.overtimeMinutes
    };

    // Keep working hours and overtime separate - don't add overtime to working hours
    const updateData = {
      overtimeMinutes: overtimeMinutes,
      updatedAt: new Date()
    };

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId: record.userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues,
      newValues: updateData,
      reason: reason || 'Admin added/edited overtime hours',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Format overtime nicely
    const hours = Math.floor(overtimeMinutes / 60);
    const mins = overtimeMinutes % 60;
    const overtimeText = hours > 0 
      ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
      : `${mins}m`;

    res.json({ 
      success: true, 
      message: `Overtime updated to ${overtimeText}`, 
      attendance: updated,
      overtime: overtimeText
    });
  } catch (error) {
    console.error('Add overtime error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error adding/updating overtime" 
    });
  }
};

/**
 * ==================== BULK OPERATIONS ====================
 */

// Update entire attendance record (comprehensive edit)
export const updateAttendanceRecord = async (req, res) => {
  try {
    const { 
      attendanceId, 
      employeeId, 
      date, 
      checkInTime, 
      checkOutTime, 
      breakDurationHours,
      status,
      notes,
      reason 
    } = req.body;

    // Validation
    if (!attendanceId && (!employeeId || !date)) {
      return res.status(400).json({ 
        success: false, 
        message: "Either attendanceId OR (employeeId + date) is required" 
      });
    }

    // Find the attendance record
    let record;
    if (attendanceId) {
      [record] = await db.select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, parseInt(attendanceId)));
    } else {
      const userId = parseInt(employeeId);
      
      // Verify user exists
      const [userExists] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userExists) {
        return res.status(404).json({ 
          success: false,
          message: `Employee with ID ${userId} not found` 
        });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate.getTime() + 86400000);

      [record] = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, targetDate),
          lte(attendanceRecords.date, endDate)
        ));
    }

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    // Store old values for audit
    const oldValues = { ...record };

    // Build update data
    const updateData = {
      updatedAt: new Date()
    };

    // Update check-in if provided
    if (checkInTime) {
      const newCheckIn = new Date(checkInTime);
      if (isNaN(newCheckIn.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid check-in time format" 
        });
      }
      updateData.checkIn = newCheckIn;
    }

    // Update check-out if provided
    if (checkOutTime) {
      const newCheckOut = new Date(checkOutTime);
      if (isNaN(newCheckOut.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid check-out time format" 
        });
      }
      updateData.checkOut = newCheckOut;
    }

    // Calculate working hours if both times are available
    const finalCheckIn = updateData.checkIn || record.checkIn;
    const finalCheckOut = updateData.checkOut || record.checkOut;
    
    if (finalCheckIn && finalCheckOut) {
      const workingMinutes = Math.floor((new Date(finalCheckOut) - new Date(finalCheckIn)) / 60000);
      
      if (workingMinutes < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Check-out time cannot be before check-in time" 
        });
      }
      
      updateData.workingHours = workingMinutes;
    }

    // Update break duration if provided
    if (breakDurationHours !== undefined && breakDurationHours !== null) {
      updateData.breakDuration = Math.floor(parseFloat(breakDurationHours) * 60);
    }

    // Update status if provided
    if (status) {
      updateData.status = status;
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId: record.userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues,
      newValues: updateData,
      reason: reason || 'Admin updated attendance record',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({ 
      success: true, 
      message: "Attendance record updated successfully", 
      attendance: updated 
    });
  } catch (error) {
    console.error('Update attendance record error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error updating attendance record" 
    });
  }
};

// Delete attendance record
export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { attendanceId, employeeId, date, reason } = req.body;

    // Validation
    if (!attendanceId && (!employeeId || !date)) {
      return res.status(400).json({ 
        success: false, 
        message: "Either attendanceId OR (employeeId + date) is required" 
      });
    }

    // Find the attendance record
    let record;
    if (attendanceId) {
      [record] = await db.select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, parseInt(attendanceId)));
    } else {
      const userId = parseInt(employeeId);
      
      // Verify user exists
      const [userExists] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userExists) {
        return res.status(404).json({ 
          success: false,
          message: `Employee with ID ${userId} not found` 
        });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate.getTime() + 86400000);

      [record] = await db.select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, targetDate),
          lte(attendanceRecords.date, endDate)
        ));
    }

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    // Create audit log before deletion
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId: record.userId,
      actionType: 'delete',
      actionBy: req.authData.id,
      oldValues: record,
      newValues: null,
      reason: reason || 'Admin deleted attendance record',
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Delete related records first (foreign key constraints)
    await db.delete(attendanceBreaks)
      .where(eq(attendanceBreaks.attendanceId, record.id));
    
    await db.delete(attendanceLocationLogs)
      .where(eq(attendanceLocationLogs.attendanceId, record.id));
    
    await db.delete(overtimeTracking)
      .where(eq(overtimeTracking.attendanceId, record.id));

    // Delete the attendance record
    await db.delete(attendanceRecords)
      .where(eq(attendanceRecords.id, record.id));

    res.json({ 
      success: true, 
      message: "Attendance record deleted successfully"
    });
  } catch (error) {
    console.error('Delete attendance record error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error deleting attendance record" 
    });
  }
};

/**
 * ==================== BULK OPERATIONS (CONTINUED) ====================
 */

// Add break duration to employee's attendance
export const addBreakDuration = async (req, res) => {
  try {
    const { employeeId, date, breakDurationHours, breakType, reason } = req.body;

    // Validation
    if (!employeeId) {
      return res.status(400).json({ 
        success: false,
        message: "Employee ID is required" 
      });
    }

    const userId = parseInt(employeeId);
    
    // Validate userId is a number
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid Employee ID format. Employee ID must be a valid number." 
      });
    }

    // Verify the user exists
    const [userExists] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userExists) {
      return res.status(404).json({ 
        success: false,
        message: `Employee with ID ${userId} not found in the system` 
      });
    }

    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: "Date is required" 
      });
    }

    if (!breakDurationHours || breakDurationHours <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Break duration must be greater than 0" 
      });
    }

    if (!breakType) {
      return res.status(400).json({ 
        success: false,
        message: "Break type is required" 
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // BACKEND CALCULATION: Convert hours to minutes
    const breakMinutes = Math.floor(parseFloat(breakDurationHours) * 60);

    console.log('=== ADD BREAK CALCULATION ===');
    console.log('Input hours:', breakDurationHours);
    console.log('Calculated minutes:', breakMinutes);

    // Find today's attendance record
    const [record] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.date, targetDate),
        lte(attendanceRecords.date, new Date(targetDate.getTime() + 24 * 60 * 60 * 1000))
      ));

    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: "No attendance record found for this date. Employee must check-in first." 
      });
    }

    if (!record.checkIn) {
      return res.status(400).json({ 
        success: false,
        message: "Employee must check-in before adding break time." 
      });
    }

    // Format break note
    const hours = Math.floor(breakMinutes / 60);
    const mins = breakMinutes % 60;
    const durationText = hours > 0 
      ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
      : `${mins}m`;
    
    const breakNote = `Break: ${breakType} - ${durationText}${reason ? ` (${reason})` : ''}`;
    const existingNotes = record.notes || '';
    const updatedNotes = existingNotes ? `${existingNotes}\n${breakNote}` : breakNote;

    // Calculate new total break duration
    const currentBreakDuration = record.breakDuration || 0;
    const newTotalBreakDuration = currentBreakDuration + breakMinutes;

    // Update attendance record
    const updateData = {
      breakDuration: newTotalBreakDuration,
      notes: updatedNotes,
      updatedAt: new Date()
    };

    const [updated] = await db.update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // Create audit log
    await db.insert(attendanceAuditLog).values({
      attendanceId: record.id,
      userId,
      actionType: 'update',
      actionBy: req.authData.id,
      oldValues: { breakDuration: currentBreakDuration, notes: record.notes },
      newValues: updateData,
      reason: `Admin added break: ${breakType} - ${durationText}`,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    console.log('=== BREAK ADDED SUCCESSFULLY ===');
    console.log('Previous break duration:', currentBreakDuration, 'minutes');
    console.log('Added break duration:', breakMinutes, 'minutes');
    console.log('New total break duration:', newTotalBreakDuration, 'minutes');

    res.json({
      success: true,
      message: `Break of ${durationText} added successfully`,
      attendance: updated,
      breakAdded: durationText,
      totalBreakDuration: newTotalBreakDuration
    });

  } catch (error) {
    console.error('Add break error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error occurred while adding break duration"
    });
  }
};

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

/**
 * Export attendance to CSV
 */
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get attendance records with user details
    const records = await db.select({
      date: attendanceRecords.date,
      employeeName: users.fullName,
      employeeCode: users.employeeCode,
      department: users.department,
      checkIn: attendanceRecords.checkIn,
      checkOut: attendanceRecords.checkOut,
      workingHours: attendanceRecords.workingHours,
      status: attendanceRecords.status,
      isLate: attendanceRecords.isLate,
      lateMinutes: attendanceRecords.lateMinutes,
      isEarlyDeparture: attendanceRecords.isEarlyDeparture,
      earlyDepartureMinutes: attendanceRecords.earlyDepartureMinutes,
      overtimeMinutes: attendanceRecords.overtimeMinutes,
      location: attendanceRecords.location,
      notes: attendanceRecords.notes
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(and(
      gte(attendanceRecords.date, start),
      lte(attendanceRecords.date, end)
    ))
    .orderBy(desc(attendanceRecords.date), users.fullName);

    // Filter by department if specified
    let filteredRecords = records;
    if (departmentId) {
      filteredRecords = records.filter(r => r.department === departmentId);
    }

    // Generate CSV
    const csvRows = [];
    csvRows.push([
      'Date',
      'Employee Name',
      'Employee Code',
      'Department',
      'Check In',
      'Check Out',
      'Working Hours',
      'Status',
      'Late (mins)',
      'Early Departure (mins)',
      'Overtime (mins)',
      'Location',
      'Notes'
    ].join(','));

    filteredRecords.forEach(record => {
      const workingHoursFormatted = record.workingHours 
        ? `${Math.floor(record.workingHours / 60)}h ${record.workingHours % 60}m`
        : '-';
      
      csvRows.push([
        new Date(record.date).toISOString().split('T')[0],
        record.employeeName || '-',
        record.employeeCode || '-',
        record.department || '-',
        record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-',
        record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
        workingHoursFormatted,
        record.status || '-',
        record.lateMinutes || 0,
        record.earlyDepartureMinutes || 0,
        record.overtimeMinutes || 0,
        record.location || '-',
        (record.notes || '').replace(/,/g, ';')
      ].join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${start.toISOString().split('T')[0]}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting attendance CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance data'
    });
  }
};

/**
 * Get attendance report (daily/monthly/yearly)
 */
export const getAttendanceReport = async (req, res) => {
  try {
    const { type = 'daily', date, month, year, departmentId } = req.query;

    let startDate, endDate;

    if (type === 'daily') {
      startDate = date ? new Date(date) : new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (type === 'monthly') {
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, targetMonth - 1, 1);
      endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    } else if (type === 'yearly') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    }

    // Get attendance records
    const records = await db.select({
      id: attendanceRecords.id,
      date: attendanceRecords.date,
      userId: attendanceRecords.userId,
      checkIn: attendanceRecords.checkIn,
      checkOut: attendanceRecords.checkOut,
      workingHours: attendanceRecords.workingHours,
      status: attendanceRecords.status,
      isLate: attendanceRecords.isLate,
      lateMinutes: attendanceRecords.lateMinutes,
      isEarlyDeparture: attendanceRecords.isEarlyDeparture,
      earlyDepartureMinutes: attendanceRecords.earlyDepartureMinutes,
      overtimeMinutes: attendanceRecords.overtimeMinutes,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      department: users.department,
      departmentId: users.departmentId
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(and(
      gte(attendanceRecords.date, startDate),
      lte(attendanceRecords.date, endDate)
    ))
    .orderBy(desc(attendanceRecords.date));

    // Filter by department
    let filteredRecords = records;
    if (departmentId) {
      filteredRecords = records.filter(r => r.departmentId === parseInt(departmentId));
    }

    // Calculate statistics
    const stats = {
      totalRecords: filteredRecords.length,
      present: filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length,
      absent: filteredRecords.filter(r => r.status === 'absent').length,
      late: filteredRecords.filter(r => r.isLate).length,
      earlyDepartures: filteredRecords.filter(r => r.isEarlyDeparture).length,
      totalWorkingHours: Math.floor(filteredRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0) / 60),
      totalOvertimeHours: Math.floor(filteredRecords.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0) / 60),
      totalLateMinutes: filteredRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0),
      totalEarlyDepartureMinutes: filteredRecords.reduce((sum, r) => sum + (r.earlyDepartureMinutes || 0), 0)
    };

    res.json({
      success: true,
      data: {
        type,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        records: filteredRecords,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
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
  addBreakDuration,
  editCheckInTime,
  editCheckOutTime,
  editBreakDuration,
  addOvertimeHours,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  bulkMarkAttendance,
  exportAttendanceCSV,
  getAttendanceReport
};
