CREATE TABLE "hit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"ip_hash" text NOT NULL,
	"country" text,
	"city" text,
	"device" text,
	"browser" text,
	"os" text,
	"referer" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hits" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"slug" text NOT NULL,
	"title" text,
	"url" text,
	"color" text DEFAULT '#ec4899',
	"badge_style" text DEFAULT 'flat',
	"badge_label" text DEFAULT 'm1k',
	"badge_emoji" text,
	"og_title" text,
	"og_description" text,
	"og_image" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "hit_logs" ADD CONSTRAINT "hit_logs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hits" ADD CONSTRAINT "hits_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_hits_site_date" ON "hits" USING btree ("site_id","date");