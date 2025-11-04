import { pgTable, serial, varchar, text, timestamp, integer, boolean, unique, decimal, time, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


// Department table schema
export const departments = pgTable('department', {
  id: serial('id').primaryKey(),
  departmentName: varchar('department_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true)
});

// Department Announcement table schema
export const departmentAnnouncements = pgTable('department_announcement', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  createdBy: integer('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Announcement Recipients table schema
export const announcementRecipients = pgTable('announcement_recipients', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id').references(() => departmentAnnouncements.id),
  userId: integer('user_id').references(() => users.id),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Users table schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(), // Unique employee code (EMP-0001, MGR-0001, ADM-0001)
  jobTitle: varchar('job_title', { length: 255 }), // Employee's current job title
  role: varchar('role', { length: 50 }).notNull().default('ROLE_EMPLOYEE'),
  active: boolean('active').default(true),
  departmentId: integer('department_id').references(() => departments.id),
  jobId: integer('job_id').references(() => jobs.id),
  baseSalary: integer('base_salary').default(0), // Monthly base salary
  department: varchar('department', { length: 255 }), // Department name for easy access

  // Employment Details
  startDate: timestamp('start_date').notNull(), // Employment start date
  endDate: timestamp('end_date'), // Employment end date (for contractors/terminated employees)
  employmentType: varchar('employment_type', { length: 100 }).default('Full-time'), // Employment type
  workLocation: varchar('work_location', { length: 255 }).default('Office'), // Work location
  probationEnd: timestamp('probation_end'), // Probation end date

  
  // Professional Details
  skills: text('skills'), // Professional skills
  experience: text('experience'), // Work experience

  // Contact Information
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),

  // Personal Information
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 50 }),
  maritalStatus: varchar('marital_status', { length: 50 }),
  emergencyContact: varchar('emergency_contact', { length: 255 }),
  emergencyPhone: varchar('emergency_phone', { length: 50 }),

  // System Fields
  lastLogin: timestamp('last_login'),
  updatedBy: integer('updated_by').references(() => users.id), // Track who last updated this record
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Jobs table schema
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  jobTitle: varchar('job_title', { length: 255 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  userId: integer('user_id').references(() => users.id),
  description: text('description'),
  requirements: text('requirements'),
  location: varchar('location', { length: 255 }).default('Remote'),
  employmentType: varchar('employment_type', { length: 100 }).default('Full-time'),
  isActive: boolean('is_active').default(true),
  departmentId: integer('department_id').references(() => departments.id),
  salary: integer('salary'),
  createdBy: integer('created_by').references(() => users.id),
  externalPostingUrl: text('external_posting_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Personal Information table schema
export const personalInformation = pgTable('personal_information', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 50 }),
  maritalStatus: varchar('marital_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Expenses table schema
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  departmentId: integer('department_id').references(() => departments.id), // NULL allowed for company-wide expenses
  itemName: varchar('item_name', { length: 255 }),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  date: timestamp('date').notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: integer('rejected_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  paidBy: integer('paid_by').references(() => users.id),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Payments table schema
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Public Holidays table schema (company-wide holidays)
export const daysHoliday = pgTable('days_holiday', {
  id: serial('id').primaryKey(),
  date: timestamp('date', { mode: 'string' }).notNull(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  isRecurring: boolean('is_recurring').default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow()
});

// Employee Leave Requests table schema (renamed to avoid confusion)
export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Days Working table schema
export const daysWorking = pgTable('days_working', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: timestamp('date').notNull(),
  hoursWorked: integer('hours_worked').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Personal Events table schema
export const personalEvents = pgTable('personal_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Messages table schema
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  fromUserId: integer('from_user_id').references(() => users.id).notNull(),
  toUserId: integer('to_user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Applications table schema
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  jobId: integer('job_id').references(() => jobs.id),
  title: varchar('title', { length: 255 }).notNull(), // Application title
  reason: text('reason'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  applicationType: varchar('application_type', { length: 50 }),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, urgent
  status: varchar('status', { length: 50 }).default('pending'), // pending, approved, rejected
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: integer('rejected_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  adminAction: boolean('admin_action').default(false), // Track if action was taken by admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Job Applications table schema (for external job applications)
export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  applicantName: varchar('applicant_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  coverLetter: text('cover_letter'),
  experience: text('experience'),
  education: text('education'),
  skills: text('skills'),
  resumeUrl: text('resume_url'),
  status: varchar('status', { length: 50 }).default('pending'),
  reviewNotes: text('review_notes'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    uniqueJobEmail: unique().on(table.jobId, table.email)
  }
});

// Notifications table schema
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'announcement', 'application', 'salary', 'leave', etc.
  relatedId: integer('related_id'), // ID of related entity (announcement ID, application ID, etc.)
  metadata: jsonb('metadata'), // Additional context data for the notification
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow()
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  announcements: many(departmentAnnouncements)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id]
  }),
  currentJob: one(jobs, {
    fields: [users.jobId],
    references: [jobs.id]
  }),
  updater: one(users, {
    fields: [users.updatedBy],
    references: [users.id]
  }),
  jobs: many(jobs),
  personalInformation: one(personalInformation, {
    fields: [users.id],
    references: [personalInformation.userId]
  }),
  expenses: many(expenses),
  payments: many(payments),
  daysHoliday: many(daysHoliday),
  daysWorking: many(daysWorking),
  personalEvents: many(personalEvents),
  sentMessages: many(messages),
  receivedMessages: many(messages),
  applications: many(applications),
  approvedApplications: many(applications),
  notifications: many(notifications),
  createdAnnouncements: many(departmentAnnouncements),
  announcementRecipients: many(announcementRecipients)
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id]
  }),
  department: one(departments, {
    fields: [jobs.departmentId],
    references: [departments.id]
  }),
  creator: one(users, {
    fields: [jobs.createdBy],
    references: [users.id]
  }),
  jobApplications: many(jobApplications)
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, {
    fields: [jobApplications.jobId],
    references: [jobs.id]
  }),
  reviewer: one(users, {
    fields: [jobApplications.reviewedBy],
    references: [users.id]
  })
}));

export const personalInformationRelations = relations(personalInformation, ({ one }) => ({
  user: one(users, {
    fields: [personalInformation.userId],
    references: [users.id]
  })
}));

export const departmentAnnouncementsRelations = relations(departmentAnnouncements, ({ one, many }) => ({
  department: one(departments, {
    fields: [departmentAnnouncements.departmentId],
    references: [departments.id]
  }),
  creator: one(users, {
    fields: [departmentAnnouncements.createdBy],
    references: [users.id]
  }),
  recipients: many(announcementRecipients)
}));

export const announcementRecipientsRelations = relations(announcementRecipients, ({ one }) => ({
  announcement: one(departmentAnnouncements, {
    fields: [announcementRecipients.announcementId],
    references: [departmentAnnouncements.id]
  }),
  user: one(users, {
    fields: [announcementRecipients.userId],
    references: [users.id]
  })
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [applications.approvedBy],
    references: [users.id]
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id]
  }),
  department: one(departments, {
    fields: [expenses.departmentId],
    references: [departments.id]
  })
}));

