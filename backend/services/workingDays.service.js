import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { daysWorking, organizations } from '../db/schema.js';

/**
 * Working Days Service
 * Centralized business logic for working days operations
 * Used by admin, manager, and employee controllers
 */

/**
 * Get all working days for organization
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Array>}
 */
export const getAllWorkingDays = async (organizationId = null) => {
  let query = db.select({
    id: daysWorking.id,
    day: daysWorking.day,
    startingHour: daysWorking.startingHour,
    endingHour: daysWorking.endingHour,
    isActive: daysWorking.isActive,
    breakStartTime: daysWorking.breakStartTime,
    breakEndTime: daysWorking.breakEndTime,
    totalWorkingHours: daysWorking.totalWorkingHours,
    organizationId: daysWorking.organizationId,
    organization: {
      id: organizations.id,
      name: organizations.name
    }
  })
  .from(daysWorking)
  .leftJoin(organizations, eq(daysWorking.organizationId, organizations.id));

  if (organizationId) {
    query = query.where(eq(daysWorking.organizationId, organizationId));
  }

  const result = await query.orderBy(daysWorking.day);
  return result;
};

/**
 * Get only active working days
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Array>}
 */
export const getActiveWorkingDays = async (organizationId = null) => {
  const allDays = await getAllWorkingDays(organizationId);
  return allDays.filter(day => day.isActive);
};

/**
 * Get single working day by ID
 * @param {number} workingDayId - Working day ID
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Object|null>}
 */
export const getWorkingDayById = async (workingDayId, organizationId = null) => {
  let conditions = [eq(daysWorking.id, workingDayId)];
  
  if (organizationId) {
    conditions.push(eq(daysWorking.organizationId, organizationId));
  }

  const result = await db.select({
    id: daysWorking.id,
    day: daysWorking.day,
    startingHour: daysWorking.startingHour,
    endingHour: daysWorking.endingHour,
    isActive: daysWorking.isActive,
    breakStartTime: daysWorking.breakStartTime,
    breakEndTime: daysWorking.breakEndTime,
    totalWorkingHours: daysWorking.totalWorkingHours,
    organizationId: daysWorking.organizationId,
    organization: {
      id: organizations.id,
      name: organizations.name
    }
  })
  .from(daysWorking)
  .leftJoin(organizations, eq(daysWorking.organizationId, organizations.id))
  .where(conditions.length > 1 ? and(...conditions) : conditions[0])
  .limit(1);

  return result.length > 0 ? result[0] : null;
};

/**
 * Get working day by day name
 * @param {string} dayName - Day name (e.g., 'Monday')
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Object|null>}
 */
export const getWorkingDayByDayName = async (dayName, organizationId = null) => {
  let conditions = [eq(daysWorking.day, dayName)];
  
  if (organizationId) {
    conditions.push(eq(daysWorking.organizationId, organizationId));
  }

  const result = await db.select({
    id: daysWorking.id,
    day: daysWorking.day,
    startingHour: daysWorking.startingHour,
    endingHour: daysWorking.endingHour,
    isActive: daysWorking.isActive,
    breakStartTime: daysWorking.breakStartTime,
    breakEndTime: daysWorking.breakEndTime,
    totalWorkingHours: daysWorking.totalWorkingHours,
    organizationId: daysWorking.organizationId,
    organization: {
      id: organizations.id,
      name: organizations.name
    }
  })
  .from(daysWorking)
  .leftJoin(organizations, eq(daysWorking.organizationId, organizations.id))
  .where(conditions.length > 1 ? and(...conditions) : conditions[0])
  .limit(1);

  return result.length > 0 ? result[0] : null;
};

/**
 * Get today's working hours
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Object|null>}
 */
export const getTodayWorkingHours = async (organizationId = null) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  return await getWorkingDayByDayName(today, organizationId);
};

/**
 * Get weekly schedule
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Object>} Weekly schedule with working hours
 */
export const getWeeklySchedule = async (organizationId = null) => {
  const allDays = await getAllWorkingDays(organizationId);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule = {};
  
  daysOfWeek.forEach(dayName => {
    const dayData = allDays.find(d => d.day === dayName);
    schedule[dayName] = dayData || {
      day: dayName,
      isActive: false,
      startingHour: null,
      endingHour: null,
      totalWorkingHours: 0
    };
  });
  
  const totalWeeklyHours = allDays
    .filter(d => d.isActive)
    .reduce((sum, d) => sum + (d.totalWorkingHours || 0), 0);
  
  const activeDaysCount = allDays.filter(d => d.isActive).length;
  
  return {
    schedule,
    totalWeeklyHours,
    activeDaysCount,
    weekStartsOn: 'Monday'
  };
};

/**
 * Get working days statistics
 * @param {number} organizationId - Optional organization filter
 * @returns {Promise<Object>}
 */
export const getWorkingDaysStatistics = async (organizationId = null) => {
  const allDays = await getAllWorkingDays(organizationId);
  
  const activeDays = allDays.filter(d => d.isActive);
  const inactiveDays = allDays.filter(d => !d.isActive);
  
  const totalWeeklyHours = activeDays.reduce((sum, d) => sum + (d.totalWorkingHours || 0), 0);
  const averageWorkingHoursPerDay = activeDays.length > 0 ? totalWeeklyHours / activeDays.length : 0;
  
  return {
    totalDays: allDays.length,
    activeDaysCount: activeDays.length,
    inactiveDaysCount: inactiveDays.length,
    totalWeeklyHours,
    averageWorkingHoursPerDay: Math.round(averageWorkingHoursPerDay * 100) / 100,
    activeDays: activeDays.map(d => d.day),
    inactiveDays: inactiveDays.map(d => d.day)
  };
};

/**
 * Create a new working day (admin only)
 * @param {Object} workingDayData - Working day data
 * @returns {Promise<Object>}
 */
export const createWorkingDay = async (workingDayData) => {
  const result = await db.insert(daysWorking)
    .values(workingDayData)
    .returning();
  
  return result[0];
};

/**
 * Update a working day (admin only)
 * @param {number} workingDayId - Working day ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>}
 */
export const updateWorkingDay = async (workingDayId, updateData) => {
  const existing = await getWorkingDayById(workingDayId);
  
  if (!existing) {
    throw new Error(`Working day with id=${workingDayId} not found`);
  }

  const result = await db.update(daysWorking)
    .set(updateData)
    .where(eq(daysWorking.id, workingDayId))
    .returning();
  
  return result[0];
};

/**
 * Delete a working day (admin only)
 * @param {number} workingDayId - Working day ID
 * @returns {Promise<boolean>}
 */
export const deleteWorkingDay = async (workingDayId) => {
  const existing = await getWorkingDayById(workingDayId);
  
  if (!existing) {
    throw new Error(`Working day with id=${workingDayId} not found`);
  }

  await db.delete(daysWorking)
    .where(eq(daysWorking.id, workingDayId));
  
  return true;
};
