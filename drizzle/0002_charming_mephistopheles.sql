ALTER TABLE "sites" ADD COLUMN "owner_handle" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "owner_name" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "owner_image_url" text;--> statement-breakpoint
CREATE INDEX "idx_hit_logs_site_id" ON "hit_logs" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_point_logs_user_id" ON "point_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_point_logs_target_site_id" ON "point_logs" USING btree ("target_site_id");--> statement-breakpoint
CREATE INDEX "idx_sites_user_id" ON "sites" USING btree ("user_id");