// Modern Salary Management Schema
export const salaryRecords = pgTable('salary_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  baseSalary: integer('base_salary').notNull(),
  overtimeHours: integer('overtime_hours').default(0),
  overtimeRate: integer('overtime_rate').default(0),
  overtimePay: integer('overtime_pay').default(0),
  grossSalary: integer('gross_salary').notNull(),
  taxDeduction: integer('tax_deduction').default(0),
  netSalary: integer('net_salary').notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, paid
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
  approvedBy: integer('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const overtimeRecords = pgTable('overtime_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: timestamp('date').notNull(),
  hoursWorked: integer('hours_worked').notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Modern Payroll Management Schema
export const payrollRecords = pgTable('payroll_records', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id).notNull(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  baseSalary: integer('base_salary').notNull(),
  overtimeHours: integer('overtime_hours').default(0),
  overtimePay: integer('overtime_pay').default(0),
  bonuses: integer('bonuses').default(0),
  adjustments: integer('adjustments').default(0),
  grossSalary: integer('gross_salary').notNull(),
  taxDeduction: integer('tax_deduction').default(0),
  netSalary: integer('net_salary').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, paid
  createdAt: timestamp('created_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  approvedBy: integer('approved_by').references(() => users.id),
  paidAt: timestamp('paid_at'),
  paidBy: integer('paid_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const payrollAdjustments = pgTable('payroll_adjustments', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // overtime, deduction, allowance, correction
  amount: integer('amount').notNull(),
  hours: integer('hours'), // for overtime adjustments
  reason: text('reason').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const payrollBonuses = pgTable('payroll_bonuses', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations for the new salary system
export const salaryRecordsRelations = relations(salaryRecords, ({ one }) => ({
  user: one(users, {
    fields: [salaryRecords.userId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [salaryRecords.approvedBy],
    references: [users.id]
  })
}));

export const overtimeRecordsRelations = relations(overtimeRecords, ({ one }) => ({
  user: one(users, {
    fields: [overtimeRecords.userId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [overtimeRecords.approvedBy],
    references: [users.id]
  })
}));

// Relations for the new payroll system
export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  employee: one(users, {
    fields: [payrollRecords.employeeId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [payrollRecords.approvedBy],
    references: [users.id]
  }),
  payer: one(users, {
    fields: [payrollRecords.paidBy],
    references: [users.id]
  })
}));

export const payrollAdjustmentsRelations = relations(payrollAdjustments, ({ one }) => ({
  employee: one(users, {
    fields: [payrollAdjustments.employeeId],
    references: [users.id]
  }),
  creator: one(users, {
    fields: [payrollAdjustments.createdBy],
    references: [users.id]
  })
}));

export const payrollBonusesRelations = relations(payrollBonuses, ({ one }) => ({
  employee: one(users, {
    fields: [payrollBonuses.employeeId],
    references: [users.id]
  }),
  creator: one(users, {
    fields: [payrollBonuses.createdBy],
    references: [users.id]
  })
}));

// ==================== ATTENDANCE MANAGEMENT SYSTEM ====================

// Attendance Records table - Daily check-in/check-out records
export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: timestamp('date').notNull(), // Attendance date
  checkIn: timestamp('check_in'), // Check-in timestamp
  checkOut: timestamp('check_out'), // Check-out timestamp
  workingHours: integer('working_hours').default(0), // Total working minutes
  status: varchar('status', { length: 50 }).default('absent'), // present, absent, late, half_day, on_leave, holiday
  isLate: boolean('is_late').default(false), // Late arrival flag
  lateMinutes: integer('late_minutes').default(0), // Minutes late
  isEarlyDeparture: boolean('is_early_departure').default(false), // Early departure flag
  earlyDepartureMinutes: integer('early_departure_minutes').default(0), // Minutes early
  overtimeMinutes: integer('overtime_minutes').default(0), // Overtime minutes
  breakDuration: integer('break_duration').default(0), // Break duration in minutes
  notes: text('notes'), // Additional notes
  location: varchar('location', { length: 255 }), // Check-in location
  ipAddress: varchar('ip_address', { length: 50 }), // IP address for audit
  deviceInfo: text('device_info'), // Device information
  isManualEntry: boolean('is_manual_entry').default(false), // Manual entry flag
  approvedBy: integer('approved_by').references(() => users.id), // For manual entries
  approvedAt: timestamp('approved_at'), // Approval timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Attendance Summary table - Monthly attendance summaries for quick reports
export const attendanceSummary = pgTable('attendance_summary', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(), // Year
  totalWorkingDays: integer('total_working_days').notNull(), // Expected working days
  presentDays: integer('present_days').default(0), // Days present
  absentDays: integer('absent_days').default(0), // Days absent
  lateDays: integer('late_days').default(0), // Days late
  halfDays: integer('half_days').default(0), // Half days
  leaveDays: integer('leave_days').default(0), // Approved leave days
  holidayDays: integer('holiday_days').default(0), // Public holidays
  totalWorkingHours: integer('total_working_hours').default(0), // Total minutes worked
  totalOvertimeHours: integer('total_overtime_hours').default(0), // Total overtime minutes
  attendancePercentage: integer('attendance_percentage').default(0), // Attendance percentage (0-100)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserMonthYear: unique().on(table.userId, table.month, table.year)
}));

// Attendance Corrections table - Correction requests for missed punches
export const attendanceCorrections = pgTable('attendance_corrections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id),
  date: timestamp('date').notNull(), // Correction date
  requestType: varchar('request_type', { length: 50 }).notNull(), // missed_checkin, missed_checkout, wrong_time, forgot_punch
  originalCheckIn: timestamp('original_check_in'), // Original check-in time
  originalCheckOut: timestamp('original_check_out'), // Original check-out time
  requestedCheckIn: timestamp('requested_check_in'), // Requested check-in time
  requestedCheckOut: timestamp('requested_check_out'), // Requested check-out time
  reason: text('reason').notNull(), // Reason for correction
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  reviewedBy: integer('reviewed_by').references(() => users.id), // Manager who reviewed
  reviewedAt: timestamp('reviewed_at'), // Review timestamp
  reviewNotes: text('review_notes'), // Manager's notes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Attendance Relations
export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  user: one(users, {
    fields: [attendanceRecords.userId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [attendanceRecords.approvedBy],
    references: [users.id]
  })
}));

export const attendanceSummaryRelations = relations(attendanceSummary, ({ one }) => ({
  user: one(users, {
    fields: [attendanceSummary.userId],
    references: [users.id]
  })
}));

export const attendanceCorrectionsRelations = relations(attendanceCorrections, ({ one }) => ({
  user: one(users, {
    fields: [attendanceCorrections.userId],
    references: [users.id]
  }),
  attendance: one(attendanceRecords, {
    fields: [attendanceCorrections.attendanceId],
    references: [attendanceRecords.id]
  }),
  reviewer: one(users, {
    fields: [attendanceCorrections.reviewedBy],
    references: [users.id]
  })
}));

// ==================== ADVANCED ATTENDANCE FEATURES ====================

// Work Shifts table
export const workShifts = pgTable('work_shifts', {
  id: serial('id').primaryKey(),
  shiftName: varchar('shift_name', { length: 100 }).notNull(),
  shiftCode: varchar('shift_code', { length: 20 }).notNull().unique(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  gracePeriodMinutes: integer('grace_period_minutes').default(15),
  earlyDepartureThreshold: integer('early_departure_threshold').default(15),
  minimumWorkHours: integer('minimum_work_hours').default(480),
  halfDayThreshold: integer('half_day_threshold').default(240),
  breakDuration: integer('break_duration').default(60),
  isNightShift: boolean('is_night_shift').default(false),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Employee Shift Assignments
export const employeeShifts = pgTable('employee_shifts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  shiftId: integer('shift_id').references(() => workShifts.id, { onDelete: 'cascade' }).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  isActive: boolean('is_active').default(true),
  assignedBy: integer('assigned_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserEffectiveFrom: unique().on(table.userId, table.effectiveFrom)
}));

// Attendance Policies
export const attendancePolicies = pgTable('attendance_policies', {
  id: serial('id').primaryKey(),
  policyName: varchar('policy_name', { length: 255 }).notNull(),
  policyCode: varchar('policy_code', { length: 50 }).notNull().unique(),
  lateMarkAfterMinutes: integer('late_mark_after_minutes').default(15),
  halfDayAfterMinutes: integer('half_day_after_minutes').default(240),
  absentAfterMinutes: integer('absent_after_minutes').default(480),
  allowEarlyCheckinMinutes: integer('allow_early_checkin_minutes').default(60),
  allowLateCheckoutMinutes: integer('allow_late_checkout_minutes').default(120),
  overtimeStartAfterMinutes: integer('overtime_start_after_minutes').default(30),
  maxOvertimePerDay: integer('max_overtime_per_day').default(180),
  requireCheckout: boolean('require_checkout').default(true),
  autoCheckoutAfterHours: integer('auto_checkout_after_hours').default(12),
  enableGeofencing: boolean('enable_geofencing').default(false),
  enableBiometric: boolean('enable_biometric').default(false),
  monthlyAttendanceThreshold: integer('monthly_attendance_threshold').default(75),
  continuousAbsentAlertDays: integer('continuous_absent_alert_days').default(3),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Department Attendance Policies
export const departmentPolicies = pgTable('department_policies', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').references(() => departments.id, { onDelete: 'cascade' }).notNull(),
  policyId: integer('policy_id').references(() => attendancePolicies.id, { onDelete: 'cascade' }).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueDeptEffectiveFrom: unique().on(table.departmentId, table.effectiveFrom)
}));

// Break Types
export const breakTypes = pgTable('break_types', {
  id: serial('id').primaryKey(),
  breakName: varchar('break_name', { length: 100 }).notNull(),
  breakCode: varchar('break_code', { length: 20 }).notNull().unique(),
  durationMinutes: integer('duration_minutes').notNull(),
  isPaid: boolean('is_paid').default(false),
  isMandatory: boolean('is_mandatory').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Attendance Breaks
export const attendanceBreaks = pgTable('attendance_breaks', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }).notNull(),
  breakTypeId: integer('break_type_id').references(() => breakTypes.id),
  breakStart: timestamp('break_start').notNull(),
  breakEnd: timestamp('break_end'),
  durationMinutes: integer('duration_minutes').default(0),
  breakReason: varchar('break_reason', { length: 255 }),
  isApproved: boolean('is_approved').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Geofence Locations
export const geofenceLocations = pgTable('geofence_locations', {
  id: serial('id').primaryKey(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  locationCode: varchar('location_code', { length: 50 }).notNull().unique(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  radiusMeters: integer('radius_meters').default(100),
  address: text('address'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Device Whitelist
export const deviceWhitelist = pgTable('device_whitelist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  deviceName: varchar('device_name', { length: 255 }),
  deviceType: varchar('device_type', { length: 50 }),
  deviceOs: varchar('device_os', { length: 100 }),
  browserInfo: varchar('browser_info', { length: 255 }),
  isApproved: boolean('is_approved').default(false),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  lastUsedAt: timestamp('last_used_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserDevice: unique().on(table.userId, table.deviceId)
}));

// Attendance Location Logs
export const attendanceLocationLogs = pgTable('attendance_location_logs', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }).notNull(),
  logType: varchar('log_type', { length: 20 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  accuracyMeters: decimal('accuracy_meters', { precision: 8, scale: 2 }),
  geofenceId: integer('geofence_id').references(() => geofenceLocations.id),
  isWithinGeofence: boolean('is_within_geofence').default(false),
  ipAddress: varchar('ip_address', { length: 50 }),
  deviceId: varchar('device_id', { length: 255 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Biometric Logs
export const biometricLogs = pgTable('biometric_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }),
  biometricType: varchar('biometric_type', { length: 50 }).notNull(),
  verificationStatus: varchar('verification_status', { length: 20 }).notNull(),
  confidenceScore: integer('confidence_score'),
  deviceSerial: varchar('device_serial', { length: 255 }),
  deviceLocation: varchar('device_location', { length: 255 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Overtime Requests
export const overtimeRequests = pgTable('overtime_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  requestDate: date('request_date').notNull(),
  plannedHours: integer('planned_hours').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  requestedBy: integer('requested_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Overtime Tracking
export const overtimeTracking = pgTable('overtime_tracking', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }).notNull(),
  overtimeRequestId: integer('overtime_request_id').references(() => overtimeRequests.id),
  date: date('date').notNull(),
  overtimeMinutes: integer('overtime_minutes').notNull(),
  overtimeRate: decimal('overtime_rate', { precision: 10, scale: 2 }).default('1.5'),
  isApproved: boolean('is_approved').default(false),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Attendance Alerts
export const attendanceAlerts = pgTable('attendance_alerts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  alertDate: date('alert_date').notNull(),
  severity: varchar('severity', { length: 20 }).default('medium'),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Leave Balances
export const leaveBalances = pgTable('leave_balances', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  totalLeaves: integer('total_leaves').notNull(),
  usedLeaves: integer('used_leaves').default(0),
  remainingLeaves: integer('remaining_leaves').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserLeaveYear: unique().on(table.userId, table.leaveType, table.year)
}));

// Daily Attendance Reports
export const dailyAttendanceReports = pgTable('daily_attendance_reports', {
  id: serial('id').primaryKey(),
  reportDate: date('report_date').notNull().unique(),
  totalEmployees: integer('total_employees').notNull(),
  presentCount: integer('present_count').default(0),
  absentCount: integer('absent_count').default(0),
  lateCount: integer('late_count').default(0),
  onLeaveCount: integer('on_leave_count').default(0),
  halfDayCount: integer('half_day_count').default(0),
  attendancePercentage: decimal('attendance_percentage', { precision: 5, scale: 2 }).default('0'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  generatedBy: integer('generated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Department Attendance Reports
export const departmentAttendanceReports = pgTable('department_attendance_reports', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').references(() => departments.id, { onDelete: 'cascade' }).notNull(),
  reportDate: date('report_date').notNull(),
  totalEmployees: integer('total_employees').notNull(),
  presentCount: integer('present_count').default(0),
  absentCount: integer('absent_count').default(0),
  lateCount: integer('late_count').default(0),
  attendancePercentage: decimal('attendance_percentage', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueDeptDate: unique().on(table.departmentId, table.reportDate)
}));

// Attendance Audit Log
export const attendanceAuditLog = pgTable('attendance_audit_log', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  actionBy: integer('action_by').references(() => users.id).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  reason: text('reason'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ==================== ADVANCED ATTENDANCE RELATIONS ====================

export const workShiftsRelations = relations(workShifts, ({ many }) => ({
  employeeShifts: many(employeeShifts)
}));

export const employeeShiftsRelations = relations(employeeShifts, ({ one }) => ({
  user: one(users, {
    fields: [employeeShifts.userId],
    references: [users.id]
  }),
  shift: one(workShifts, {
    fields: [employeeShifts.shiftId],
    references: [workShifts.id]
  }),
  assignedByUser: one(users, {
    fields: [employeeShifts.assignedBy],
    references: [users.id]
  })
}));

export const attendancePoliciesRelations = relations(attendancePolicies, ({ many }) => ({
  departmentPolicies: many(departmentPolicies)
}));

export const departmentPoliciesRelations = relations(departmentPolicies, ({ one }) => ({
  department: one(departments, {
    fields: [departmentPolicies.departmentId],
    references: [departments.id]
  }),
  policy: one(attendancePolicies, {
    fields: [departmentPolicies.policyId],
    references: [attendancePolicies.id]
  })
}));

export const breakTypesRelations = relations(breakTypes, ({ many }) => ({
  attendanceBreaks: many(attendanceBreaks)
}));

export const attendanceBreaksRelations = relations(attendanceBreaks, ({ one }) => ({
  attendance: one(attendanceRecords, {
    fields: [attendanceBreaks.attendanceId],
    references: [attendanceRecords.id]
  }),
  breakType: one(breakTypes, {
    fields: [attendanceBreaks.breakTypeId],
    references: [breakTypes.id]
  })
}));

export const overtimeRequestsRelations = relations(overtimeRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [overtimeRequests.userId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [overtimeRequests.approvedBy],
    references: [users.id]
  }),
  tracking: many(overtimeTracking)
}));

export const overtimeTrackingRelations = relations(overtimeTracking, ({ one }) => ({
  user: one(users, {
    fields: [overtimeTracking.userId],
    references: [users.id]
  }),
  attendance: one(attendanceRecords, {
    fields: [overtimeTracking.attendanceId],
    references: [attendanceRecords.id]
  }),
  request: one(overtimeRequests, {
    fields: [overtimeTracking.overtimeRequestId],
    references: [overtimeRequests.id]
  }),
  approver: one(users, {
    fields: [overtimeTracking.approvedBy],
    references: [users.id]
  })
}));

export const attendanceAlertsRelations = relations(attendanceAlerts, ({ one }) => ({
  user: one(users, {
    fields: [attendanceAlerts.userId],
    references: [users.id]
  }),
  resolver: one(users, {
    fields: [attendanceAlerts.resolvedBy],
    references: [users.id]
  })
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  user: one(users, {
    fields: [leaveBalances.userId],
    references: [users.id]
  })
}));

// ==================== COMPREHENSIVE SALARY MANAGEMENT SYSTEM ====================

// Salary Components - Define reusable salary components
export const salaryComponents = pgTable('salary_components', {
  id: serial('id').primaryKey(),
  componentName: varchar('component_name', { length: 100 }).notNull(),
  componentType: varchar('component_type', { length: 50 }).notNull(), // bonus, deduction, allowance, adjustment
  description: text('description'),
  isPercentage: boolean('is_percentage').default(false), // If true, amount is percentage of base salary
  defaultAmount: decimal('default_amount', { precision: 10, scale: 2 }).default('0'),
  isTaxable: boolean('is_taxable').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Employee Salary Components - Link employees to salary components
export const employeeSalaryComponents = pgTable('employee_salary_components', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  componentId: integer('component_id').references(() => salaryComponents.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  isRecurring: boolean('is_recurring').default(true), // If true, applies every month
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Monthly Salary Calculations - Final calculated salary for each month
export const monthlySalaries = pgTable('monthly_salaries', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }).notNull(),
  
  // Earnings
  totalBonuses: decimal('total_bonuses', { precision: 10, scale: 2 }).default('0'),
  totalAllowances: decimal('total_allowances', { precision: 10, scale: 2 }).default('0'),
  overtimePay: decimal('overtime_pay', { precision: 10, scale: 2 }).default('0'),
  
  // Deductions
  totalDeductions: decimal('total_deductions', { precision: 10, scale: 2 }).default('0'),
  absenceDeductions: decimal('absence_deductions', { precision: 10, scale: 2 }).default('0'),
  latencyDeductions: decimal('latency_deductions', { precision: 10, scale: 2 }).default('0'),
  taxDeduction: decimal('tax_deduction', { precision: 10, scale: 2 }).default('0'),
  otherDeductions: decimal('other_deductions', { precision: 10, scale: 2 }).default('0'),
  
  // Summary
  grossSalary: decimal('gross_salary', { precision: 10, scale: 2 }).notNull(),
  netSalary: decimal('net_salary', { precision: 10, scale: 2 }).notNull(),
  
  // Attendance metrics
  workingDays: integer('working_days').default(0),
  presentDays: integer('present_days').default(0),
  absentDays: integer('absent_days').default(0),
  lateDays: integer('late_days').default(0),
  totalLateMinutes: integer('total_late_minutes').default(0),
  overtimeHours: decimal('overtime_hours', { precision: 10, scale: 2 }).default('0'),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, calculated, approved, paid
  calculatedAt: timestamp('calculated_at'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  paidBy: integer('paid_by').references(() => users.id),
  paidAt: timestamp('paid_at'),
  paymentMethod: varchar('payment_method', { length: 50 }), // bank_transfer, cash, cheque
  paymentReference: varchar('payment_reference', { length: 100 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueEmployeeMonthYear: unique().on(table.employeeId, table.month, table.year)
}));

// Salary Adjustments - One-time adjustments for specific months
export const salaryAdjustments = pgTable('salary_adjustments', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  monthlySalaryId: integer('monthly_salary_id').references(() => monthlySalaries.id, { onDelete: 'cascade' }),
  adjustmentType: varchar('adjustment_type', { length: 50 }).notNull(), // bonus, deduction, correction, penalty
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  isApplied: boolean('is_applied').default(false),
  appliedAt: timestamp('applied_at'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Absence Deductions - Track deductions for absences
export const absenceDeductions = pgTable('absence_deductions', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }),
  monthlySalaryId: integer('monthly_salary_id').references(() => monthlySalaries.id, { onDelete: 'cascade' }),
  absenceDate: date('absence_date').notNull(),
  deductionAmount: decimal('deduction_amount', { precision: 10, scale: 2 }).notNull(),
  deductionReason: varchar('deduction_reason', { length: 255 }),
  isApplied: boolean('is_applied').default(false),
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Latency Deductions - Track deductions for lateness
export const latencyDeductions = pgTable('latency_deductions', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  attendanceId: integer('attendance_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }).notNull(),
  monthlySalaryId: integer('monthly_salary_id').references(() => monthlySalaries.id, { onDelete: 'cascade' }),
  lateDate: date('late_date').notNull(),
  lateMinutes: integer('late_minutes').notNull(),
  deductionAmount: decimal('deduction_amount', { precision: 10, scale: 2 }).notNull(),
  deductionRate: decimal('deduction_rate', { precision: 10, scale: 2 }), // Deduction per minute
  isApplied: boolean('is_applied').default(false),
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Salary Configuration - System-wide salary settings
export const salaryConfiguration = pgTable('salary_configuration', {
  id: serial('id').primaryKey(),
  configKey: varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: text('config_value').notNull(),
  description: text('description'),
  updatedBy: integer('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ==================== SALARY MANAGEMENT RELATIONS ====================

export const salaryComponentsRelations = relations(salaryComponents, ({ many }) => ({
  employeeComponents: many(employeeSalaryComponents)
}));

export const employeeSalaryComponentsRelations = relations(employeeSalaryComponents, ({ one }) => ({
  employee: one(users, {
    fields: [employeeSalaryComponents.employeeId],
    references: [users.id]
  }),
  component: one(salaryComponents, {
    fields: [employeeSalaryComponents.componentId],
    references: [salaryComponents.id]
  }),
  creator: one(users, {
    fields: [employeeSalaryComponents.createdBy],
    references: [users.id]
  })
}));

export const monthlySalariesRelations = relations(monthlySalaries, ({ one, many }) => ({
  employee: one(users, {
    fields: [monthlySalaries.employeeId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [monthlySalaries.approvedBy],
    references: [users.id]
  }),
  payer: one(users, {
    fields: [monthlySalaries.paidBy],
    references: [users.id]
  }),
  adjustments: many(salaryAdjustments),
  absenceDeductions: many(absenceDeductions),
  latencyDeductions: many(latencyDeductions)
}));

export const salaryAdjustmentsRelations = relations(salaryAdjustments, ({ one }) => ({
  employee: one(users, {
    fields: [salaryAdjustments.employeeId],
    references: [users.id]
  }),
  monthlySalary: one(monthlySalaries, {
    fields: [salaryAdjustments.monthlySalaryId],
    references: [monthlySalaries.id]
  }),
  creator: one(users, {
    fields: [salaryAdjustments.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [salaryAdjustments.approvedBy],
    references: [users.id]
  })
}));

export const absenceDeductionsRelations = relations(absenceDeductions, ({ one }) => ({
  employee: one(users, {
    fields: [absenceDeductions.employeeId],
    references: [users.id]
  }),
  attendance: one(attendanceRecords, {
    fields: [absenceDeductions.attendanceId],
    references: [attendanceRecords.id]
  }),
  monthlySalary: one(monthlySalaries, {
    fields: [absenceDeductions.monthlySalaryId],
    references: [monthlySalaries.id]
  })
}));

export const latencyDeductionsRelations = relations(latencyDeductions, ({ one }) => ({
  employee: one(users, {
    fields: [latencyDeductions.employeeId],
    references: [users.id]
  }),
  attendance: one(attendanceRecords, {
    fields: [latencyDeductions.attendanceId],
    references: [attendanceRecords.id]
  }),
  monthlySalary: one(monthlySalaries, {
    fields: [latencyDeductions.monthlySalaryId],
    references: [monthlySalaries.id]
  })
}));