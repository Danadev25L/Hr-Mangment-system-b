import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { 
  attendanceRecords, 
  users, 
  daysHoliday,
  applications 
} from '../db/schema.js';

/**
 * Auto Attendance Service
 * Automatically marks all employees as checked in and checked out on time
 * for any day that passes without manual check-in/check-out
 */

/**
 * Check if a date is a working day (Monday-Friday, not a holiday)
 * @param {Date} date - Date to check
 * @returns {Promise<boolean>}
 */
const isWorkingDay = async (date) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Skip weekends (Saturday and Sunday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check if it's a holiday
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const holiday = await db.select()
    .from(daysHoliday)
    .where(eq(sql`DATE(${daysHoliday.date})`, sql`DATE(${dateOnly})`));

  if (holiday.length > 0) {
    return false;
  }

  return true;
};

/**
 * Check if employee is on approved leave
 * @param {number} userId - User ID
 * @param {Date} date - Date to check
 * @returns {Promise<boolean>}
 */
const isOnLeave = async (userId, date) => {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const leaveApplications = await db.select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        eq(applications.status, 'approved'),
        lte(applications.startDate, dateOnly),
        gte(applications.endDate, dateOnly)
      )
    );

  return leaveApplications.length > 0;
};

/**
 * Get default working hours for a day
 * @param {Date} date - Date to get working hours for
 * @returns {Object} { startTime, endTime, workingMinutes }
 */
const getDefaultWorkingHours = (date) => {
  // Default: 8:00 AM - 5:00 PM (9 hours = 540 minutes)
  return {
    startTime: '08:00',
    endTime: '17:00',
    workingMinutes: 540
  };
};

/**
 * Auto-mark attendance for all employees for a specific date
 * This marks employees as checked in and checked out on time
 * @param {Date} targetDate - The date to auto-mark (defaults to yesterday)
 * @returns {Promise<Object>} Results summary
 */
export const autoMarkAttendance = async (targetDate = null) => {
  try {
    // Default to yesterday if no date provided
    if (!targetDate) {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    // Set to start of day
    const dateOnly = new Date(
      targetDate.getFullYear(), 
      targetDate.getMonth(), 
      targetDate.getDate()
    );

    console.log(`[Auto-Attendance] Processing date: ${dateOnly.toISOString().split('T')[0]}`);

    // Check if it's a working day
    const isWorking = await isWorkingDay(dateOnly);
    if (!isWorking) {
      console.log(`[Auto-Attendance] ${dateOnly.toISOString().split('T')[0]} is not a working day. Skipping.`);
      return {
        success: true,
        message: 'Not a working day',
        date: dateOnly,
        processed: 0,
        skipped: 0,
        alreadyExists: 0
      };
    }

    // Get all active employees (non-admin) with their creation date
    const employees = await db.select({
      id: users.id,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER'])
    );

    console.log(`[Auto-Attendance] Found ${employees.length} employees to process`);

    // Get default working hours for this day
    const { startTime, endTime, workingMinutes } = getDefaultWorkingHours(dateOnly);
    
    let processed = 0;
    let skipped = 0;
    let alreadyExists = 0;

    for (const employee of employees) {
      try {
        // Skip if employee wasn't created yet on this date
        const employeeCreatedDate = new Date(employee.createdAt);
        employeeCreatedDate.setHours(0, 0, 0, 0);
        
        if (dateOnly < employeeCreatedDate) {
          console.log(`[Auto-Attendance] Employee ${employee.fullName} didn't exist on ${dateOnly.toISOString().split('T')[0]}. Skipping.`);
          skipped++;
          continue;
        }

        // Check if employee already has attendance record for this date
        const existing = await db.select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.userId, employee.id),
              eq(sql`DATE(${attendanceRecords.date})`, sql`DATE(${dateOnly})`)
            )
          );

        if (existing.length > 0) {
          console.log(`[Auto-Attendance] Employee ${employee.fullName} already has attendance for ${dateOnly.toISOString().split('T')[0]}`);
          alreadyExists++;
          continue;
        }

        // Check if employee is on leave
        const onLeave = await isOnLeave(employee.id, dateOnly);
        if (onLeave) {
          console.log(`[Auto-Attendance] Employee ${employee.fullName} is on approved leave. Skipping.`);
          skipped++;
          continue;
        }

        // Create check-in and check-out times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const checkInTime = new Date(dateOnly);
        checkInTime.setHours(startHour, startMinute, 0, 0);

        const checkOutTime = new Date(dateOnly);
        checkOutTime.setHours(endHour, endMinute, 0, 0);

        // Create auto attendance record
        await db.insert(attendanceRecords).values({
          userId: employee.id,
          date: dateOnly,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          workingHours: workingMinutes,
          status: 'present',
          isLate: false,
          lateMinutes: 0,
          isEarlyDeparture: false,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          breakDuration: 0,
          notes: 'Auto-marked attendance - No manual check-in/check-out',
          isManualEntry: true,
          location: 'Auto-System',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        processed++;
        console.log(`[Auto-Attendance] ✓ Auto-marked ${employee.fullName} as present on time`);

      } catch (error) {
        console.error(`[Auto-Attendance] Error processing employee ${employee.fullName}:`, error);
        skipped++;
      }
    }

    const summary = {
      success: true,
      message: 'Auto-attendance completed',
      date: dateOnly,
      processed,
      skipped,
      alreadyExists,
      totalEmployees: employees.length
    };

    console.log('[Auto-Attendance] Summary:', summary);
    return summary;

  } catch (error) {
    console.error('[Auto-Attendance] Error in autoMarkAttendance:', error);
    throw error;
  }
};

/**
 * Run auto-attendance for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of daily results
 */
export const autoMarkAttendanceRange = async (startDate, endDate) => {
  const results = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const result = await autoMarkAttendance(new Date(currentDate));
    results.push(result);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
};

/**
 * Backfill ALL missing attendance records for all employees
 * Goes back through entire employment history and fills missing days
 * @returns {Promise<Object>} Summary of backfill operation
 */
export const backfillAllMissingAttendance = async () => {
  try {
    console.log('[Auto-Attendance] Starting FULL BACKFILL of all missing attendance records...');
    
    // Get all employees with their creation dates
    const employees = await db.select({
      id: users.id,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      inArray(users.role, ['ROLE_EMPLOYEE', 'ROLE_MANAGER'])
    );

    console.log(`[Auto-Attendance] Found ${employees.length} employees for backfill`);

    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalAlreadyExists = 0;
    const employeeSummaries = [];

    // Today's date (don't process today, only past days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const employee of employees) {
      console.log(`\n[Auto-Attendance] Processing employee: ${employee.fullName}`);
      
      // Start from employee creation date
      const employeeStartDate = new Date(employee.createdAt);
      employeeStartDate.setHours(0, 0, 0, 0);
      
      console.log(`[Auto-Attendance] Employee created on: ${employeeStartDate.toISOString().split('T')[0]}`);
      console.log(`[Auto-Attendance] Backfilling from ${employeeStartDate.toISOString().split('T')[0]} to ${yesterday.toISOString().split('T')[0]}`);

      let employeeProcessed = 0;
      let employeeSkipped = 0;
      let employeeExists = 0;

      // Loop through each day from creation to yesterday
      const currentDate = new Date(employeeStartDate);
      
      while (currentDate <= yesterday) {
        const dateOnly = new Date(currentDate);
        
        try {
          // Check if it's a working day
          const isWorking = await isWorkingDay(dateOnly);
          if (!isWorking) {
            employeeSkipped++;
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Check if attendance already exists
          const existing = await db.select()
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.userId, employee.id),
                eq(sql`DATE(${attendanceRecords.date})`, sql`DATE(${dateOnly})`)
              )
            );

          if (existing.length > 0) {
            employeeExists++;
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Check if employee was on leave
          const onLeave = await isOnLeave(employee.id, dateOnly);
          if (onLeave) {
            employeeSkipped++;
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Get default working hours for this day
          const { startTime, endTime, workingMinutes } = getDefaultWorkingHours(dateOnly);
          
          // Create check-in and check-out times
          const [startHour, startMinute] = startTime.split(':').map(Number);
          const [endHour, endMinute] = endTime.split(':').map(Number);

          const checkInTime = new Date(dateOnly);
          checkInTime.setHours(startHour, startMinute, 0, 0);

          const checkOutTime = new Date(dateOnly);
          checkOutTime.setHours(endHour, endMinute, 0, 0);

          // Create auto attendance record
          await db.insert(attendanceRecords).values({
            userId: employee.id,
            date: dateOnly,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            workingHours: workingMinutes,
            status: 'present',
            isLate: false,
            lateMinutes: 0,
            isEarlyDeparture: false,
            earlyDepartureMinutes: 0,
            overtimeMinutes: 0,
            breakDuration: 0,
            notes: 'Auto-marked attendance (Backfill) - No manual check-in/check-out',
            isManualEntry: true,
            location: 'Auto-System-Backfill',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          employeeProcessed++;
          
        } catch (error) {
          console.error(`[Auto-Attendance] Error processing date ${dateOnly.toISOString().split('T')[0]} for ${employee.fullName}:`, error);
          employeeSkipped++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const employeeSummary = {
        employeeId: employee.id,
        employeeName: employee.fullName,
        processed: employeeProcessed,
        skipped: employeeSkipped,
        alreadyExists: employeeExists,
        startDate: employeeStartDate.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0]
      };

      employeeSummaries.push(employeeSummary);
      totalProcessed += employeeProcessed;
      totalSkipped += employeeSkipped;
      totalAlreadyExists += employeeExists;

      console.log(`[Auto-Attendance] Employee ${employee.fullName} summary:`);
      console.log(`  - Processed: ${employeeProcessed}`);
      console.log(`  - Skipped: ${employeeSkipped}`);
      console.log(`  - Already exists: ${employeeExists}`);
    }

    const summary = {
      success: true,
      message: 'Backfill completed',
      totalEmployees: employees.length,
      totalProcessed,
      totalSkipped,
      totalAlreadyExists,
      employeeSummaries
    };

    console.log('\n[Auto-Attendance] BACKFILL COMPLETE:');
    console.log(`  Total employees processed: ${employees.length}`);
    console.log(`  Total records created: ${totalProcessed}`);
    console.log(`  Total skipped (weekends/holidays/leave): ${totalSkipped}`);
    console.log(`  Total already existed: ${totalAlreadyExists}`);

    return summary;

  } catch (error) {
    console.error('[Auto-Attendance] Error in backfillAllMissingAttendance:', error);
    throw error;
  }
};
