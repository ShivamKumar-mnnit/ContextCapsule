CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"owner_email" text NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"wiki_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"usage_count" integer DEFAULT 0,
	"usage_reset_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "cross_refs" (
	"id" text PRIMARY KEY NOT NULL,
	"from_page_id" text NOT NULL,
	"to_page_id" text NOT NULL,
	"label" text DEFAULT 'related',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_log" (
	"id" text PRIMARY KEY NOT NULL,
	"wiki_id" text NOT NULL,
	"type" text NOT NULL,
	"summary" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"wiki_id" text NOT NULL,
	"parent_id" text,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'concept' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"wiki_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"url" text,
	"page_ids" text[] DEFAULT '{}',
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wikis" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_key_id" text NOT NULL,
	"title" text DEFAULT 'My Wiki' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_api_keys_email" ON "api_keys" USING btree ("owner_email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cross_refs_pair" ON "cross_refs" USING btree ("from_page_id","to_page_id");--> statement-breakpoint
CREATE INDEX "idx_cross_refs_from" ON "cross_refs" USING btree ("from_page_id");--> statement-breakpoint
CREATE INDEX "idx_cross_refs_to" ON "cross_refs" USING btree ("to_page_id");--> statement-breakpoint
CREATE INDEX "idx_ops_log_wiki" ON "ops_log" USING btree ("wiki_id");--> statement-breakpoint
CREATE INDEX "idx_ops_log_created" ON "ops_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pages_wiki" ON "pages" USING btree ("wiki_id");--> statement-breakpoint
CREATE INDEX "idx_pages_parent" ON "pages" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pages_wiki_slug" ON "pages" USING btree ("wiki_id","slug");--> statement-breakpoint
CREATE INDEX "idx_sources_wiki" ON "sources" USING btree ("wiki_id");--> statement-breakpoint
CREATE INDEX "idx_wikis_owner" ON "wikis" USING btree ("owner_key_id");