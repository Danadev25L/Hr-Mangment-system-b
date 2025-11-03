-- Advanced Attendance System Migration
-- This creates a comprehensive enterprise-grade attendance management system

-- ==================== SHIFT MANAGEMENT ====================

-- Work Shifts table - Define different work shifts
CREATE TABLE IF NOT EXISTS work_shifts (
  id SERIAL PRIMARY KEY,
  shift_name VARCHAR(100) NOT NULL,
  shift_code VARCHAR(20) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INTEGER DEFAULT 15, -- Late arrival grace period
  early_departure_threshold INTEGER DEFAULT 15, -- Minutes before shift end
  minimum_work_hours INTEGER DEFAULT 480, -- Minimum minutes (8 hours)
  half_day_threshold INTEGER DEFAULT 240, -- Half day threshold (4 hours)
  break_duration INTEGER DEFAULT 60, -- Standard break duration in minutes
  is_night_shift BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Employee Shift Assignments
CREATE TABLE IF NOT EXISTS employee_shifts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id INTEGER NOT NULL REFERENCES work_shifts(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, effective_from)
);

-- ==================== ATTENDANCE POLICIES ====================

-- Attendance Policies table
CREATE TABLE IF NOT EXISTS attendance_policies (
  id SERIAL PRIMARY KEY,
  policy_name VARCHAR(255) NOT NULL,
  policy_code VARCHAR(50) NOT NULL UNIQUE,
  late_mark_after_minutes INTEGER DEFAULT 15, -- Mark late after X minutes
  half_day_after_minutes INTEGER DEFAULT 240, -- Mark half day if less than X minutes
  absent_after_minutes INTEGER DEFAULT 480, -- Mark absent if less than X minutes
  allow_early_checkin_minutes INTEGER DEFAULT 60, -- Allow check-in X minutes before shift
  allow_late_checkout_minutes INTEGER DEFAULT 120, -- Allow check-out X minutes after shift
  overtime_start_after_minutes INTEGER DEFAULT 30, -- Count overtime after X minutes
  max_overtime_per_day INTEGER DEFAULT 180, -- Max 3 hours overtime per day
  require_checkout BOOLEAN DEFAULT TRUE, -- Require check-out
  auto_checkout_after_hours INTEGER DEFAULT 12, -- Auto check-out after X hours
  enable_geofencing BOOLEAN DEFAULT FALSE, -- Enable location-based attendance
  enable_biometric BOOLEAN DEFAULT FALSE, -- Enable biometric verification
  monthly_attendance_threshold INTEGER DEFAULT 75, -- Minimum attendance percentage
  continuous_absent_alert_days INTEGER DEFAULT 3, -- Alert after X continuous absent days
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Department Attendance Policies (link departments to policies)
CREATE TABLE IF NOT EXISTS department_policies (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES department(id) ON DELETE CASCADE,
  policy_id INTEGER NOT NULL REFERENCES attendance_policies(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(department_id, effective_from)
);

-- ==================== BREAK MANAGEMENT ====================

-- Break Types
CREATE TABLE IF NOT EXISTS break_types (
  id SERIAL PRIMARY KEY,
  break_name VARCHAR(100) NOT NULL,
  break_code VARCHAR(20) NOT NULL UNIQUE,
  duration_minutes INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  is_mandatory BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Employee Break Records
CREATE TABLE IF NOT EXISTS attendance_breaks (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  break_type_id INTEGER REFERENCES break_types(id),
  break_start TIMESTAMP NOT NULL,
  break_end TIMESTAMP,
  duration_minutes INTEGER DEFAULT 0,
  break_reason VARCHAR(255),
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==================== GEOLOCATION & DEVICE TRACKING ====================

-- Geofence Locations (allowed check-in locations)
CREATE TABLE IF NOT EXISTS geofence_locations (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  location_code VARCHAR(50) NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100, -- Geofence radius
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Device Whitelist (approved devices for check-in)
CREATE TABLE IF NOT EXISTS device_whitelist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL, -- Unique device identifier
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- mobile, desktop, tablet, biometric
  device_os VARCHAR(100),
  browser_info VARCHAR(255),
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, device_id)
);

-- Attendance Location Logs
CREATE TABLE IF NOT EXISTS attendance_location_logs (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  log_type VARCHAR(20) NOT NULL, -- checkin, checkout, break_start, break_end
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy_meters DECIMAL(8, 2),
  geofence_id INTEGER REFERENCES geofence_locations(id),
  is_within_geofence BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(50),
  device_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==================== BIOMETRIC & SECURITY ====================

-- Biometric Check-in Logs
CREATE TABLE IF NOT EXISTS biometric_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_id INTEGER REFERENCES attendance_records(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL, -- fingerprint, face, iris, card
  verification_status VARCHAR(20) NOT NULL, -- success, failed, partial
  confidence_score INTEGER, -- 0-100 confidence level
  device_serial VARCHAR(255),
  device_location VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==================== OVERTIME MANAGEMENT ====================

-- Overtime Requests
CREATE TABLE IF NOT EXISTS overtime_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  planned_hours INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Overtime Tracking (actual overtime worked)
CREATE TABLE IF NOT EXISTS overtime_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  overtime_request_id INTEGER REFERENCES overtime_requests(id),
  date DATE NOT NULL,
  overtime_minutes INTEGER NOT NULL,
  overtime_rate DECIMAL(10, 2) DEFAULT 1.5, -- 1.5x, 2x, etc.
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==================== ATTENDANCE ALERTS & NOTIFICATIONS ====================

-- Attendance Alerts
CREATE TABLE IF NOT EXISTS attendance_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- late_arrival, early_departure, absent, continuous_absent, low_attendance
  alert_date DATE NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==================== LEAVE INTEGRATION ====================

-- Leave Balance (for attendance calculation)
CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL, -- annual, sick, casual, maternity, paternity
  total_leaves INTEGER NOT NULL,
  used_leaves INTEGER DEFAULT 0,
  remaining_leaves INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, leave_type, year)
);

-- ==================== ATTENDANCE REPORTS ====================

-- Daily Attendance Reports
CREATE TABLE IF NOT EXISTS daily_attendance_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  total_employees INTEGER NOT NULL,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  late_count INTEGER DEFAULT 0,
  on_leave_count INTEGER DEFAULT 0,
  half_day_count INTEGER DEFAULT 0,
  attendance_percentage DECIMAL(5, 2) DEFAULT 0,
  generated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  generated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Department-wise Attendance Reports
CREATE TABLE IF NOT EXISTS department_attendance_reports (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES department(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_employees INTEGER NOT NULL,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  late_count INTEGER DEFAULT 0,
  attendance_percentage DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(department_id, report_date)
);

-- ==================== ATTENDANCE AUDIT LOG ====================

-- Audit log for all attendance changes
CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER REFERENCES attendance_records(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- create, update, delete, approve, reject
  action_by INTEGER NOT NULL REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Attendance Records Indexes
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_checkin ON attendance_records(check_in);

-- Shift Management Indexes
CREATE INDEX idx_employee_shifts_user ON employee_shifts(user_id);
CREATE INDEX idx_employee_shifts_active ON employee_shifts(is_active);

-- Break Records Indexes
CREATE INDEX idx_breaks_attendance ON attendance_breaks(attendance_id);
CREATE INDEX idx_breaks_date ON attendance_breaks(break_start);

-- Overtime Indexes
CREATE INDEX idx_overtime_user_date ON overtime_tracking(user_id, date);
CREATE INDEX idx_overtime_requests_user ON overtime_requests(user_id);

-- Alerts Indexes
CREATE INDEX idx_alerts_user_unread ON attendance_alerts(user_id, is_read);
CREATE INDEX idx_alerts_date ON attendance_alerts(alert_date);

-- Audit Log Indexes
CREATE INDEX idx_audit_attendance ON attendance_audit_log(attendance_id);
CREATE INDEX idx_audit_user ON attendance_audit_log(user_id);
CREATE INDEX idx_audit_date ON attendance_audit_log(timestamp);

-- ==================== DEFAULT DATA ====================

-- Insert default work shifts
INSERT INTO work_shifts (shift_name, shift_code, start_time, end_time, grace_period_minutes, minimum_work_hours) VALUES
('Morning Shift', 'MORNING', '09:00:00', '17:00:00', 15, 480),
('Evening Shift', 'EVENING', '14:00:00', '22:00:00', 15, 480),
('Night Shift', 'NIGHT', '22:00:00', '06:00:00', 15, 480),
('Flexible Shift', 'FLEXIBLE', '00:00:00', '23:59:59', 30, 480);

-- Insert default break types
INSERT INTO break_types (break_name, break_code, duration_minutes, is_paid, is_mandatory) VALUES
('Lunch Break', 'LUNCH', 60, false, true),
('Tea Break', 'TEA', 15, true, false),
('Prayer Break', 'PRAYER', 10, true, false),
('Emergency Break', 'EMERGENCY', 30, false, false);

-- Insert default attendance policy
INSERT INTO attendance_policies (
  policy_name, 
  policy_code, 
  late_mark_after_minutes,
  half_day_after_minutes,
  absent_after_minutes,
  require_checkout,
  auto_checkout_after_hours,
  description
) VALUES (
  'Default Company Policy',
  'DEFAULT',
  15,
  240,
  480,
  true,
  12,
  'Standard company attendance policy with 15 min grace period'
);

-- Insert default geofence location (office)
INSERT INTO geofence_locations (location_name, location_code, latitude, longitude, radius_meters, address) VALUES
('Main Office', 'MAIN_OFFICE', 0.0, 0.0, 200, 'Company Headquarters');

COMMENT ON TABLE work_shifts IS 'Work shift definitions with timing and rules';
COMMENT ON TABLE employee_shifts IS 'Employee shift assignments with date ranges';
COMMENT ON TABLE attendance_policies IS 'Comprehensive attendance policy configurations';
COMMENT ON TABLE attendance_breaks IS 'Employee break records during work hours';
COMMENT ON TABLE geofence_locations IS 'Geofenced locations for location-based attendance';
COMMENT ON TABLE biometric_logs IS 'Biometric authentication logs for attendance';
COMMENT ON TABLE overtime_tracking IS 'Overtime hours tracking and approval';
COMMENT ON TABLE attendance_alerts IS 'Automated attendance alerts and warnings';
COMMENT ON TABLE attendance_audit_log IS 'Complete audit trail for attendance changes';
