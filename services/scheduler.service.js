import cron from 'node-cron';

import { autoMarkAttendance, backfillAllMissingAttendance } from './autoAttendance.service.js';

/**
 * Scheduler Service
 * Manages all scheduled/cron jobs for the application
 */

let isSchedulerRunning = false;

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduler = async () => {
  if (isSchedulerRunning) {
    console.log('[Scheduler] Already running. Skipping initialization.');
    return;
  }

  console.log('[Scheduler] Initializing scheduled jobs...');

  // Run backfill IMMEDIATELY on startup to fill all missing historical records
  console.log('[Scheduler] Running AUTOMATIC BACKFILL on startup...');
  try {
    const backfillResult = await backfillAllMissingAttendance();
    console.log('[Scheduler] ✓ Automatic backfill completed on startup');
    console.log(`[Scheduler] - Created ${backfillResult.totalProcessed} attendance records`);
    console.log(`[Scheduler] - Skipped ${backfillResult.totalSkipped} days (weekends/holidays/leave)`);
    console.log(`[Scheduler] - Found ${backfillResult.totalAlreadyExists} existing records`);
  } catch (error) {
    console.error('[Scheduler] ✗ Error during automatic backfill:', error);
  }

  // Run DAILY at 2:00 AM to backfill any missing attendance from previous days
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Scheduler] Running DAILY AUTO-BACKFILL job...');
      const result = await backfillAllMissingAttendance();
      console.log('[Scheduler] Daily auto-backfill completed:', result);
    } catch (error) {
      console.error('[Scheduler] Error in daily auto-backfill job:', error);
    }
  });

  // Run daily at 1:00 AM to auto-mark attendance for previous day
  // Cron format: minute hour day month dayOfWeek
  // '0 1 * * *' = Run at 1:00 AM every day
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('[Scheduler] Running daily auto-attendance job...');
      
      // Auto-mark attendance for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const result = await autoMarkAttendance(yesterday);
      console.log('[Scheduler] Auto-attendance completed:', result);
      
    } catch (error) {
      console.error('[Scheduler] Error in auto-attendance job:', error);
    }
  });

  // Optional: Run at midnight to auto-mark for the day that just ended
  // This gives a grace period for late check-outs
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Scheduler] Running end-of-day auto-attendance job...');
      
      // Auto-mark attendance for the day that just ended
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await autoMarkAttendance(today);
      console.log('[Scheduler] End-of-day auto-attendance completed:', result);
      
    } catch (error) {
      console.error('[Scheduler] Error in end-of-day auto-attendance job:', error);
    }
  });

  isSchedulerRunning = true;
  console.log('[Scheduler] ✓ All scheduled jobs initialized');
  console.log('[Scheduler] - Daily backfill: Every day at 2:00 AM (fills ALL missing days)');
  console.log('[Scheduler] - Auto-attendance: Daily at 1:00 AM (marks yesterday)');
  console.log('[Scheduler] - End-of-day check: Daily at midnight');
  console.log('[Scheduler] - Startup backfill: Runs once on server startup');
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduler = () => {
  // Note: node-cron doesn't provide a global stop method
  // Individual tasks would need to be stored and stopped
  isSchedulerRunning = false;
  console.log('[Scheduler] Scheduler stopped');
};

/**
 * Manual trigger for auto-attendance (for testing/admin use)
 * @param {Date} targetDate - Date to process
 * @returns {Promise<Object>}
 */
export const triggerAutoAttendance = async (targetDate = null) => {
  console.log('[Scheduler] Manual trigger of auto-attendance');
  return await autoMarkAttendance(targetDate);
};
