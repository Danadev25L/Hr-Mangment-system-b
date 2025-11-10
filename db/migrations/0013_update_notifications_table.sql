-- Migration: Update notifications table to add relatedId and update type field
-- Date: 2025-01-XX

-- Add related_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'related_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN related_id INTEGER;
  END IF;
END $$;

-- Add read_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
  END IF;
END $$;

-- Update type column to remove default value
ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;
