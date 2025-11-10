CREATE TABLE "absence_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"attendance_id" integer,
	"monthly_salary_id" integer,
	"absence_date" date NOT NULL,
	"deduction_amount" numeric(10, 2) NOT NULL,
	"deduction_reason" varchar(255),
	"is_applied" boolean DEFAULT false,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"alert_date" date NOT NULL,
	"severity" varchar(20) DEFAULT 'medium',
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_id" integer,
	"user_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"action_by" integer NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"reason" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_breaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_id" integer NOT NULL,
	"break_type_id" integer,
	"break_start" timestamp NOT NULL,
	"break_end" timestamp,
	"duration_minutes" integer DEFAULT 0,
	"break_reason" varchar(255),
	"is_approved" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_corrections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"attendance_id" integer,
	"date" timestamp NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"original_check_in" timestamp,
	"original_check_out" timestamp,
	"requested_check_in" timestamp,
	"requested_check_out" timestamp,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_location_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"attendance_id" integer NOT NULL,
	"log_type" varchar(20) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"accuracy_meters" numeric(8, 2),
	"geofence_id" integer,
	"is_within_geofence" boolean DEFAULT false,
	"ip_address" varchar(50),
	"device_id" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_name" varchar(255) NOT NULL,
	"policy_code" varchar(50) NOT NULL,
	"late_mark_after_minutes" integer DEFAULT 15,
	"half_day_after_minutes" integer DEFAULT 240,
	"absent_after_minutes" integer DEFAULT 480,
	"allow_early_checkin_minutes" integer DEFAULT 60,
	"allow_late_checkout_minutes" integer DEFAULT 120,
	"overtime_start_after_minutes" integer DEFAULT 30,
	"max_overtime_per_day" integer DEFAULT 180,
	"require_checkout" boolean DEFAULT true,
	"auto_checkout_after_hours" integer DEFAULT 12,
	"enable_geofencing" boolean DEFAULT false,
	"enable_biometric" boolean DEFAULT false,
	"monthly_attendance_threshold" integer DEFAULT 75,
	"continuous_absent_alert_days" integer DEFAULT 3,
	"is_active" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_policies_policy_code_unique" UNIQUE("policy_code")
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"check_in" timestamp,
	"check_out" timestamp,
	"working_hours" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'absent',
	"is_late" boolean DEFAULT false,
	"late_minutes" integer DEFAULT 0,
	"is_early_departure" boolean DEFAULT false,
	"early_departure_minutes" integer DEFAULT 0,
	"overtime_minutes" integer DEFAULT 0,
	"break_duration" integer DEFAULT 0,
	"notes" text,
	"location" varchar(255),
	"ip_address" varchar(50),
	"device_info" text,
	"is_manual_entry" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"total_working_days" integer NOT NULL,
	"present_days" integer DEFAULT 0,
	"absent_days" integer DEFAULT 0,
	"late_days" integer DEFAULT 0,
	"half_days" integer DEFAULT 0,
	"leave_days" integer DEFAULT 0,
	"holiday_days" integer DEFAULT 0,
	"total_working_hours" integer DEFAULT 0,
	"total_overtime_hours" integer DEFAULT 0,
	"attendance_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_summary_user_id_month_year_unique" UNIQUE("user_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "biometric_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"attendance_id" integer,
	"biometric_type" varchar(50) NOT NULL,
	"verification_status" varchar(20) NOT NULL,
	"confidence_score" integer,
	"device_serial" varchar(255),
	"device_location" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "break_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"break_name" varchar(100) NOT NULL,
	"break_code" varchar(20) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_paid" boolean DEFAULT false,
	"is_mandatory" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "break_types_break_code_unique" UNIQUE("break_code")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"time" time,
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_attendance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_date" date NOT NULL,
	"total_employees" integer NOT NULL,
	"present_count" integer DEFAULT 0,
	"absent_count" integer DEFAULT 0,
	"late_count" integer DEFAULT 0,
	"on_leave_count" integer DEFAULT 0,
	"half_day_count" integer DEFAULT 0,
	"attendance_percentage" numeric(5, 2) DEFAULT '0',
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_attendance_reports_report_date_unique" UNIQUE("report_date")
);
--> statement-breakpoint
CREATE TABLE "department_attendance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer NOT NULL,
	"report_date" date NOT NULL,
	"total_employees" integer NOT NULL,
	"present_count" integer DEFAULT 0,
	"absent_count" integer DEFAULT 0,
	"late_count" integer DEFAULT 0,
	"attendance_percentage" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "department_attendance_reports_department_id_report_date_unique" UNIQUE("department_id","report_date")
);
--> statement-breakpoint
CREATE TABLE "department_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer NOT NULL,
	"policy_id" integer NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "department_policies_department_id_effective_from_unique" UNIQUE("department_id","effective_from")
);
--> statement-breakpoint
CREATE TABLE "device_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"device_name" varchar(255),
	"device_type" varchar(50),
	"device_os" varchar(100),
	"browser_info" varchar(255),
	"is_approved" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"last_used_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_whitelist_user_id_device_id_unique" UNIQUE("user_id","device_id")
);
--> statement-breakpoint
CREATE TABLE "employee_salary_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"component_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_recurring" boolean DEFAULT true,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"shift_id" integer NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true,
	"assigned_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_shifts_user_id_effective_from_unique" UNIQUE("user_id","effective_from")
);
--> statement-breakpoint
CREATE TABLE "geofence_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"location_code" varchar(50) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"radius_meters" integer DEFAULT 100,
	"address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "geofence_locations_location_code_unique" UNIQUE("location_code")
);
--> statement-breakpoint
CREATE TABLE "latency_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"attendance_id" integer NOT NULL,
	"monthly_salary_id" integer,
	"late_date" date NOT NULL,
	"late_minutes" integer NOT NULL,
	"deduction_amount" numeric(10, 2) NOT NULL,
	"deduction_rate" numeric(10, 2),
	"is_applied" boolean DEFAULT false,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"leave_type" varchar(50) NOT NULL,
	"total_leaves" integer NOT NULL,
	"used_leaves" integer DEFAULT 0,
	"remaining_leaves" integer NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leave_balances_user_id_leave_type_year_unique" UNIQUE("user_id","leave_type","year")
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_salaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"base_salary" numeric(10, 2) NOT NULL,
	"total_bonuses" numeric(10, 2) DEFAULT '0',
	"total_allowances" numeric(10, 2) DEFAULT '0',
	"overtime_pay" numeric(10, 2) DEFAULT '0',
	"total_deductions" numeric(10, 2) DEFAULT '0',
	"absence_deductions" numeric(10, 2) DEFAULT '0',
	"latency_deductions" numeric(10, 2) DEFAULT '0',
	"tax_deduction" numeric(10, 2) DEFAULT '0',
	"other_deductions" numeric(10, 2) DEFAULT '0',
	"gross_salary" numeric(10, 2) NOT NULL,
	"net_salary" numeric(10, 2) NOT NULL,
	"working_days" integer DEFAULT 0,
	"present_days" integer DEFAULT 0,
	"absent_days" integer DEFAULT 0,
	"late_days" integer DEFAULT 0,
	"total_late_minutes" integer DEFAULT 0,
	"overtime_hours" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'draft',
	"calculated_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"paid_by" integer,
	"paid_at" timestamp,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_salaries_employee_id_month_year_unique" UNIQUE("employee_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "overtime_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"request_date" date NOT NULL,
	"planned_hours" integer NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"requested_by" integer,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"attendance_id" integer NOT NULL,
	"overtime_request_id" integer,
	"date" date NOT NULL,
	"overtime_minutes" integer NOT NULL,
	"overtime_rate" numeric(10, 2) DEFAULT '1.5',
	"is_approved" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"monthly_salary_id" integer,
	"adjustment_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"is_applied" boolean DEFAULT false,
	"applied_at" timestamp,
	"created_by" integer NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"component_name" varchar(100) NOT NULL,
	"component_type" varchar(50) NOT NULL,
	"description" text,
	"is_percentage" boolean DEFAULT false,
	"default_amount" numeric(10, 2) DEFAULT '0',
	"is_taxable" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"config_value" text NOT NULL,
	"description" text,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "salary_configuration_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "work_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_name" varchar(100) NOT NULL,
	"shift_code" varchar(20) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"grace_period_minutes" integer DEFAULT 15,
	"early_departure_threshold" integer DEFAULT 15,
	"minimum_work_hours" integer DEFAULT 480,
	"half_day_threshold" integer DEFAULT 240,
	"break_duration" integer DEFAULT 60,
	"is_night_shift" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_shifts_shift_code_unique" UNIQUE("shift_code")
);
--> statement-breakpoint
ALTER TABLE "days_holiday" DROP CONSTRAINT "days_holiday_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "days_holiday" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "rejected_by" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "days_holiday" ADD COLUMN "date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "days_holiday" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "days_holiday" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "days_holiday" ADD COLUMN "is_recurring" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "item_name" varchar(255);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "rejected_by" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "paid_by" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "related_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employee_code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employment_type" varchar(100) DEFAULT 'Full-time';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "work_location" varchar(255) DEFAULT 'Office';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "probation_end" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skills" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marital_status" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "absence_deductions" ADD CONSTRAINT "absence_deductions_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_deductions" ADD CONSTRAINT "absence_deductions_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_deductions" ADD CONSTRAINT "absence_deductions_monthly_salary_id_monthly_salaries_id_fk" FOREIGN KEY ("monthly_salary_id") REFERENCES "public"."monthly_salaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_audit_log" ADD CONSTRAINT "attendance_audit_log_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_audit_log" ADD CONSTRAINT "attendance_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_audit_log" ADD CONSTRAINT "attendance_audit_log_action_by_users_id_fk" FOREIGN KEY ("action_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_breaks" ADD CONSTRAINT "attendance_breaks_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_breaks" ADD CONSTRAINT "attendance_breaks_break_type_id_break_types_id_fk" FOREIGN KEY ("break_type_id") REFERENCES "public"."break_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_location_logs" ADD CONSTRAINT "attendance_location_logs_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_location_logs" ADD CONSTRAINT "attendance_location_logs_geofence_id_geofence_locations_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "public"."geofence_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_summary" ADD CONSTRAINT "attendance_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_logs" ADD CONSTRAINT "biometric_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometric_logs" ADD CONSTRAINT "biometric_logs_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_attendance_reports" ADD CONSTRAINT "daily_attendance_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_attendance_reports" ADD CONSTRAINT "department_attendance_reports_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_policies" ADD CONSTRAINT "department_policies_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_policies" ADD CONSTRAINT "department_policies_policy_id_attendance_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."attendance_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_whitelist" ADD CONSTRAINT "device_whitelist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_whitelist" ADD CONSTRAINT "device_whitelist_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_component_id_salary_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."salary_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_shift_id_work_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."work_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "latency_deductions" ADD CONSTRAINT "latency_deductions_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "latency_deductions" ADD CONSTRAINT "latency_deductions_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "latency_deductions" ADD CONSTRAINT "latency_deductions_monthly_salary_id_monthly_salaries_id_fk" FOREIGN KEY ("monthly_salary_id") REFERENCES "public"."monthly_salaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_salaries" ADD CONSTRAINT "monthly_salaries_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_salaries" ADD CONSTRAINT "monthly_salaries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_salaries" ADD CONSTRAINT "monthly_salaries_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_tracking" ADD CONSTRAINT "overtime_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_tracking" ADD CONSTRAINT "overtime_tracking_attendance_id_attendance_records_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_tracking" ADD CONSTRAINT "overtime_tracking_overtime_request_id_overtime_requests_id_fk" FOREIGN KEY ("overtime_request_id") REFERENCES "public"."overtime_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_tracking" ADD CONSTRAINT "overtime_tracking_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_monthly_salary_id_monthly_salaries_id_fk" FOREIGN KEY ("monthly_salary_id") REFERENCES "public"."monthly_salaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_configuration" ADD CONSTRAINT "salary_configuration_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "days_holiday" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "days_holiday" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "days_holiday" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "days_holiday" DROP COLUMN "reason";--> statement-breakpoint
ALTER TABLE "days_holiday" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_code_unique" UNIQUE("employee_code");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");