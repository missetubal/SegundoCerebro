ALTER TABLE "pillar" RENAME TO "area";--> statement-breakpoint
ALTER INDEX "pillar_user_name_unique" RENAME TO "area_user_name_unique";--> statement-breakpoint
ALTER INDEX "pillar_user_sort_idx" RENAME TO "area_user_sort_idx";--> statement-breakpoint
ALTER TABLE "area" RENAME CONSTRAINT "pillar_user_id_user_id_fk" TO "area_user_id_user_id_fk";
