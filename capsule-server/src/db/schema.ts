import {
  pgTable, text, integer, jsonb, timestamp, uniqueIndex, index, primaryKey
} from 'drizzle-orm/pg-core'

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  ownerEmail: text('owner_email').notNull(),
  tier: text('tier').notNull().default('free'),
  wikiId: text('wiki_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  usageCount: integer('usage_count').default(0),
  usageResetAt: timestamp('usage_reset_at', { withTimezone: true }),
}, (table) => [
  index('idx_api_keys_prefix').on(table.keyPrefix),
  uniqueIndex('idx_api_keys_email').on(table.ownerEmail),
])

export const wikis = pgTable('wikis', {
  id: text('id').primaryKey(),
  ownerKeyId: text('owner_key_id').notNull(),
  title: text('title').notNull().default('My Wiki'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_wikis_owner').on(table.ownerKeyId),
])

export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  wikiId: text('wiki_id').notNull(),
  parentId: text('parent_id'),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull().default(''),
  // concept | entity | source-summary | synthesis | query-result | overview
  type: text('type').notNull().default('concept'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_pages_wiki').on(table.wikiId),
  index('idx_pages_parent').on(table.parentId),
  uniqueIndex('idx_pages_wiki_slug').on(table.wikiId, table.slug),
])

export const crossRefs = pgTable('cross_refs', {
  id: text('id').primaryKey(),
  fromPageId: text('from_page_id').notNull(),
  toPageId: text('to_page_id').notNull(),
  // related | contradicts | supports | extends
  label: text('label').default('related'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('idx_cross_refs_pair').on(table.fromPageId, table.toPageId),
  index('idx_cross_refs_from').on(table.fromPageId),
  index('idx_cross_refs_to').on(table.toPageId),
])

export const sources = pgTable('sources', {
  id: text('id').primaryKey(),
  wikiId: text('wiki_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  // text | url | file
  type: text('type').notNull().default('text'),
  url: text('url'),
  pageIds: text('page_ids').array().default([]),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_sources_wiki').on(table.wikiId),
])

export const opsLog = pgTable('ops_log', {
  id: text('id').primaryKey(),
  wikiId: text('wiki_id').notNull(),
  // ingest | query | lint
  type: text('type').notNull(),
  summary: text('summary').notNull(),
  detail: jsonb('detail').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_ops_log_wiki').on(table.wikiId),
  index('idx_ops_log_created').on(table.createdAt),
])
