-- Create Comprehensive Salary Management System
-- Migration: 0021_create_salary_management_system

-- Salary Components table - Define salary components (bonus, deduction, allowance, etc.)
CREATE TABLE IF NOT EXISTS salary_components (
  id SERIAL PRIMARY KEY,
  component_name VARCHAR(100) NOT NULL,
  component_type VARCHAR(50) NOT NULL, -- bonus, deduction, allowance, adjustment
  description TEXT,
  is_percentage BOOLEAN DEFAULT FALSE, -- If true, amount is percentage of base salary
  default_amount NUMERIC(10, 2) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Employee Salary Components - Link employees to salary components
CREATE TABLE IF NOT EXISTS employee_salary_components (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  component_id INTEGER NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_recurring BOOLEAN DEFAULT TRUE, -- If true, applies every month
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Monthly Salary Calculations - Final calculated salary for each month
CREATE TABLE IF NOT EXISTS monthly_salaries (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  base_salary NUMERIC(10, 2) NOT NULL,
  
  -- Earnings
  total_bonuses NUMERIC(10, 2) DEFAULT 0,
  total_allowances NUMERIC(10, 2) DEFAULT 0,
  overtime_pay NUMERIC(10, 2) DEFAULT 0,
  
  -- Deductions
  total_deductions NUMERIC(10, 2) DEFAULT 0,
  absence_deductions NUMERIC(10, 2) DEFAULT 0,
  latency_deductions NUMERIC(10, 2) DEFAULT 0,
  tax_deduction NUMERIC(10, 2) DEFAULT 0,
  other_deductions NUMERIC(10, 2) DEFAULT 0,
  
  -- Summary
  gross_salary NUMERIC(10, 2) NOT NULL,
  net_salary NUMERIC(10, 2) NOT NULL,
  
  -- Attendance metrics
  working_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  late_days INTEGER DEFAULT 0,
  total_late_minutes INTEGER DEFAULT 0,
  overtime_hours NUMERIC(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, calculated, approved, paid
  calculated_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  paid_by INTEGER REFERENCES users(id),
  paid_at TIMESTAMP,
  payment_method VARCHAR(50), -- bank_transfer, cash, cheque
  payment_reference VARCHAR(100),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(employee_id, month, year)
);

-- Salary Adjustments - One-time adjustments for specific months
CREATE TABLE IF NOT EXISTS salary_adjustments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monthly_salary_id INTEGER REFERENCES monthly_salaries(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(50) NOT NULL, -- bonus, deduction, correction, penalty
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) NOT NULL,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Absence Deductions - Track deductions for absences
CREATE TABLE IF NOT EXISTS absence_deductions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_id INTEGER REFERENCES attendance_records(id) ON DELETE CASCADE,
  monthly_salary_id INTEGER REFERENCES monthly_salaries(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  deduction_amount NUMERIC(10, 2) NOT NULL,
  deduction_reason VARCHAR(255),
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Latency Deductions - Track deductions for lateness
CREATE TABLE IF NOT EXISTS latency_deductions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_id INTEGER NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  monthly_salary_id INTEGER REFERENCES monthly_salaries(id) ON DELETE CASCADE,
  late_date DATE NOT NULL,
  late_minutes INTEGER NOT NULL,
  deduction_amount NUMERIC(10, 2) NOT NULL,
  deduction_rate NUMERIC(10, 2), -- Deduction per minute
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Salary Configuration - System-wide salary settings
CREATE TABLE IF NOT EXISTS salary_configuration (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default salary configurations
INSERT INTO salary_configuration (config_key, config_value, description) VALUES
('tax_rate', '10', 'Default tax rate percentage'),
('absence_deduction_per_day', '0', 'Default deduction amount per absent day (0 = auto-calculate from base salary)'),
('latency_deduction_per_minute', '1', 'Default deduction amount per minute late'),
('overtime_rate_multiplier', '1.5', 'Overtime pay multiplier'),
('working_days_per_month', '22', 'Average working days per month'),
('working_hours_per_day', '8', 'Standard working hours per day'),
('grace_period_minutes', '15', 'Grace period for late arrival (no deduction)'),
('max_late_minutes_before_half_day', '240', 'Minutes late before marking as half day')
ON CONFLICT (config_key) DO NOTHING;

-- Insert default salary components
INSERT INTO salary_components (component_name, component_type, description, is_percentage, default_amount, is_taxable) VALUES
('Performance Bonus', 'bonus', 'Monthly performance bonus', FALSE, 0, TRUE),
('Transportation Allowance', 'allowance', 'Monthly transportation allowance', FALSE, 0, FALSE),
('Meal Allowance', 'allowance', 'Monthly meal allowance', FALSE, 0, FALSE),
('Housing Allowance', 'allowance', 'Monthly housing allowance', FALSE, 0, FALSE),
('Health Insurance', 'deduction', 'Health insurance contribution', FALSE, 0, FALSE),
('Provident Fund', 'deduction', 'Provident fund contribution', TRUE, 5, FALSE),
('Absence Penalty', 'deduction', 'Deduction for unauthorized absences', FALSE, 0, FALSE),
('Lateness Penalty', 'deduction', 'Deduction for late arrivals', FALSE, 0, FALSE)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_salaries_employee ON monthly_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_salaries_period ON monthly_salaries(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_salaries_status ON monthly_salaries(status);
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_employee ON salary_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_period ON salary_adjustments(month, year);
CREATE INDEX IF NOT EXISTS idx_employee_salary_components_employee ON employee_salary_components(employee_id);
CREATE INDEX IF NOT EXISTS idx_absence_deductions_employee ON absence_deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_latency_deductions_employee ON latency_deductions(employee_id);

-- Add comments
COMMENT ON TABLE monthly_salaries IS 'Final calculated monthly salaries with all components';
COMMENT ON TABLE salary_components IS 'Reusable salary components (bonuses, deductions, allowances)';
COMMENT ON TABLE employee_salary_components IS 'Salary components assigned to specific employees';
COMMENT ON TABLE salary_adjustments IS 'One-time salary adjustments for specific months';
COMMENT ON TABLE absence_deductions IS 'Automatic deductions calculated from attendance absence records';
COMMENT ON TABLE latency_deductions IS 'Automatic deductions calculated from attendance lateness records';
COMMENT ON TABLE salary_configuration IS 'System-wide salary calculation settings';
