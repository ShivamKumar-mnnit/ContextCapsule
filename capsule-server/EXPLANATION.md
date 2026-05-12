# Capsule Server — System Design & Explanation

## What It Is

Capsule Server is a **personal knowledge base as a service** built on the LLM-wiki pattern. It gives every user a persistent, tree-structured wiki where pages accumulate over time. Unlike RAG systems that re-derive answers from raw documents on every query, this server stores pre-structured knowledge — pages that grow richer as you add more sources.

The server has **no LLM inside it**. It is pure storage and retrieval. The intelligence (Ollama, Claude, GPT, any agent) lives on the client side. The client processes a source, decides what pages to create, and pushes them here via REST. The server stores them, maintains the tree structure and cross-references, and can compress selected pages into a shareable context capsule.

---

## Ecosystem

This server is one half of a two-server setup:

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT LAYER                    │
│   Browser Extension · MCP Server · Any LLM Agent   │
└────────────────┬───────────────────┬────────────────┘
                 │                   │
    ┌────────────▼──────┐   ┌────────▼──────────────┐
    │  capsule-server   │   │  contextcapsule.ai    │
    │  (this server)    │   │  (original server)    │
    │                   │   │                       │
    │  Wiki storage     │   │  Structured capsules  │
    │  Tree of pages    │   │  summary/decisions/   │
    │  Sources          │   │  next_steps/payload   │
    │  Cross-refs       │   │  Shareable by ID      │
    │  Context export   │   │  Expiry built in      │
    └───────────────────┘   └───────────────────────┘
         Port 3001 / Vercel       Port 3000 / Vercel
