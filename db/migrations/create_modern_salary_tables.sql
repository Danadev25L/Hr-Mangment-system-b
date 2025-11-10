-- Modern Salary Management Migration
-- Run this to create the new salary management tables

-- Create salary_records table
CREATE TABLE IF NOT EXISTS salary_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    base_salary INTEGER NOT NULL,
    overtime_hours INTEGER DEFAULT 0,
    overtime_rate INTEGER DEFAULT 0,
    overtime_pay INTEGER DEFAULT 0,
    gross_salary INTEGER NOT NULL,
    tax_deduction INTEGER DEFAULT 0,
    net_salary INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create overtime_records table
CREATE TABLE IF NOT EXISTS overtime_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TIMESTAMP NOT NULL,
    hours_worked INTEGER NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salary_records_user_id ON salary_records(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_month_year ON salary_records(month, year);
CREATE INDEX IF NOT EXISTS idx_salary_records_status ON salary_records(status);
CREATE INDEX IF NOT EXISTS idx_overtime_records_user_id ON overtime_records(user_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_date ON overtime_records(date);
CREATE INDEX IF NOT EXISTS idx_overtime_records_status ON overtime_records(status);

-- Insert sample data for testing (optional)
-- This will create sample salary records for existing users

-- Generate sample salary records for current month
INSERT INTO salary_records (user_id, base_salary, overtime_hours, overtime_rate, overtime_pay, gross_salary, tax_deduction, net_salary, month, year, status)
SELECT 
    u.id,
    u.salary,
    0 as overtime_hours,
    0 as overtime_rate,
    0 as overtime_pay,
    u.salary as gross_salary,
    ROUND(u.salary * 0.10) as tax_deduction,
    u.salary - ROUND(u.salary * 0.10) as net_salary,
    EXTRACT(MONTH FROM CURRENT_DATE) as month,
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    'pending' as status
FROM users u 
WHERE u.role = 'ROLE_EMPLOYEE' 
AND u.salary IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM salary_records sr 
    WHERE sr.user_id = u.id 
    AND sr.month = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND sr.year = EXTRACT(YEAR FROM CURRENT_DATE)
);

-- Insert sample overtime records
INSERT INTO overtime_records (user_id, date, hours_worked, description, status)
SELECT 
    u.id,
    CURRENT_DATE - INTERVAL '1 day',
    2 + (RANDOM() * 4)::INTEGER as hours_worked,
    'System initialization overtime' as description,
    'pending' as status
FROM users u 
WHERE u.role = 'ROLE_EMPLOYEE' 
AND u.salary IS NOT NULL
LIMIT 3;

COMMENT ON TABLE salary_records IS 'Modern salary management table with overtime support';
COMMENT ON TABLE overtime_records IS 'Overtime tracking table for employees';