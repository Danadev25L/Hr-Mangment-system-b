import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  attendanceRecords, 
  users,
  departments,
  workShifts,
  employeeShifts
} from '../../../db/schema.js';

/**
 * Get employee attendance details
 */
export const getEmployeeAttendanceDetails = async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        message: 'User ID and date are required'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Get user details
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get attendance record
    const [attendance] = await db.select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.userId, parseInt(userId)),
        gte(attendanceRecords.date, targetDate),
        lte(attendanceRecords.date, nextDay)
      ))
      .limit(1);

    // Get shift info
    const [shift] = await db.select({
      shiftName: workShifts.shiftName,
      startTime: workShifts.startTime,
      endTime: workShifts.endTime,
      graceMinutes: workShifts.graceMinutes
    })
    .from(employeeShifts)
    .leftJoin(workShifts, eq(employeeShifts.shiftId, workShifts.id))
    .where(and(
      eq(employeeShifts.userId, parseInt(userId)),
      eq(employeeShifts.isActive, true)
    ))
    .limit(1);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          employeeCode: user.employeeCode,
          department: user.department,
          jobTitle: user.jobTitle,
          email: user.email
        },
        attendance: attendance || null,
        shift: shift || null
      }
    });

  } catch (error) {
    console.error('Error fetching employee attendance details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance details'
    });
  }
};

/**
 * Export attendance to CSV
 */
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { startDate, endDate, departmentId, format = 'daily' } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Build query
    let filters = [
      gte(attendanceRecords.date, start),
      lte(attendanceRecords.date, end)
    ];

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
    .where(and(...filters))
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
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${format}_${start.toISOString().split('T')[0]}.csv"`);
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

export default {
  getEmployeeAttendanceDetails,
  exportAttendanceCSV,
  getAttendanceReport
};
