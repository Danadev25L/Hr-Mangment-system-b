-- Add job posting fields to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Remote',
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100) DEFAULT 'Full-time',
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS external_posting_url TEXT;

-- Create applications table for job applications
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    cover_letter TEXT,
    experience TEXT,
    education TEXT,
    skills TEXT,
    resume_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    review_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_department_id ON jobs(department_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_start_date ON jobs(start_date);
CREATE INDEX IF NOT EXISTS idx_jobs_end_date ON jobs(end_date);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Update existing jobs to have department_id based on user's department
UPDATE jobs 
SET department_id = users.department_id,
    created_by = user_id
FROM users 
WHERE jobs.user_id = users.id 
AND jobs.department_id IS NULL;