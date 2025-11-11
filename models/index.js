
// This file serves as the main entry point for database models
// It exports the Drizzle database instance and schema for use throughout the application
// Provides backward compatibility with previous ORM-style imports

import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

// Export the database instance
export { db };

// Export all schema tables for direct access
export const {
  departments,
  departmentAnnouncements,
  users,
  jobs,
  personalInformation,
  financialInformation,
  expenses,
  payments,
  daysHoliday,
  daysWorking,
  personalEvents,
  messages,
  applications,
  salaryRecords,
  overtimeRecords,
  notifications
} = schema;

// Create db object for backward compatibility
const database = {
  db,
  ...schema
};

export default database;
