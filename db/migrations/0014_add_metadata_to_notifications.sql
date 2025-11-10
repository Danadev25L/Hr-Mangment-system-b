-- Add metadata column to notifications table for storing additional contextual data
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index on notification type for faster filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add index on userId and isRead for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Add index on relatedId for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id) WHERE related_id IS NOT NULL;

-- Add index on createdAt for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Add composite index for user notifications ordering
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
