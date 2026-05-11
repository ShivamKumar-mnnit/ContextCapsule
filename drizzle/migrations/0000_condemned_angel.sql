CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"owner_email" text NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"usage_count" integer DEFAULT 0,
	"usage_reset_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "capsules" (
	"id" text PRIMARY KEY NOT NULL,
	"api_key_id" text NOT NULL,
	"summary" text NOT NULL,
	"decisions" jsonb,
	"next_steps" jsonb,
	"payload" jsonb,
	"refs" jsonb,
	"idempotency_key" text,
	"audience" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_capsules_idempotency" ON "capsules" USING btree ("api_key_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_capsules_expires_at" ON "capsules" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_capsules_api_key_id" ON "capsules" USING btree ("api_key_id");