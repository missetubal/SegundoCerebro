-- Idempotent: some databases already ran this migration as 0001_pillars_and_horizons before it was renumbered.
CREATE TABLE IF NOT EXISTS "horizon" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pillar" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"sort_order" integer NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN IF NOT EXISTS "horizons_seeded_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "horizon" ADD CONSTRAINT "horizon_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pillar" ADD CONSTRAINT "pillar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "horizon_user_name_unique" ON "horizon" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "horizon_user_sort_idx" ON "horizon" USING btree ("user_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pillar_user_name_unique" ON "pillar" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pillar_user_sort_idx" ON "pillar" USING btree ("user_id","sort_order");
