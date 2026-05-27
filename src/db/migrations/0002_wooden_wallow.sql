CREATE TABLE "community_needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_original" text NOT NULL,
	"query_expanded" text,
	"name" text,
	"email" text,
	"whatsapp" text,
	"zone" text,
	"category_hint_id" uuid,
	"urgency" text,
	"budget" text,
	"consent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"matched_results" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "need_search_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"need_id" uuid,
	"query" text NOT NULL,
	"results_count" integer DEFAULT 0 NOT NULL,
	"clicked_business_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_needs" ADD CONSTRAINT "community_needs_category_hint_id_categories_id_fk" FOREIGN KEY ("category_hint_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_search_logs" ADD CONSTRAINT "need_search_logs_need_id_community_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."community_needs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_search_logs" ADD CONSTRAINT "need_search_logs_clicked_business_id_businesses_id_fk" FOREIGN KEY ("clicked_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_needs_status_created_idx" ON "community_needs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "community_needs_created_idx" ON "community_needs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "need_search_logs_created_idx" ON "need_search_logs" USING btree ("created_at");