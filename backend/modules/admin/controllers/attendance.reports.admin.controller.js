import { eq, and, gte, lte, desc, sql, inArray, count } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { 
  attendanceRecords,
  attendanceSummary,
  users,
  departments,
  dailyAttendanceReports,
  departmentAttendanceReports,
  overtimeTracking,
  attendanceAlerts,
  leaveRequests
} from '../../../db/schema.js';

/**
 * ==================== COMPREHENSIVE ATTENDANCE REPORTS ====================
 */

// Generate Daily Attendance Report
export const generateDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Get all active employees
    const allEmployees = await db.select()
      .from(users)
      .where(eq(users.active, true));

    const totalEmployees = allEmployees.length;

    // Get attendance for the day
    const attendance = await db.select()
      .from(attendanceRecords)
      .where(and(
        gte(attendanceRecords.date, reportDate),
        lte(attendanceRecords.date, new Date(reportDate.getTime() + 24 * 60 * 60 * 1000))
      ));

    const presentCount = attendance.filter(a => 
      a.status === 'present' || a.status === 'late').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.isLate).length;
    const onLeaveCount = attendance.filter(a => a.status === 'on_leave').length;
    const halfDayCount = attendance.filter(a => a.status === 'half_day').length;

    // Employees who haven't marked attendance
    const markedUserIds = attendance.map(a => a.userId);
    const unmarked = allEmployees.filter(e => !markedUserIds.includes(e.id));

    const attendancePercentage = totalEmployees > 0 
      ? ((presentCount / totalEmployees) * 100).toFixed(2)
      : 0;

    // Save or update daily report
    const reportData = {
      reportDate,
      totalEmployees,
      presentCount,
      absentCount,
      lateCount,
      onLeaveCount,
      halfDayCount,
      attendancePercentage,
      generatedBy: req.authData.id,
      generatedAt: new Date()
    };

    const [report] = await db.insert(dailyAttendanceReports)
      .values(reportData)
      .onConflictDoUpdate({
        target: dailyAttendanceReports.reportDate,
        set: reportData
      })
      .returning();

    res.json({
      message: "Daily attendance report generated successfully",
      report,
      details: {
        totalEmployees,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        onLeave: onLeaveCount,
        halfDay: halfDayCount,
        unmarked: unmarked.length,
        attendancePercentage: parseFloat(attendancePercentage)
      },
      unmarkedEmployees: unmarked.map(e => ({
        id: e.id,
        fullName: e.fullName,
        employeeCode: e.employeeCode,
        department: e.department
      }))
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error generating daily report"
    });
  }
};

// Get Weekly Attendance Report
export const getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "Start date and end date are required" 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all daily reports for the week
    const dailyReports = await db.select()
      .from(dailyAttendanceReports)
      .where(and(
        gte(dailyAttendanceReports.reportDate, start),
        lte(dailyAttendanceReports.reportDate, end)
      ))
      .orderBy(dailyAttendanceReports.reportDate);

    // Calculate weekly aggregates
    const weeklyStats = {
      totalDays: dailyReports.length,
      avgAttendancePercentage: dailyReports.length > 0
        ? (dailyReports.reduce((sum, r) => 
            sum + parseFloat(r.attendancePercentage), 0) / dailyReports.length).toFixed(2)
        : 0,
      totalPresent: dailyReports.reduce((sum, r) => sum + r.presentCount, 0),
      totalAbsent: dailyReports.reduce((sum, r) => sum + r.absentCount, 0),
      totalLate: dailyReports.reduce((sum, r) => sum + r.lateCount, 0),
      totalOnLeave: dailyReports.reduce((sum, r) => sum + r.onLeaveCount, 0),
      totalHalfDay: dailyReports.reduce((sum, r) => sum + r.halfDayCount, 0)
    };

    // Get top performers (high attendance)
    const attendance = await db.select({
      userId: attendanceRecords.userId,
      fullName: users.fullName,
      employeeCode: users.employeeCode,
      department: users.department,
      presentDays: sql<number>`COUNT(CASE WHEN ${attendanceRecords.status} IN ('present', 'late') THEN 1 END)`,
      lateDays: sql<number>`COUNT(CASE WHEN ${attendanceRecords.isLate} = true THEN 1 END)`
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(and(
      gte(attendanceRecords.date, start),
      lte(attendanceRecords.date, end)
    ))
    .groupBy(attendanceRecords.userId, users.fullName, users.employeeCode, users.department)
    .orderBy(desc(sql`COUNT(CASE WHEN ${attendanceRecords.status} IN ('present', 'late') THEN 1 END)`))
    .limit(10);

    res.json({
      message: "Weekly attendance report retrieved successfully",
      period: { startDate: start, endDate: end },
      weeklyStats,
      dailyReports,
      topPerformers: attendance
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error generating weekly report"
    });
  }
};

