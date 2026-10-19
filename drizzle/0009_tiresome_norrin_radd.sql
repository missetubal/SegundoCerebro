CREATE TABLE "medication_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"medication_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"scheduled_time" text NOT NULL,
	"status" text NOT NULL,
	"taken_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medication" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"instructions" text,
	"frequency_kind" text NOT NULL,
	"weekdays" integer[],
	"times" text[] NOT NULL,
	"starts_on" date NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medication_log" ADD CONSTRAINT "medication_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_log" ADD CONSTRAINT "medication_log_medication_id_medication_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication" ADD CONSTRAINT "medication_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "medication_log_user_med_date_time_unique" ON "medication_log" USING btree ("user_id","medication_id","entry_date","scheduled_time");--> statement-breakpoint
CREATE INDEX "medication_log_user_date_idx" ON "medication_log" USING btree ("user_id","entry_date");--> statement-breakpoint
CREATE INDEX "medication_user_archived_idx" ON "medication" USING btree ("user_id","archived_at");