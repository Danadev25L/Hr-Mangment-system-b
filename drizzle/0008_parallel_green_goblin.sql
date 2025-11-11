CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"applicant_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"cover_letter" text,
	"experience" text,
	"education" text,
	"skills" text,
	"resume_url" text,
	"status" varchar(50) DEFAULT 'pending',
	"review_notes" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_applications_job_id_email_unique" UNIQUE("job_id","email")
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "job_title" varchar(255);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "requirements" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "location" varchar(255) DEFAULT 'Remote';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "employment_type" varchar(100) DEFAULT 'Full-time';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "external_posting_url" text;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;