// Get Monthly Attendance Report
export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Get monthly summaries
    let filters = [
      eq(attendanceSummary.month, targetMonth),
      eq(attendanceSummary.year, targetYear)
    ];

    const summaries = await db.select({
      id: attendanceSummary.id,
      userId: attendanceSummary.userId,
      month: attendanceSummary.month,
      year: attendanceSummary.year,
      totalWorkingDays: attendanceSummary.totalWorkingDays,
      presentDays: attendanceSummary.presentDays,
      absentDays: attendanceSummary.absentDays,
      lateDays: attendanceSummary.lateDays,
      halfDays: attendanceSummary.halfDays,
      leaveDays: attendanceSummary.leaveDays,
      totalWorkingHours: attendanceSummary.totalWorkingHours,
      totalOvertimeHours: attendanceSummary.totalOvertimeHours,
      attendancePercentage: attendanceSummary.attendancePercentage,
      user: {
        id: users.id,
        fullName: users.fullName,
        employeeCode: users.employeeCode,
        department: users.department,
        departmentId: users.departmentId
      }
    })
    .from(attendanceSummary)
    .leftJoin(users, eq(attendanceSummary.userId, users.id))
    .where(and(...filters))
    .orderBy(desc(attendanceSummary.attendancePercentage));

    // Filter by department if provided
    let filteredSummaries = summaries;
    if (departmentId) {
      filteredSummaries = summaries.filter(s => 
        s.user.departmentId === parseInt(departmentId)
      );
    }

    // Calculate monthly aggregates
    const monthlyStats = {
      totalEmployees: filteredSummaries.length,
      avgAttendancePercentage: filteredSummaries.length > 0
        ? (filteredSummaries.reduce((sum, s) => 
            sum + parseFloat(s.attendancePercentage), 0) / filteredSummaries.length).toFixed(2)
        : 0,
      totalPresentDays: filteredSummaries.reduce((sum, s) => sum + s.presentDays, 0),
      totalAbsentDays: filteredSummaries.reduce((sum, s) => sum + s.absentDays, 0),
      totalLateDays: filteredSummaries.reduce((sum, s) => sum + s.lateDays, 0),
      totalLeaveDays: filteredSummaries.reduce((sum, s) => sum + s.leaveDays, 0),
      totalWorkingHours: filteredSummaries.reduce((sum, s) => sum + s.totalWorkingHours, 0),
      totalOvertimeHours: filteredSummaries.reduce((sum, s) => sum + s.totalOvertimeHours, 0),
      perfectAttendance: filteredSummaries.filter(s => 
        s.attendancePercentage >= 100
      ).length,
      lowAttendance: filteredSummaries.filter(s => 
        s.attendancePercentage < 75
      ).length
    };

    // Get department-wise breakdown
    const deptBreakdown = {};
    filteredSummaries.forEach(s => {
      const dept = s.user.department || 'Unassigned';
      if (!deptBreakdown[dept]) {
        deptBreakdown[dept] = {
          department: dept,
          employeeCount: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          avgAttendance: 0
        };
      }
      deptBreakdown[dept].employeeCount++;
      deptBreakdown[dept].totalPresent += s.presentDays;
      deptBreakdown[dept].totalAbsent += s.absentDays;
      deptBreakdown[dept].totalLate += s.lateDays;
      deptBreakdown[dept].avgAttendance += parseFloat(s.attendancePercentage);
    });

    // Calculate averages
    Object.keys(deptBreakdown).forEach(dept => {
      deptBreakdown[dept].avgAttendance = 
        (deptBreakdown[dept].avgAttendance / deptBreakdown[dept].employeeCount).toFixed(2);
    });

    res.json({
      message: "Monthly attendance report retrieved successfully",
      month: targetMonth,
      year: targetYear,
      monthlyStats,
      departmentBreakdown: Object.values(deptBreakdown),
      employeeSummaries: filteredSummaries.map(s => ({
        employeeId: s.userId,
        fullName: s.user.fullName,
        employeeCode: s.user.employeeCode,
        department: s.user.department,
        presentDays: s.presentDays,
        absentDays: s.absentDays,
        lateDays: s.lateDays,
        leaveDays: s.leaveDays,
        workingHours: Math.floor(s.totalWorkingHours / 60) + 'h ' + (s.totalWorkingHours % 60) + 'm',
        overtimeHours: Math.floor(s.totalOvertimeHours / 60) + 'h ' + (s.totalOvertimeHours % 60) + 'm',
        attendancePercentage: s.attendancePercentage
      }))
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error generating monthly report"
    });
  }
};

