ALTER TABLE "applications" ALTER COLUMN "job_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_type" varchar(50);