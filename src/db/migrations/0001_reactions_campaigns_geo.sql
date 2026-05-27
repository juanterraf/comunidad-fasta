CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"color_hex" text DEFAULT '#c4502c' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"cta_text" text,
	"cta_href" text,
	"category_ids" uuid[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"anon_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "story" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "is_featured_story" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_active_idx" ON "campaigns" USING btree ("is_active","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_unique_per_anon" ON "reactions" USING btree ("business_id","kind","anon_id");--> statement-breakpoint
CREATE INDEX "reactions_business_idx" ON "reactions" USING btree ("business_id");