```

The two servers complement each other:
- **capsule-server** builds up knowledge over time (persistent, growing)
- **contextcapsule.ai** packages a snapshot of that knowledge for handoff (ephemeral, shareable)

The browser extension connects to both. When you export your wiki, it fetches the context from capsule-server and creates a capsule on contextcapsule.ai — giving it a shareable `cap_xxx` ID anyone can load.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Runtime** | Node.js 20 | Serverless-friendly, native fetch |
| **Framework** | Hono v4 | Ultra-lightweight, Vercel-native, same API as the original project |
| **ORM** | Drizzle ORM | Type-safe SQL, excellent Neon support, schema-as-code |
| **Database** | Neon PostgreSQL | Serverless Postgres with HTTP driver — works in Vercel edge |
| **Language** | TypeScript (strict) | Type safety across the entire codebase |
| **Deployment** | Vercel Serverless | Zero-config deploys, cron support, edge-ready |
| **Auth** | Bearer token (`ak_` prefix) + SHA-256 hash | Stateless, prefix-based lookup, same pattern as original |
| **Rate limiting** | In-memory sliding window | Per-key limits, no Redis needed at current scale |
| **Testing** | Vitest | Fast, ESM-native |

---

## Directory Structure

```
capsule-server/
├── api/
│   └── index.ts          Vercel serverless entry point (wraps Hono app)
├── src/
│   ├── index.ts          Hono app — routes, middleware, discovery endpoints
│   ├── dev.ts            Local dev server (port 3001)
│   ├── db/
│   │   ├── schema.ts     Drizzle table definitions — the data model
│   │   ├── client.ts     Neon DB connection factory
│   │   ├── migrate.ts    Applies migrations to the database
│   │   └── seed.ts       Creates an API key + wiki for an email
│   ├── lib/
│   │   ├── ids.ts        ID generators (wik_, pag_, src_, ak_, etc.) + slugify
│   │   ├── hash.ts       SHA-256 for API key hashing
│   │   ├── errors.ts     Consistent JSON error responses with request_id
│   │   ├── validate.ts   Type guards for page types, source types, cross-ref labels
│   │   ├── rate-limit.ts In-memory sliding window rate limiter
│   │   └── wiki-ops.ts   Core DB operations — the brain of the server
│   ├── middleware/
│   │   ├── security.ts   CORS, request ID, body size limit, security headers
│   │   ├── logger.ts     Structured JSON request logging
│   │   ├── api-key-auth.ts  Bearer token validation — prefix lookup + hash compare
│   │   └── rate-limit.ts   Rate limit middleware (60 req/min per key)
│   └── routes/
│       ├── auth.ts       POST /v1/auth/signup — creates API key + wiki
│       ├── wiki.ts       GET/PUT /v1/wiki — metadata, index
│       ├── pages.ts      CRUD + batch + cross-refs for wiki pages
│       ├── sources.ts    Store and retrieve raw source documents
│       ├── operations.ts POST /v1/wiki/capsule — compress wiki to context blob
│       └── log.ts        GET /v1/wiki/log — operations history
├── tests/
│   ├── lib/              Unit tests for ids, validate
│   └── routes/           Route-level tests
├── drizzle/
│   └── migrations/       Auto-generated SQL migrations
├── vercel.json           Vercel config — builds, routes, cron
├── drizzle.config.ts     Drizzle Kit config
├── package.json
└── .env.example
```

---

## Data Model

Six tables. Every table uses prefixed nanoid primary keys so IDs are readable and never collide.

### `api_keys` — Authentication
```
id           key_xxx...   Primary key
key_prefix   ak_06ee6b    First 11 chars of the raw key (for fast lookup)
key_hash     sha256(...)  Never store the raw key
owner_email  user@...     One key per email
tier         free         For future rate limiting tiers
wiki_id      wik_xxx      The wiki this key owns (1:1 relationship)
```
Auth works without a users table. The API key IS the user identity.

### `wikis` — One per user
```
id           wik_xxx
owner_key_id key_xxx      Links back to the API key that owns it
title        "My Wiki"    User-defined name
description  text         Optional
```

### `pages` — The core entity
```
id           pag_xxx
wiki_id      wik_xxx      Which wiki this belongs to
parent_id    pag_xxx      NULL = root node. Non-null = child in the tree
title        text         Human-readable name
slug         text         URL-safe version of title (unique per wiki)
content      text         Full markdown content of the page
type         text         concept | entity | source-summary | synthesis | query-result | overview
metadata     jsonb        Tags, source count, custom fields
```

Pages form a **tree via adjacency list** — each page optionally points to a parent. To get the full tree: fetch all pages for a wiki, build a Map by ID, then walk parent references. This is done in `GET /v1/wiki/pages?format=tree`.

### `cross_refs` — Graph edges between pages
```
id           ref_xxx
from_page_id pag_xxx      Source page
to_page_id   pag_xxx      Target page
label        text         related | contradicts | supports | extends
```
Pages have a primary tree structure (parent_id) AND a secondary graph (cross_refs). The tree gives hierarchy; the graph gives semantic connections. Together they form a rich knowledge structure that mirrors how ideas actually relate.

### `sources` — Immutable raw documents
```
id           src_xxx
wiki_id      wik_xxx
title        text         Name of the source
content      text         Full raw text (never modified after creation)
type         text         text | url | file
url          text         Original URL if clipped from the web
page_ids     text[]       Which pages were created from this source
```
Sources are write-once. You can always trace any page back to the source it came from.

### `ops_log` — Append-only history
```
id           log_xxx
wiki_id      wik_xxx
type         text         ingest | capsule | query
summary      text         Human-readable one-line description
detail       jsonb        Structured metadata about the operation
created_at   timestamp
```
Every meaningful operation appends a log entry. This gives you a full timeline of how the wiki evolved.

---

## Request Lifecycle

Every request flows through the same middleware stack before hitting a route:

```
Request
  │
  ├─ CORS headers
  ├─ Security headers (X-Frame-Options, nosniff, referrer)
  ├─ Request ID (req_xxx — generated or passed through)
  ├─ Body size limit (512 KB)
  ├─ Request logger (JSON to stdout)
  │
  ├─ [Route middleware]
  │   ├─ apiKeyAuth — extracts Bearer token, prefix-lookup in DB, SHA-256 compare
  │   └─ rateLimitByApiKey — 60 req/min sliding window per key
  │
  └─ Route handler → JSON response
```

### Auth flow in detail

```
Client sends: Authorization: Bearer ak_06ee6b...
                                      ↑
                              First 11 chars = prefix

