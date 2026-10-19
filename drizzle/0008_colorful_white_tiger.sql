CREATE TABLE "daily_check_in" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"general_note" text,
	"mood" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"completion_status" text,
	"value" integer,
	"unit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_check_in" ADD CONSTRAINT "daily_check_in_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_log" ADD CONSTRAINT "habit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_log" ADD CONSTRAINT "habit_log_habit_id_habit_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_check_in_user_date_unique" ON "daily_check_in" USING btree ("user_id","entry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_log_user_habit_date_unique" ON "habit_log" USING btree ("user_id","habit_id","entry_date");--> statement-breakpoint
CREATE INDEX "habit_log_user_date_idx" ON "habit_log" USING btree ("user_id","entry_date");