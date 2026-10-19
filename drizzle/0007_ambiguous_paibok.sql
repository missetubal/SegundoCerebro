CREATE TABLE "goal" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"primary_area_id" text NOT NULL,
	"horizon_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date,
	"target_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_area" (
	"habit_id" text NOT NULL,
	"area_id" text NOT NULL,
	CONSTRAINT "habit_area_habit_id_area_id_pk" PRIMARY KEY("habit_id","area_id")
);
--> statement-breakpoint
CREATE TABLE "habit" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"tracking_type" text NOT NULL,
	"frequency_kind" text NOT NULL,
	"weekdays" integer[],
	"target_value" integer,
	"unit" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_step" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal" ADD CONSTRAINT "goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal" ADD CONSTRAINT "goal_primary_area_id_area_id_fk" FOREIGN KEY ("primary_area_id") REFERENCES "public"."area"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal" ADD CONSTRAINT "goal_horizon_id_horizon_id_fk" FOREIGN KEY ("horizon_id") REFERENCES "public"."horizon"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_area" ADD CONSTRAINT "habit_area_habit_id_habit_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_area" ADD CONSTRAINT "habit_area_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit" ADD CONSTRAINT "habit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_step" ADD CONSTRAINT "next_step_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_step" ADD CONSTRAINT "next_step_goal_id_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_user_status_idx" ON "goal" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "goal_user_primary_area_idx" ON "goal" USING btree ("user_id","primary_area_id");--> statement-breakpoint
CREATE INDEX "habit_user_archived_idx" ON "habit" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "next_step_goal_idx" ON "next_step" USING btree ("goal_id");