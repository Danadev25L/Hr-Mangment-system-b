import { pgTable, serial, varchar, text, timestamp, integer, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Organization table schema
export const organizations = pgTable('organization', {
  id: serial('id').primaryKey(),
  organizationName: varchar('organization_name', { length: 255 }).notNull(),
  emailAddress: varchar('email_address', { length: 255 }),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

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
  organizationId: integer('organization_id').references(() => organizations.id),
  jobId: integer('job_id').references(() => jobs.id),
  baseSalary: integer('base_salary').default(0), // Monthly base salary
  department: varchar('department', { length: 255 }), // Department name for easy access
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
  organizationId: integer('organization_id').references(() => organizations.id),
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
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  date: timestamp('date').notNull(),
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
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id]
  }),
  currentJob: one(jobs, {
    fields: [users.jobId],
    references: [jobs.id]
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
  organization: one(organizations, {
    fields: [jobs.organizationId],
    references: [organizations.id]
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