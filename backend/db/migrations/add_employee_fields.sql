-- Add new comprehensive employee fields to the users table
-- This migration adds all the new fields for enhanced employee management

ALTER TABLE users
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS work_location VARCHAR(255) DEFAULT 'Office',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS probation_end TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS address TEXT NULL,
ADD COLUMN IF NOT EXISTS city VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS country VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS gender VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS manager_id INTEGER NULL REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS skills TEXT NULL,
ADD COLUMN IF NOT EXISTS experience TEXT NULL,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Add constraint for email uniqueness
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add comments for documentation
COMMENT ON COLUMN users.employment_type IS 'Employment type: Full-time, Part-time, Contract, Intern';
COMMENT ON COLUMN users.work_location IS 'Work location: Office, Remote, Hybrid';
COMMENT ON COLUMN users.start_date IS 'Employment start date';
COMMENT ON COLUMN users.end_date IS 'Employment end date (for contractors/terminated employees)';
COMMENT ON COLUMN users.probation_end IS 'Probation period end date';
COMMENT ON COLUMN users.email IS 'Employee email address (required and unique)';
COMMENT ON COLUMN users.phone IS 'Employee phone number';
COMMENT ON COLUMN users.address IS 'Employee home address';
COMMENT ON COLUMN users.city IS 'Employee city';
COMMENT ON COLUMN users.country IS 'Employee country';
COMMENT ON COLUMN users.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN users.gender IS 'Employee gender';
COMMENT ON COLUMN users.marital_status IS 'Employee marital status';
COMMENT ON COLUMN users.emergency_contact IS 'Emergency contact name';
COMMENT ON COLUMN users.emergency_phone IS 'Emergency contact phone';
COMMENT ON COLUMN users.manager_id IS 'Direct manager reference';
COMMENT ON COLUMN users.reports_to IS 'Manager name for easy access';
COMMENT ON COLUMN users.skills IS 'Employee skills and competencies';
COMMENT ON COLUMN users.experience IS 'Professional experience';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp';