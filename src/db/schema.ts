import { pgTable, text, integer, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const capsules = pgTable('capsules', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').notNull(),
  summary: text('summary').notNull(),
  decisions: jsonb('decisions'),
  nextSteps: jsonb('next_steps'),
  payload: jsonb('payload'),
  refs: jsonb('refs'),
  idempotencyKey: text('idempotency_key'),
  audience: text('audience'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex('idx_capsules_idempotency').on(table.apiKeyId, table.idempotencyKey),
  index('idx_capsules_expires_at').on(table.expiresAt),
  index('idx_capsules_api_key_id').on(table.apiKeyId),
])

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  ownerEmail: text('owner_email').notNull(),
  tier: text('tier').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  usageCount: integer('usage_count').default(0),
  usageResetAt: timestamp('usage_reset_at', { withTimezone: true }),
}, (table) => [
  index('idx_api_keys_prefix').on(table.keyPrefix),
])
