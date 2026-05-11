# Context Capsule — Design Document

## What It Is

Portable handoff packets for agent workflows. A structured, compressed, ephemeral context API that agents use to pass working knowledge between sessions, agents, and frameworks.

**Sister product to [ProofSlip](https://proofslip.ai).** ProofSlip = verification layer ("did it happen?"). Context Capsule = knowledge layer ("what do I need to know?").

**Domain:** contextcapsule.ai

## The Problem

When agents hand off work, context is lost. The options today are:
- **Full conversation dump** — 50k tokens of noise to find 500 tokens of signal
- **Lossy summary** — misses decisions, open questions, structured data
- **Shared database** — couples agents, no expiry, no structure, no portability

There is no standard, framework-agnostic protocol for structured agent handoffs.

## The Solution

A simple API: create a capsule, fetch a capsule, capsules expire.

Capsules are **immutable** once created. Need to update? Create a new one referencing the old via `parent_capsule_id`. Same pattern as ProofSlip receipts.

## Messaging

- **Tagline:** "portable context for agent workflows"
- **Headline:** "The context your agents need — nothing they don't."
- **Closer:** "capsules expire, knowledge transfers."

## Architecture

**Approach:** Standalone clone of ProofSlip's infrastructure (Approach A). Separate Hono app, own Neon database, own Vercel deployment, own API keys. Independent evolution, pricing, and branding. Shared design language (Departure Mono, dark theme, green accents).

### Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Hono v4
- **ORM:** Drizzle ORM + Neon PostgreSQL
- **Language:** TypeScript (strict mode)
- **Deployment:** Vercel serverless
- **Testing:** Vitest
- **MCP:** @modelcontextprotocol/sdk

### API Surface

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `POST` | `/v1/capsules` | API Key | 60/min key | Create capsule |
| `GET` | `/v1/capsules/:id` | None | 120/min IP | Fetch capsule (JSON or HTML) |
| `GET` | `/capsule/:id` | None | 120/min IP | Short URL fetch |
| `POST` | `/v1/auth/signup` | None | 5/min IP | Get API key |
| `GET` | `/health` | None | None | Health check |
| `POST` | `/cron/cleanup` | CRON_SECRET | None | Delete expired |

**Discovery endpoints:** `/`, `/docs`, `/llms.txt`, `/llms-full.txt`, `/.well-known/openapi.json`, `/.well-known/mcp.json`

**Content negotiation:** Same URL serves JSON (Accept: application/json) or HTML (browser). `audience: "human"` enables OG tags for social cards.

## Data Model

### Capsule Schema

```json
{
  "summary": "string (required, max 500 chars)",
  "decisions": ["string (max 500 chars each, max 20 items)"],
  "next_steps": ["string (max 500 chars each, max 20 items)"],
  "payload": "JSON (max 32KB)",
  "refs": {
    "workflow_id": "string",
    "agent_id": "string",
    "session_id": "string",
    "parent_capsule_id": "cap_*",
    "receipt_ids": ["rct_*"]
  },
  "expires_in": "60-604800 seconds (default 86400 / 24h, max 7 days)",
  "idempotency_key": "string"
}
```

### Database Tables

**api_keys** (same schema as ProofSlip):
- `id` (key_*), `key_prefix`, `key_hash`, `owner_email`, `tier`, `created_at`, `usage_count`, `usage_reset_at`

**capsules:**
- `id` (cap_*), `api_key_id`, `summary`, `decisions` (JSONB), `next_steps` (JSONB), `payload` (JSONB), `refs` (JSONB), `idempotency_key`, `created_at`, `expires_at`

**Indexes:**
- `UNIQUE(api_key_id, idempotency_key)`
- `idx_capsules_expires_at`
- `idx_capsules_api_key_id`
- `idx_api_keys_prefix`

### Constraints

- `summary`: required, max 500 chars
- `decisions` / `next_steps`: max 20 items, 500 chars per item
- `payload`: max 32KB
- `expires_in`: 60–604800s (7 days), default 86400 (24h)
- ID prefix: `cap_` (nanoid21)

## Middleware Stack

Same as ProofSlip: security -> api-key-auth -> rate-limit -> business logic

- **Security:** CORS, body size limits, security headers
- **Auth:** Bearer token, SHA-256 hash lookup by prefix
- **Rate limiting:** In-memory sliding window (60/min create, 120/min fetch, 5/min signup)

## Idempotency

Same protocol as ProofSlip:
- Unique constraint on `(api_key_id, idempotency_key)`
- Same key + same content = return original (200)
- Same key + different content = 409 conflict

## Cleanup

Hourly Vercel cron job: `POST /cron/cleanup` deletes expired capsules. Protected by `CRON_SECRET`.

## Human-Readable View

Capsules have shareable URLs. Browser view renders as **tractor-feed computer printout** (green/white alternating rows, pin holes, torn perforated edges). Same Departure Mono font, dark page background. Distinct from ProofSlip's thermal receipt aesthetic.

## ProofSlip Integration

Capsules reference receipts via `refs.receipt_ids`. Receipts prove what capsules describe. The two products form a coordination layer:
- **ProofSlip:** "This action happened" (verification)
- **Context Capsule:** "Here's what you need to know" (knowledge)

## MCP Server

Separate npm package: `@contextcapsule/mcp-server`

**Tools:**
1. `create_capsule` — create a capsule
2. `fetch_capsule` — fetch a capsule by ID
3. `signup` — get a free API key

## Visual Identity

- **Font:** Departure Mono (base64 embedded)
- **Colors:** `#0a0a0a` background, `#e0e0e0` text, `#16a34a` green accent
- **Capsule view:** Tractor-feed printout (green-bar paper, pin holes, torn edges)
- **Landing page:** Same dark aesthetic as ProofSlip, stacked "CONTEXT CAPSULE" hero