1. Extract prefix from header (no DB hit needed to narrow candidates)
2. SELECT * FROM api_keys WHERE key_prefix = 'ak_06ee6b'
3. SHA-256 hash the full key from the header
4. Compare hash to key_hash in DB
5. If match → set apiKeyRecord on context → next()
6. apiKeyRecord.wikiId gives us the wiki for this request — no separate lookup needed
```

This two-step approach (prefix lookup → hash compare) means we never store or transmit the raw API key after creation, and we avoid full-table scans.

---

## Core Operations

### 1. Store a Source
`POST /v1/wiki/sources`

The client clips a web page or pastes text. The server stores it verbatim — immutable. Returns a `src_xxx` ID. No processing happens here.

```
Client → { title, content, type, url }
Server → INSERT into sources → { source_id: "src_xxx" }
```

### 2. Create Pages (Batch)
`POST /v1/wiki/pages/batch`

This is how the wiki actually grows. The client (running Ollama or any LLM locally) reads the source, decides what pages to create, and sends them all at once. The server handles:

- **Pass 1** — Insert all new pages, generate IDs, resolve slug conflicts
- **Pass 2** — Set `parent_id` by matching `parent_title` against existing page titles, create `cross_refs` by matching `cross_ref_titles` against the title→ID map

The two-pass approach is necessary because pages in the same batch can reference each other — a page can name another new page as its parent or cross-ref before that page has an ID.

```
Client → {
  source_id: "src_xxx",
  pages: [
    { title: "Machine Learning", type: "concept", content: "..." },
    { title: "Neural Networks",  type: "concept", content: "...",
      parent_title: "Machine Learning",
      cross_ref_titles: ["Backpropagation"] }
  ]
}
Server → { created_page_ids: ["pag_aaa", "pag_bbb"], count: 2 }
```

### 3. Export as Capsule
`POST /v1/wiki/capsule`

Compresses selected pages into a flat markdown document ready to use as LLM context. Respects a character budget — stops adding pages once `max_chars` is reached.

```
Client → { page_ids?: [...], max_chars?: 32000, label?: "ML overview" }
Server →
  1. Fetch pages (all, or the specified subset)
  2. Format each as "## Title [type]\ncontent"
  3. Join with "---" separators
  4. Add header (wiki name, page count, timestamp)
  5. Log the export to ops_log
  6. Return { capsule_text, page_count, char_count, truncated, wiki_title }
```

The client then takes `capsule_text` and POSTs it to contextcapsule.ai to get a shareable `cap_xxx` ID.

---

## Tree Structure

Pages form a tree using the **adjacency list** pattern — the simplest and most flexible approach for this scale.

```
wik_abc
  └─ pag_001  "Artificial Intelligence"     [overview]    parent: null
       ├─ pag_002  "Machine Learning"        [concept]    parent: pag_001
       │    ├─ pag_004  "Supervised"         [concept]    parent: pag_002
       │    └─ pag_005  "Unsupervised"       [concept]    parent: pag_002
       └─ pag_003  "Neural Networks"         [concept]    parent: pag_001
            └─ pag_006  "Transformers"       [entity]     parent: pag_003
```

On top of the tree, cross-refs add semantic links that cut across the hierarchy:
```
pag_005 ──[related]──► pag_004    (Unsupervised ↔ Supervised)
pag_006 ──[extends]──► pag_003    (Transformers extends Neural Networks)
pag_004 ──[supports]──► pag_002   (Supervised supports ML)
```

The tree gives **navigation** (browse up/down a topic). The cross-refs give **synthesis** (how ideas connect across branches). Together they make the wiki navigable in two dimensions.

---

## ID System

Every entity gets a prefixed nanoid. The prefix makes IDs self-describing in logs, API responses, and the database.

| Prefix | Entity | Example |
|---|---|---|
| `ak_` | API key (raw, shown once) | `ak_06ee6bb258...` |
| `key_` | API key record (DB row) | `key_xK9mP2...` |
| `wik_` | Wiki | `wik_nZTWQ5o6un...` |
| `pag_` | Page | `pag_R7mKx3...` |
| `src_` | Source | `src_Lp9Qw2...` |
| `ref_` | Cross-ref | `ref_Jk4Mn8...` |
| `log_` | Ops log entry | `log_Vr2Cx5...` |
| `req_` | Request ID (per HTTP request) | `req_Wy8Nk3...` |

---

## Rate Limiting

In-memory sliding window, no Redis. Each API key gets 60 requests per minute. The window map is cleaned up every 60 seconds to prevent memory growth.

```
windows: Map<"apikey:key_xxx", { count: number, resetAt: number }>

