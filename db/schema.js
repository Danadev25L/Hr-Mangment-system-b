import { pgTable, serial, varchar, text, integer, timestamp, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'approved', 'rejected']);
export const holidayStatusEnum = pgEnum('holiday_status', ['pending', 'approved', 'rejected']);

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('ROLE_EMPLOYEE'),
  departmentId: integer('department_id'),
  employeeCode: varchar('employee_code', { length: 50 }),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const departments = pgTable('department', {
  id: serial('id').primaryKey(),
  departmentName: varchar('department_name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const departmentAnnouncements = pgTable('department_announcement', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  departmentId: integer('department_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  jobId: integer('job_id').notNull(),
  status: applicationStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const daysHoliday = pgTable('days_holiday', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason').notNull(),
  status: holidayStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const daysWorking = pgTable('days_working', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  date: timestamp('date').notNull(),
  hoursWorked: integer('hours_worked').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  departmentId: integer('department_id'),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Add more tables as needed based on the migration files
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  departmentId: integer('department_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const personalInformation = pgTable('personal_information', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const financialInformation = pgTable('financial_information', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  salary: numeric('salary', { precision: 10, scale: 2 }),
  bankAccount: varchar('bank_account', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const personalEvents = pgTable('personal_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull(),
  receiverId: integer('receiver_id').notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const salaryRecords = pgTable('salary_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  baseSalary: numeric('base_salary', { precision: 10, scale: 2 }).notNull(),
  overtime: numeric('overtime', { precision: 10, scale: 2 }).default(0),
  bonuses: numeric('bonuses', { precision: 10, scale: 2 }).default(0),
  deductions: numeric('deductions', { precision: 10, scale: 2 }).default(0),
  totalSalary: numeric('total_salary', { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const overtimeRecords = pgTable('overtime_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  hours: numeric('hours', { precision: 5, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description'),
  approved: boolean('approved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const announcementRecipients = pgTable('announcement_recipients', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id').notNull(),
  userId: integer('user_id').notNull(),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  jobId: integer('job_id').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  applicationDate: timestamp('application_date').defaultNow(),
  resume: text('resume'),
  coverLetter: text('cover_letter'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payrollRecords = pgTable('payroll_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  payPeriod: varchar('pay_period', { length: 50 }).notNull(),
  grossSalary: numeric('gross_salary', { precision: 10, scale: 2 }).notNull(),
  netSalary: numeric('net_salary', { precision: 10, scale: 2 }).notNull(),
  overtimePay: numeric('overtime_pay', { precision: 10, scale: 2 }).default(0),
  deductions: numeric('deductions', { precision: 10, scale: 2 }).default(0),
  bonuses: numeric('bonuses', { precision: 10, scale: 2 }).default(0),
  payDate: timestamp('pay_date').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payrollAdjustments = pgTable('payroll_adjustments', {
  id: serial('id').primaryKey(),
  payrollId: integer('payroll_id').notNull(),
  userId: integer('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payrollBonuses = pgTable('payroll_bonuses', {
  id: serial('id').primaryKey(),
  payrollId: integer('payroll_id').notNull(),
  userId: integer('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const departmentPolicies = pgTable('department_policies', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  policyType: varchar('policy_type', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const departmentAttendanceReports = pgTable('department_attendance_reports', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').notNull(),
  reportDate: timestamp('report_date').notNull(),
  totalEmployees: integer('total_employees').notNull(),
  presentEmployees: integer('present_employees').notNull(),
  absentEmployees: integer('absent_employees').notNull(),
  lateEmployees: integer('late_employees').notNull(),
  reportData: text('report_data'),
  generatedBy: integer('generated_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  logo: varchar('logo', { length: 500 }),
  settings: text('settings'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  location: varchar('location', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  isPublic: boolean('is_public').default(false),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Attendance System Tables
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  date: timestamp('date').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  workingHours: numeric('working_hours', { precision: 5, scale: 2 }).default(0),
  status: varchar('status', { length: 50 }).default('present'),
  location: varchar('location', { length: 255 }),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  notes: text('notes'),
  isLate: boolean('is_late').default(false),
  earlyDeparture: boolean('early_departure').default(false),
  overtime: numeric('overtime', { precision: 5, scale: 2 }).default(0),
  breakDuration: numeric('break_duration', { precision: 5, scale: 2 }).default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attendanceCorrections = pgTable('attendance_corrections', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').notNull(),
  userId: integer('user_id').notNull(),
  requestedBy: integer('requested_by').notNull(),
  requestType: varchar('request_type', { length: 50 }).notNull(),
  requestedCheckIn: timestamp('requested_check_in'),
  requestedCheckOut: timestamp('requested_check_out'),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  reviewedBy: integer('reviewed_by'),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attendanceSummaries = pgTable('attendance_summaries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  totalDays: integer('total_days').notNull(),
  presentDays: integer('present_days').notNull(),
  absentDays: integer('absent_days').notNull(),
  lateDays: integer('late_days').notNull(),
  halfDays: integer('half_days').notNull(),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default(0),
  totalWorkingHours: numeric('total_working_hours', { precision: 5, scale: 2 }).default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Salary Management Tables
export const salaryComponents = pgTable('salary_components', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  isPercentage: boolean('is_percentage').default(false),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const employeeSalaryComponents = pgTable('employee_salary_components', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  componentId: integer('component_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const absenceDeductions = pgTable('absence_deductions', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: timestamp('date').notNull(),
  deductionType: varchar('deduction_type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  approvedBy: integer('approved_by'),
  attendanceId: integer('attendance_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const monthlySalaries = pgTable('monthly_salaries', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  basicSalary: numeric('basic_salary', { precision: 10, scale: 2 }).notNull(),
  allowances: numeric('allowances', { precision: 10, scale: 2 }).default(0),
  overtime: numeric('overtime', { precision: 10, scale: 2 }).default(0),
  bonuses: numeric('bonuses', { precision: 10, scale: 2 }).default(0),
  deductions: numeric('deductions', { precision: 10, scale: 2 }).default(0),
  netSalary: numeric('net_salary', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  paymentDate: timestamp('payment_date'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const salaryAdjustments = pgTable('salary_adjustments', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const latencyDeductions = pgTable('latency_deductions', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: timestamp('date').notNull(),
  lateMinutes: integer('late_minutes').notNull(),
  deductionAmount: numeric('deduction_amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  attendanceId: integer('attendance_id'),
  approvedBy: integer('approved_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const salaryConfiguration = pgTable('salary_configuration', {
  id: serial('id').primaryKey(),
  configKey: varchar('config_key', { length: 255 }).notNull().unique(),
  configValue: text('config_value').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: timestamp('date').notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  breakDuration: numeric('break_duration', { precision: 5, scale: 2 }).default(0),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default(0),
  workingHours: numeric('working_hours', { precision: 5, scale: 2 }).default(0),
  status: varchar('status', { length: 50 }).default('present'),
  location: varchar('location', { length: 255 }),
  notes: text('notes'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attendanceSummary = pgTable('attendance_summary', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  totalDays: integer('total_days').notNull(),
  workedDays: integer('worked_days').notNull(),
  absentDays: integer('absent_days').notNull(),
  lateDays: integer('late_days').notNull(),
  halfDays: integer('half_days').notNull(),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default(0),
  totalWorkingHours: numeric('total_working_hours', { precision: 5, scale: 2 }).default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const overtimeTracking = pgTable('overtime_tracking', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  date: timestamp('date').notNull(),
  regularHours: numeric('regular_hours', { precision: 5, scale: 2 }).notNull(),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).notNull(),
  overtimeRate: numeric('overtime_rate', { precision: 5, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  approvedBy: integer('approved_by'),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attendanceAlerts = pgTable('attendance_alerts', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).default('medium'),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attendanceAuditLog = pgTable('attendance_audit_log', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').notNull(),
  employeeId: integer('employee_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  reason: text('reason'),
  performedBy: integer('performed_by').notNull(),
  performedAt: timestamp('performed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

// Export all schema
export const schema = {
  users,
  departments,
  departmentAnnouncements,
  applications,
  daysHoliday,
  daysWorking,
  expenses,
  jobs,
  personalInformation,
  financialInformation,
  payments,
  personalEvents,
  messages,
  salaryRecords,
  overtimeRecords,
  notifications,
  announcementRecipients,
  jobApplications,
  leaveRequests,
  payrollRecords,
  payrollAdjustments,
  payrollBonuses,
  departmentPolicies,
  departmentAttendanceReports,
  organizations,
  calendarEvents,
  attendance,
  attendanceCorrections,
  attendanceSummaries,
  salaryComponents,
  employeeSalaryComponents,
  absenceDeductions,
  monthlySalaries,
  salaryAdjustments,
  latencyDeductions,
  salaryConfiguration,
  attendanceRecords,
  attendanceSummary,
  overtimeTracking,
  attendanceAlerts,
  attendanceAuditLog,
  userRoleEnum,
  applicationStatusEnum,
  holidayStatusEnum
};

export default schema;