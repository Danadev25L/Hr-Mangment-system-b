-- Create calendar_events table for managing calendar events
-- This table stores meetings, deadlines, holidays, birthdays, training, and review events

CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL CHECK (type IN ('meeting', 'deadline', 'holiday', 'birthday', 'training', 'review')),
  "date" DATE NOT NULL,
  "time" TIME,
  "description" TEXT,
  "created_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "calendar_events_date_idx" ON "calendar_events" ("date");
CREATE INDEX IF NOT EXISTS "calendar_events_type_idx" ON "calendar_events" ("type");
CREATE INDEX IF NOT EXISTS "calendar_events_created_by_idx" ON "calendar_events" ("created_by");

-- Add comment to table
COMMENT ON TABLE "calendar_events" IS 'Stores calendar events including meetings, deadlines, holidays, birthdays, training sessions, and reviews';
COMMENT ON COLUMN "calendar_events"."type" IS 'Event type: meeting, deadline, holiday, birthday, training, or review';
COMMENT ON COLUMN "calendar_events"."date" IS 'Date of the event';
COMMENT ON COLUMN "calendar_events"."time" IS 'Optional time of the event';
