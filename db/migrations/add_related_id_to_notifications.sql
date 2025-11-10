-- Add related_id column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id INTEGER;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);

-- Add comment
COMMENT ON COLUMN notifications.related_id IS 'ID of related entity (announcement ID, application ID, etc.)';
