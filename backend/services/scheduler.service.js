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
    return;
  }

  // Run backfill IMMEDIATELY on startup to fill all missing historical records
  try {
    await backfillAllMissingAttendance();
  } catch (error) {
    // Silent fail
  }

  // Run DAILY at 2:00 AM to backfill any missing attendance from previous days
  cron.schedule('0 2 * * *', async () => {
    try {
      await backfillAllMissingAttendance();
    } catch (error) {
      // Silent fail
    }
  });

  // Run daily at 1:00 AM to auto-mark attendance for previous day
  cron.schedule('0 1 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await autoMarkAttendance(yesterday);
    } catch (error) {
      // Silent fail
    }
  });

  // Run at midnight to auto-mark for the day that just ended
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await autoMarkAttendance(today);
    } catch (error) {
      // Silent fail
    }
  });

  isSchedulerRunning = true;
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduler = () => {
  isSchedulerRunning = false;
};

/**
 * Manual trigger for auto-attendance (for testing/admin use)
 * @param {Date} targetDate - Date to process
 * @returns {Promise<Object>}
 */
export const triggerAutoAttendance = async (targetDate = null) => {
  return await autoMarkAttendance(targetDate);
};
