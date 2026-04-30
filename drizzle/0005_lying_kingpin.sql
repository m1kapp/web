ALTER TABLE "sites" ALTER COLUMN "badge_style" SET DEFAULT 'cyworld';--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "badge_color" text DEFAULT '000000';--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "favicon_url" text;