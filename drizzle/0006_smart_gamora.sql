ALTER TABLE "sites" ALTER COLUMN "color" SET DEFAULT '#18181b';--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "created_via" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "claim_token" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_sites_claim_token" ON "sites" USING btree ("claim_token");