// Get Employee-wise Detailed Report
export const getEmployeeWiseReport = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const userId = parseInt(employeeId);

    // Get employee info
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Build date filters
    let dateFilters = [eq(attendanceRecords.userId, userId)];
    
    if (startDate && endDate) {
      dateFilters.push(gte(attendanceRecords.date, new Date(startDate)));
      dateFilters.push(lte(attendanceRecords.date, new Date(endDate)));
    }

    // Get all attendance records
    const records = await db.select()
      .from(attendanceRecords)
      .where(and(...dateFilters))
      .orderBy(desc(attendanceRecords.date));

    // Calculate statistics
    const stats = {
      totalDays: records.length,
      presentDays: records.filter(r => r.status === 'present' || r.status === 'late').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      lateDays: records.filter(r => r.isLate).length,
      halfDays: records.filter(r => r.status === 'half_day').length,
      leaveDays: records.filter(r => r.status === 'on_leave').length,
      earlyDepartures: records.filter(r => r.isEarlyDeparture).length,
      totalWorkingMinutes: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
      totalOvertimeMinutes: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
      avgWorkingHoursPerDay: 0,
      attendancePercentage: 0
    };

    if (stats.presentDays > 0) {
      stats.avgWorkingHoursPerDay = Math.floor(stats.totalWorkingMinutes / stats.presentDays);
    }

    if (stats.totalDays > 0) {
      stats.attendancePercentage = ((stats.presentDays / stats.totalDays) * 100).toFixed(2);
    }

    // Get alerts for this employee
    const alerts = await db.select()
      .from(attendanceAlerts)
      .where(and(
        eq(attendanceAlerts.userId, userId),
        eq(attendanceAlerts.isResolved, false)
      ))
      .orderBy(desc(attendanceAlerts.createdAt))
      .limit(10);

    // Get overtime records
    const overtime = await db.select()
      .from(overtimeTracking)
      .where(eq(overtimeTracking.userId, userId))
      .orderBy(desc(overtimeTracking.date))
      .limit(20);

    // Format working hours
    const formatMinutes = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };

    res.json({
      message: "Employee attendance report retrieved successfully",
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        department: employee.department,
        jobTitle: employee.jobTitle,
        email: employee.email
      },
      period: startDate && endDate ? { startDate, endDate } : "All time",
      statistics: {
        ...stats,
        totalWorkingHours: formatMinutes(stats.totalWorkingMinutes),
        totalOvertimeHours: formatMinutes(stats.totalOvertimeMinutes),
        avgWorkingHours: formatMinutes(stats.avgWorkingHoursPerDay)
      },
      attendanceRecords: records.map(r => ({
        id: r.id,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        workingHours: formatMinutes(r.workingHours || 0),
        status: r.status,
        isLate: r.isLate,
        lateMinutes: r.lateMinutes,
        isEarlyDeparture: r.isEarlyDeparture,
        earlyDepartureMinutes: r.earlyDepartureMinutes,
        overtimeMinutes: r.overtimeMinutes,
        location: r.location,
        notes: r.notes
      })),
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.alertType,
        date: a.alertDate,
        severity: a.severity,
        message: a.message,
        isRead: a.isRead
      })),
      overtimeRecords: overtime.map(o => ({
        date: o.date,
        minutes: o.overtimeMinutes,
        hours: formatMinutes(o.overtimeMinutes),
        isApproved: o.isApproved,
        remarks: o.remarks
      }))
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error generating employee report"
    });
  }
};

