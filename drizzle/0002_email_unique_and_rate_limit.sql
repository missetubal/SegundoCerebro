DROP TABLE "login_failure";--> statement-breakpoint
CREATE TABLE "login_failure" (
	"email" text PRIMARY KEY NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
UPDATE "user" SET "email" = lower("email") WHERE "email" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_lower_idx" ON "user" USING btree (lower("email"));
