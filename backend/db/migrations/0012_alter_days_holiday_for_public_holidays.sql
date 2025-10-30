-- Migration: Convert days_holiday to public holidays table
-- This backs up the old leave request data and recreates the table for public holidays

-- Step 1: Rename the old table to preserve data
ALTER TABLE "days_holiday" RENAME TO "days_holiday_old_leave_requests";

-- Step 2: Create new days_holiday table for public holidays (without organization)
CREATE TABLE "days_holiday" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"name" varchar(255),
	"description" text,
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

-- Step 3: Create index for faster date queries
CREATE INDEX "days_holiday_date_idx" ON "days_holiday"("date");

-- Note: The old leave request data is preserved in "days_holiday_old_leave_requests" table
-- You can drop it manually after verifying the migration: DROP TABLE "days_holiday_old_leave_requests";
