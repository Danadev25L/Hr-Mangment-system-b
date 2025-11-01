-- Add rejection tracking fields to applications table
ALTER TABLE applications
ADD COLUMN rejected_by INTEGER REFERENCES users(id),
ADD COLUMN rejected_at TIMESTAMP;

-- Add comment for clarity
COMMENT ON COLUMN applications.rejected_by IS 'User ID who rejected the application';
COMMENT ON COLUMN applications.rejected_at IS 'Timestamp when application was rejected';
