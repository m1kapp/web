CREATE TABLE "point_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"target_site_id" integer,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"bonus_claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "points_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "path" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "reached_1000_at" timestamp with time zone;