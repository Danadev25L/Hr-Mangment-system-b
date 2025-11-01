-- Add missing employee fields to users table
-- This migration adds fields that are referenced in the admin controller but don't exist in the schema

-- Add manager tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to VARCHAR(255);

-- Add employment details fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100) DEFAULT 'Full-time';
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_location VARCHAR(255) DEFAULT 'Office';
ALTER TABLE users ADD COLUMN IF NOT EXISTS probation_end TIMESTAMP;

-- Add professional details
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add organization tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);