-- Add adminAction field to applications table
ALTER TABLE "applications" ADD COLUMN "admin_action" boolean DEFAULT false;