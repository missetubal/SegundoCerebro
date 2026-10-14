CREATE TABLE "horizon" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pillar" (
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
ALTER TABLE "user_preference" ADD COLUMN "horizons_seeded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "horizon" ADD CONSTRAINT "horizon_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pillar" ADD CONSTRAINT "pillar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "horizon_user_name_unique" ON "horizon" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "horizon_user_sort_idx" ON "horizon" USING btree ("user_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "pillar_user_name_unique" ON "pillar" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "pillar_user_sort_idx" ON "pillar" USING btree ("user_id","sort_order");