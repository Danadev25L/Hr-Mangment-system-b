import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { daysHoliday } from '../db/schema.js';

/**
 * Holiday Service
 * Centralized business logic for holiday operations
 * Used by admin, manager, and employee controllers
 */

/**
 * Process recurring holidays for display
 * @param {Array} holidays - Raw holiday records from DB
 * @returns {Array} Processed holidays with adjusted dates for recurring ones
 */
export const processRecurringHolidays = (holidays) => {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  const processedHolidays = [];
  
  holidays.forEach(holiday => {
    if (holiday.isRecurring) {
      const holidayDate = new Date(holiday.date);
      const month = holidayDate.getMonth();
      const day = holidayDate.getDate();
      
      const currentYearDate = new Date(currentYear, month, day);
      
      if (currentYearDate >= currentDate || currentYearDate.toDateString() === currentDate.toDateString()) {
        processedHolidays.push({
          ...holiday,
          date: currentYearDate.toISOString(),
          originalDate: holiday.date,
          displayYear: currentYear
        });
      } else {
        const nextYearDate = new Date(currentYear + 1, month, day);
        processedHolidays.push({
          ...holiday,
          date: nextYearDate.toISOString(),
          originalDate: holiday.date,
          displayYear: currentYear + 1
        });
      }
    } else {
      processedHolidays.push(holiday);
    }
  });
  
  processedHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));
  return processedHolidays;
};

/**
 * Get all holidays with recurring dates processed
 * @returns {Promise<Array>}
 */
export const getAllHolidays = async () => {
  const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
  
  return processRecurringHolidays(result);
};

/**
 * Get upcoming holidays from current date
 * @returns {Promise<Array>}
 */
export const getUpcomingHolidays = async () => {
  const currentDate = new Date();
  
  const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
  
  return result.filter(holiday => new Date(holiday.date) >= currentDate);
};

/**
 * Get holidays for a specific month and year
 * @param {number} year - Year to filter
 * @param {number} month - Month to filter (1-12)
 * @returns {Promise<Array>}
 */
export const getHolidaysByMonth = async (year, month) => {
  const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
  
  return result.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getFullYear() === parseInt(year) && 
           holidayDate.getMonth() === parseInt(month) - 1;
  });
};

/**
 * Get a single holiday by ID
 * @param {number} holidayId - Holiday ID
 * @returns {Promise<Object|null>}
 */
export const getHolidayById = async (holidayId) => {
  const result = await db.select()
    .from(daysHoliday)
    .where(eq(daysHoliday.id, holidayId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
};

/**
 * Check if today is a holiday
 * @returns {Promise<Object>} Object with isHoliday flag and holiday info
 */
export const getTodayHolidayStatus = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allHolidays = await db.select()
    .from(daysHoliday);
  
  const todayString = today.toISOString().split('T')[0];
  const holidayToday = allHolidays.find(holiday => {
    const holidayDate = new Date(holiday.date);
    const holidayString = holidayDate.toISOString().split('T')[0];
    return holidayString === todayString;
  });
  
  return {
    isHoliday: !!holidayToday,
    holidayInfo: holidayToday || null,
    date: today
  };
};

/**
 * Get the next upcoming holiday
 * @returns {Promise<Object>} Object with next holiday and days until it
 */
export const getNextHoliday = async () => {
  const currentDate = new Date();
  
  const result = await db.select()
    .from(daysHoliday)
    .orderBy(daysHoliday.date);
  
  const upcomingHolidays = result.filter(holiday => new Date(holiday.date) > currentDate);
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
  
  let daysUntilHoliday = null;
  if (nextHoliday) {
    const holidayDate = new Date(nextHoliday.date);
    const timeDiff = holidayDate.getTime() - currentDate.getTime();
    daysUntilHoliday = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  return {
    nextHoliday,
    daysUntilHoliday
  };
};

/**
 * Get holiday statistics
 * @returns {Promise<Object>} Holiday statistics including counts and monthly breakdown
 */
export const getHolidayStatistics = async () => {
  const currentDate = new Date();
  const allHolidays = await db.select()
    .from(daysHoliday);

  const totalHolidays = allHolidays.length;
  const upcomingHolidays = allHolidays.filter(holiday => new Date(holiday.date) >= currentDate).length;
  const pastHolidays = totalHolidays - upcomingHolidays;
  const recurringHolidays = allHolidays.filter(holiday => holiday.isRecurring).length;

  const currentYear = currentDate.getFullYear();
  const holidaysByMonth = Array(12).fill(0);
  
  allHolidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date);
    if (holidayDate.getFullYear() === currentYear) {
      holidaysByMonth[holidayDate.getMonth()]++;
    }
  });

  return {
    summary: {
      totalHolidays,
      upcomingHolidays,
      pastHolidays,
      recurringHolidays
    },
    holidaysByMonth,
    currentYear,
    generatedAt: new Date()
  };
};

/**
 * Create a new holiday (admin/manager)
 * @param {Object} holidayData - Holiday data
 * @returns {Promise<Object>} Created holiday
 */
export const createHoliday = async (holidayData) => {
  const { date, name, description, isRecurring } = holidayData;
  
  // Check if holiday already exists
  const existingHoliday = await db.select()
    .from(daysHoliday)
    .where(eq(daysHoliday.date, new Date(date)))
    .limit(1);

  if (existingHoliday.length > 0) {
    throw new Error('Holiday already exists for this date');
  }

  const result = await db.insert(daysHoliday)
    .values({
      date: new Date(date),
      name: name?.trim() || 'Holiday',
      description: description?.trim() || '',
      isRecurring: isRecurring || false,
      createdAt: new Date()
    })
    .returning();
  
  return result[0];
};

/**
 * Update a holiday (admin only)
 * @param {number} holidayId - Holiday ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated holiday
 */
export const updateHoliday = async (holidayId, updateData) => {
  const holiday = await getHolidayById(holidayId);
  
  if (!holiday) {
    throw new Error(`Holiday with id=${holidayId} not found`);
  }

  const result = await db.update(daysHoliday)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(daysHoliday.id, holidayId))
    .returning();
  
  return result[0];
};

/**
 * Delete a holiday (admin only)
 * @param {number} holidayId - Holiday ID
 * @returns {Promise<boolean>}
 */
export const deleteHoliday = async (holidayId) => {
  const holiday = await getHolidayById(holidayId);
  
  if (!holiday) {
    throw new Error(`Holiday with id=${holidayId} not found`);
  }

  await db.delete(daysHoliday)
    .where(eq(daysHoliday.id, holidayId));
  
  return true;
};

/**
 * Suggest a holiday (manager feature)
 * @param {Object} suggestionData - Suggestion data including manager info
 * @returns {Promise<Object>} Created suggestion
 */
export const suggestHoliday = async (suggestionData) => {
  const { date, name, description, isRecurring, suggestedBy } = suggestionData;
  
  const existingHoliday = await db.select()
    .from(daysHoliday)
    .where(eq(daysHoliday.date, new Date(date)))
    .limit(1);

  if (existingHoliday.length > 0) {
    throw new Error('Holiday already exists for this date');
  }

  const result = await db.insert(daysHoliday)
    .values({
      date: new Date(date),
      name: name?.trim() || 'Holiday Suggestion',
      description: `Suggested by Manager: ${description?.trim() || 'No description provided'}`,
      isRecurring: isRecurring || false,
      createdAt: new Date()
    })
    .returning();
  
  return result[0];
};
