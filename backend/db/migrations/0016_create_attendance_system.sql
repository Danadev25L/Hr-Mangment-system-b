-- Create Attendance Management System Tables
-- Migration: 0016_create_attendance_system

-- Attendance Records table - Daily check-in/check-out records
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    working_hours INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'absent',
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INTEGER DEFAULT 0,
    is_early_departure BOOLEAN DEFAULT FALSE,
    early_departure_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    break_duration INTEGER DEFAULT 0,
    notes TEXT,
    location VARCHAR(255),
    ip_address VARCHAR(50),
    device_info TEXT,
    is_manual_entry BOOLEAN DEFAULT FALSE,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Attendance Summary table - Monthly attendance summaries
CREATE TABLE IF NOT EXISTS attendance_summary (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_working_days INTEGER NOT NULL,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    late_days INTEGER DEFAULT 0,
    half_days INTEGER DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    holiday_days INTEGER DEFAULT 0,
    total_working_hours INTEGER DEFAULT 0,
    total_overtime_hours INTEGER DEFAULT 0,
    attendance_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, month, year)
);

-- Attendance Corrections table - Correction requests for missed punches
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_id INTEGER REFERENCES attendance_records(id) ON DELETE SET NULL,
    date TIMESTAMP NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    original_check_in TIMESTAMP,
    original_check_out TIMESTAMP,
    requested_check_in TIMESTAMP,
    requested_check_out TIMESTAMP,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_user_month_year ON attendance_summary(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_user_id ON attendance_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_status ON attendance_corrections(status);

-- Add comments for documentation
COMMENT ON TABLE attendance_records IS 'Daily employee attendance records with check-in/check-out timestamps';
COMMENT ON TABLE attendance_summary IS 'Monthly attendance summaries for quick reporting and payroll integration';
COMMENT ON TABLE attendance_corrections IS 'Employee requests for attendance corrections (missed punches, wrong times)';

COMMENT ON COLUMN attendance_records.working_hours IS 'Total working minutes for the day';
COMMENT ON COLUMN attendance_records.status IS 'Attendance status: present, absent, late, half_day, on_leave, holiday';
COMMENT ON COLUMN attendance_records.overtime_minutes IS 'Overtime minutes worked beyond scheduled hours';
COMMENT ON COLUMN attendance_summary.attendance_percentage IS 'Attendance percentage (0-100) for the month';
COMMENT ON COLUMN attendance_corrections.request_type IS 'Type: missed_checkin, missed_checkout, wrong_time, forgot_punch';