On each request:
1. Check if entry exists and hasn't expired
2. If fresh window: count = 1, resetAt = now + 60s
3. If existing window: count++
4. If count > 60: return 429 with Retry-After headers
```

Rate limit headers are always returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## API Reference

All routes require `Authorization: Bearer ak_...` except `/v1/auth/signup` and `/health`.

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/v1/auth/signup` | `{ email, wiki_title? }` | `{ api_key, wiki_id }` |

### Wiki
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/v1/wiki` | — | `{ wiki: { ...metadata, page_count, source_count } }` |
| PUT | `/v1/wiki` | `{ title?, description? }` | `{ wiki }` |
| GET | `/v1/wiki/index` | — | `{ index: { total, byType, pages } }` |

### Pages
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/v1/wiki/pages` | `?format=flat\|tree` | `{ pages, total }` |
| POST | `/v1/wiki/pages` | `{ title, content?, type?, parent_id? }` | `{ page }` |
| POST | `/v1/wiki/pages/batch` | `{ pages: [...], source_id? }` | `{ created_page_ids, count }` |
| GET | `/v1/wiki/pages/:id` | — | `{ page, cross_refs, back_refs }` |
| PUT | `/v1/wiki/pages/:id` | `{ title?, content?, type?, parent_id? }` | `{ page }` |
| DELETE | `/v1/wiki/pages/:id` | — | 204 |
| POST | `/v1/wiki/pages/cross-refs` | `{ from_page_id, to_page_id, label? }` | `{ id, label }` |
| DELETE | `/v1/wiki/pages/cross-refs/:id` | — | 204 |

### Sources
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/v1/wiki/sources` | `{ title, content, type?, url? }` | `{ source_id }` |
| GET | `/v1/wiki/sources` | — | `{ sources, total }` |
| GET | `/v1/wiki/sources/:id` | — | `{ source }` |

### Capsule Export
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/v1/wiki/capsule` | `{ page_ids?, max_chars?, label? }` | `{ capsule_text, page_count, char_count, truncated, wiki_title }` |

### Log
| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/v1/wiki/log` | `?limit=50&offset=0&type=ingest\|capsule` | `{ log, count }` |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `DEV_SECRET` | No | Protects the `/dev/console` route |
| `CRON_SECRET` | No | Vercel calls `/cron/cleanup` with this as Bearer token |
| `BASE_URL` | No | Full deployment URL (used in OpenAPI spec) |

---

## Discovery Endpoints

The server is designed to be discoverable by LLM agents and API tools without prior knowledge.

| Path | Purpose |
|---|---|
| `/health` | Liveness check — `{ status: "ok", service: "capsule-server" }` |
| `/llms.txt` | Plain-text description for LLMs — explains the API in natural language |
| `/.well-known/openapi.json` | Full OpenAPI 3.1 spec — compatible with any OpenAPI client |

---

## Deployment

Deployed on Vercel Serverless via `api/index.ts` which wraps the Hono app using `hono/vercel`:

```
vercel.json
  builds: api/index.ts → @vercel/node
  routes: all traffic → /api/index.ts
  crons:  /cron/cleanup runs daily at 02:00 UTC
```

The Neon driver (`@neondatabase/serverless`) uses HTTP mode which works in Vercel's serverless environment without persistent connections — each function invocation opens a fresh HTTP request to Neon rather than a TCP connection.

**Production URL:** `https://context-capsule-two.vercel.app`

---

## How It Fits the LLM-Wiki Pattern

The LLM-wiki pattern (from the design document) describes three layers:

| Layer | Description | In this server |
|---|---|---|
| **Raw sources** | Immutable input documents | `sources` table — write-once, never modified |
| **The wiki** | LLM-maintained structured pages | `pages` + `cross_refs` tables — tree + graph |
| **The schema** | Rules for how the wiki is maintained | The API contract + page types + cross-ref labels |

The key insight: the wiki is a **compounding artifact**. Every source you add makes it richer. Every cross-ref you create adds a connection that would otherwise have to be re-derived on every query. By the time you export a capsule, all the synthesis has already been done — the context blob is ready-made rather than assembled from scratch.

This server stores that compounding artifact and provides the API that agents and the browser extension use to read from it and write to it.
