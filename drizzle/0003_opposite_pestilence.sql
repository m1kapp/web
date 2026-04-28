CREATE TABLE "daily_device_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"date" date NOT NULL,
	"device" text DEFAULT '' NOT NULL,
	"browser" text DEFAULT '' NOT NULL,
	"os" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_geo_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"date" date NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_hour_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"date" date NOT NULL,
	"hour" integer NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "total_hits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_device_stats" ADD CONSTRAINT "daily_device_stats_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_geo_stats" ADD CONSTRAINT "daily_geo_stats_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_hour_stats" ADD CONSTRAINT "daily_hour_stats_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_device_stats_unique" ON "daily_device_stats" USING btree ("site_id","date","device","browser","os");--> statement-breakpoint
CREATE INDEX "idx_daily_device_stats_site" ON "daily_device_stats" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_geo_stats_unique" ON "daily_geo_stats" USING btree ("site_id","date","country","city");--> statement-breakpoint
CREATE INDEX "idx_daily_geo_stats_site" ON "daily_geo_stats" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_hour_stats_unique" ON "daily_hour_stats" USING btree ("site_id","date","hour");--> statement-breakpoint
CREATE INDEX "idx_daily_hour_stats_site" ON "daily_hour_stats" USING btree ("site_id");--> statement-breakpoint
-- 기존 데이터 백필
UPDATE "sites" SET "total_hits" = COALESCE((
  SELECT SUM("count") FROM "hits" WHERE "hits"."site_id" = "sites"."id"
), 0);--> statement-breakpoint
INSERT INTO "daily_geo_stats" ("site_id", "date", "country", "city", "count")
SELECT
  "site_id",
  DATE("created_at" AT TIME ZONE 'Asia/Seoul') AS "date",
  COALESCE("country", '') AS "country",
  COALESCE("city", '') AS "city",
  COUNT(*) AS "count"
FROM "hit_logs"
GROUP BY "site_id", DATE("created_at" AT TIME ZONE 'Asia/Seoul'), COALESCE("country", ''), COALESCE("city", '')
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "daily_device_stats" ("site_id", "date", "device", "browser", "os", "count")
SELECT
  "site_id",
  DATE("created_at" AT TIME ZONE 'Asia/Seoul') AS "date",
  COALESCE("device", '') AS "device",
  COALESCE("browser", '') AS "browser",
  COALESCE("os", '') AS "os",
  COUNT(*) AS "count"
FROM "hit_logs"
GROUP BY "site_id", DATE("created_at" AT TIME ZONE 'Asia/Seoul'), COALESCE("device", ''), COALESCE("browser", ''), COALESCE("os", '')
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "daily_hour_stats" ("site_id", "date", "hour", "count")
SELECT
  "site_id",
  DATE("created_at" AT TIME ZONE 'Asia/Seoul') AS "date",
  EXTRACT(HOUR FROM "created_at" AT TIME ZONE 'Asia/Seoul')::integer AS "hour",
  COUNT(*) AS "count"
FROM "hit_logs"
GROUP BY "site_id", DATE("created_at" AT TIME ZONE 'Asia/Seoul'), EXTRACT(HOUR FROM "created_at" AT TIME ZONE 'Asia/Seoul')::integer
ON CONFLICT DO NOTHING;
