ALTER TABLE "applications" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;