// Get Department-wise Report
export const getDepartmentWiseReport = async (req, res) => {
  try {
    const { month, year, date } = req.query;

    let reportData = [];

    if (date) {
      // Daily department report
      const reportDate = new Date(date);
      reportDate.setHours(0, 0, 0, 0);

      reportData = await db.select()
        .from(departmentAttendanceReports)
        .where(eq(departmentAttendanceReports.reportDate, reportDate));

    } else if (month && year) {
      // Monthly department report
      const targetMonth = parseInt(month);
      const targetYear = parseInt(year);

      const start = new Date(targetYear, targetMonth - 1, 1);
      const end = new Date(targetYear, targetMonth, 0);

      // Get all departments
      const depts = await db.select().from(departments);

      for (const dept of depts) {
        // Get all employees in this department
        const employees = await db.select()
          .from(users)
          .where(and(
            eq(users.departmentId, dept.id),
            eq(users.active, true)
          ));

        const userIds = employees.map(e => e.id);

        if (userIds.length === 0) continue;

        // Get attendance summaries
        const summaries = await db.select()
          .from(attendanceSummary)
          .where(and(
            inArray(attendanceSummary.userId, userIds),
            eq(attendanceSummary.month, targetMonth),
            eq(attendanceSummary.year, targetYear)
          ));

        const stats = {
          departmentId: dept.id,
          departmentName: dept.departmentName,
          totalEmployees: employees.length,
          presentDays: summaries.reduce((sum, s) => sum + s.presentDays, 0),
          absentDays: summaries.reduce((sum, s) => sum + s.absentDays, 0),
          lateDays: summaries.reduce((sum, s) => sum + s.lateDays, 0),
          avgAttendancePercentage: summaries.length > 0
            ? (summaries.reduce((sum, s) => sum + s.attendancePercentage, 0) / summaries.length).toFixed(2)
            : 0
        };

        reportData.push(stats);
      }
    }

    // Get departments data for enrichment
    const deptData = await db.select().from(departments);
    const deptMap = {};
    deptData.forEach(d => {
      deptMap[d.id] = d.departmentName;
    });

    const enrichedData = reportData.map(r => ({
      ...r,
      departmentName: r.departmentName || deptMap[r.departmentId] || 'Unknown'
    }));

    res.json({
      message: "Department-wise report retrieved successfully",
      period: date ? `Daily - ${date}` : `Monthly - ${month}/${year}`,
      departments: enrichedData,
      count: enrichedData.length
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error generating department report"
    });
  }
};

// Get Attendance Trends (for charts/graphs)
export const getAttendanceTrends = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, departmentId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "Start date and end date are required" 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get daily reports for the period
    const dailyReports = await db.select()
      .from(dailyAttendanceReports)
      .where(and(
        gte(dailyAttendanceReports.reportDate, start),
        lte(dailyAttendanceReports.reportDate, end)
      ))
      .orderBy(dailyAttendanceReports.reportDate);

    // Format for charts
    const trendData = dailyReports.map(r => ({
      date: r.reportDate.toISOString().split('T')[0],
      present: r.presentCount,
      absent: r.absentCount,
      late: r.lateCount,
      onLeave: r.onLeaveCount,
      attendancePercentage: parseFloat(r.attendancePercentage)
    }));

    res.json({
      message: "Attendance trends retrieved successfully",
      period: { startDate: start, endDate: end },
      trends: trendData
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error generating trends"
    });
  }
};

// Export attendance data (CSV format data)
export const exportAttendanceData = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, departmentId, format } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "Start date and end date are required" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let filters = [
      gte(attendanceRecords.date, start),
      lte(attendanceRecords.date, end)
    ];

    if (employeeId) {
      filters.push(eq(attendanceRecords.userId, parseInt(employeeId)));
    }

    const records = await db.select({
      employeeCode: users.employeeCode,
      fullName: users.fullName,
      department: users.department,
      date: attendanceRecords.date,
      checkIn: attendanceRecords.checkIn,
      checkOut: attendanceRecords.checkOut,
      workingHours: attendanceRecords.workingHours,
      status: attendanceRecords.status,
      isLate: attendanceRecords.isLate,
      lateMinutes: attendanceRecords.lateMinutes,
      overtimeMinutes: attendanceRecords.overtimeMinutes,
      location: attendanceRecords.location,
      notes: attendanceRecords.notes
    })
    .from(attendanceRecords)
    .leftJoin(users, eq(attendanceRecords.userId, users.id))
    .where(and(...filters))
    .orderBy(attendanceRecords.date, users.fullName);

    // Filter by department if needed
    let filteredRecords = records;
    if (departmentId) {
      filteredRecords = records.filter(r => 
        r.department === departmentId
      );
    }

    // Format for export
    const exportData = filteredRecords.map(r => ({
      'Employee Code': r.employeeCode,
      'Employee Name': r.fullName,
      'Department': r.department || 'N/A',
      'Date': r.date?.toISOString().split('T')[0],
      'Check In': r.checkIn?.toLocaleTimeString() || 'N/A',
      'Check Out': r.checkOut?.toLocaleTimeString() || 'N/A',
      'Working Hours': r.workingHours ? `${Math.floor(r.workingHours / 60)}h ${r.workingHours % 60}m` : 'N/A',
      'Status': r.status,
      'Late': r.isLate ? 'Yes' : 'No',
      'Late Minutes': r.lateMinutes || 0,
      'Overtime Minutes': r.overtimeMinutes || 0,
      'Location': r.location || 'N/A',
      'Notes': r.notes || ''
    }));

    res.json({
      message: "Attendance data exported successfully",
      period: { startDate: start, endDate: end },
      totalRecords: exportData.length,
      data: exportData
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Error exporting data"
    });
  }
};

export default {
  generateDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getEmployeeWiseReport,
  getDepartmentWiseReport,
  getAttendanceTrends,
  exportAttendanceData
};
