ALTER TABLE "applications" ADD COLUMN "title" varchar(255) DEFAULT 'Application' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "priority" varchar(20) DEFAULT 'medium';