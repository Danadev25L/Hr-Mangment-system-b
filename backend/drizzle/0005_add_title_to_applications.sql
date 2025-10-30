-- Add title column to applications table to match `db/schema.js`
-- Make it NOT NULL with a default empty string to avoid migration failure on existing rows
ALTER TABLE "applications" ADD COLUMN "title" varchar(255) DEFAULT '' NOT NULL;
