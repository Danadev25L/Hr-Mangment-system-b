-- Add announcement recipients table for granular notification control
CREATE TABLE IF NOT EXISTS "announcement_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_announcement_id_department_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "department_announcement"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add created_by field to department_announcement table
ALTER TABLE "department_announcement" ADD COLUMN IF NOT EXISTS "created_by" integer;

-- Add foreign key for created_by
DO $$ BEGIN
 ALTER TABLE "department_announcement" ADD CONSTRAINT "department_announcement_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create unique index to prevent duplicate recipients
CREATE UNIQUE INDEX IF NOT EXISTS "unique_announcement_recipient" ON "announcement_recipients" ("announcement_id", "user_id");