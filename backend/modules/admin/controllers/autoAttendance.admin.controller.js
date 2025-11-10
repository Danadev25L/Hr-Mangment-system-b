import { autoMarkAttendance, autoMarkAttendanceRange, backfillAllMissingAttendance } from '../../../services/autoAttendance.service.js';
import { triggerAutoAttendance } from '../../../services/scheduler.service.js';

/**
 * Auto Attendance Controller
 * Admin endpoints for managing automatic attendance marking
 */

/**
 * Manually trigger auto-attendance for a specific date
 * POST /api/admin/auto-attendance/trigger
 */
export const triggerAutoAttendanceManual = async (req, res) => {
  try {
    const { date } = req.body;

    let targetDate = null;
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid date format' 
        });
      }
    }

    const result = await triggerAutoAttendance(targetDate);

    return res.status(200).json({
      success: true,
      message: 'Auto-attendance triggered successfully',
      data: result
    });

  } catch (error) {
    console.error('Error triggering auto-attendance:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to trigger auto-attendance',
      error: error.message 
    });
  }
};

/**
 * Trigger auto-attendance for a date range
 * POST /api/admin/auto-attendance/trigger-range
 */
export const triggerAutoAttendanceRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Both startDate and endDate are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format' 
      });
    }

    if (start > end) {
      return res.status(400).json({ 
        success: false,
        message: 'Start date must be before end date' 
      });
    }

    // Limit to 31 days to prevent overload
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 31) {
      return res.status(400).json({ 
        success: false,
        message: 'Date range cannot exceed 31 days' 
      });
    }

    const results = await autoMarkAttendanceRange(start, end);

    const summary = {
      totalDays: results.length,
      totalProcessed: results.reduce((sum, r) => sum + r.processed, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      totalAlreadyExists: results.reduce((sum, r) => sum + r.alreadyExists, 0),
      dailyResults: results
    };

    return res.status(200).json({
      success: true,
      message: 'Auto-attendance range processing completed',
      data: summary
    });

  } catch (error) {
    console.error('Error triggering auto-attendance range:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to trigger auto-attendance range',
      error: error.message 
    });
  }
};

/**
 * Get auto-attendance status/info
 * GET /api/admin/auto-attendance/status
 */
export const getAutoAttendanceStatus = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        enabled: true,
        schedule: {
          daily: {
            time: '01:00 AM',
            description: 'Auto-marks attendance for previous day'
          },
          endOfDay: {
            time: '12:00 AM (Midnight)',
            description: 'Auto-marks attendance for day that just ended'
          }
        },
        behavior: {
          checksWorkingDays: true,
          skipHolidays: true,
          skipApprovedLeaves: true,
          skipExistingRecords: true,
          marksAsOnTime: true,
          noBreaks: true,
          noLateness: true,
          noEarlyDeparture: true,
          backfillsFromEmploymentStart: true
        },
        notes: [
          'Employees are automatically marked as present on time',
          'Check-in and check-out times match the default shift hours',
          'Only applies to working days (excludes weekends/holidays)',
          'Employees on approved leave are skipped',
          'Existing attendance records are not overwritten',
          'Only creates records for dates after employee creation',
          'Backfill function fills ALL missing historical records'
        ]
      }
    });

  } catch (error) {
    console.error('Error getting auto-attendance status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to get auto-attendance status',
      error: error.message 
    });
  }
};

/**
 * Backfill all missing attendance records
 * POST /api/admin/auto-attendance/backfill
 */
export const backfillMissingAttendance = async (req, res) => {
  try {
    console.log('[Admin] Backfill request received');
    
    const result = await backfillAllMissingAttendance();

    return res.status(200).json({
      success: true,
      message: 'Backfill completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error backfilling attendance:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to backfill attendance',
      error: error.message 
    });
  }
};
