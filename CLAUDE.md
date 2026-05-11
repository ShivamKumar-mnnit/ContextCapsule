# Context Capsule

Portable execution context for agent workflows.

## Live

- **Production:** https://www.contextcapsule.ai
- **Domain:** customcapsule.ai (Namecheap → Vercel DNS)
- **Sister product:** [ProofSlip](https://proofslip.ai) — same ecosystem, shared design language
- **ProofSlip repo:** D:\Projects\proof-slip (keep READMEs and CLAUDE.md cross-referenced)

## Project Overview

Context Capsule is a sister product to ProofSlip. Together they form two primitives for reliable agent workflows:

- **ContextCapsule** (navigational) — "Here's the situation, what matters, and what should happen next."
- **ProofSlip** (evidential) — "Here's what actually happened, and you can verify it."

ContextCapsule packages the facts, current state, and next-step intent an agent needs to continue reliably. Capsules are structured, compressed, ephemeral execution context — not logs, not transcripts, not a database.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Hono v4 (matches ProofSlip)
- **ORM:** Drizzle ORM with Neon PostgreSQL
- **Language:** TypeScript (strict mode)
- **Deployment:** Vercel serverless
- **Testing:** Vitest
- **MCP:** @modelcontextprotocol/sdk for MCP server package

## Development

```bash
npm run dev          # Local dev server
npm test             # Run tests
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed API key
npm run db:query     # Query database utilities
```

## Product Direction

Current schema: flat fields (summary, decisions, next_steps, payload, refs).

**V2 planned:** Three structured lanes within capsules:
- **memory** (context) — relevant past facts (why we're here)
- **state** — current known facts (what's true now)
- **intent** — goal + next step + guardrails (what to do next)

See `docs/plans/schema-v2-execution-context.md` for full migration plan.
See `docs/plans/chaining-patterns.md` for how ContextCapsule + ProofSlip chain together.
See `docs/plans/critical-analysis.md` for trade-off analysis on V2 decisions.

**Key constraints:** Capsules must stay compact, task-bounded, immediately useful, portable, and human-readable in seconds. They are NOT logs, transcripts, databases, or long-term memory.

## Architecture Principles

- Ephemeral by default (capsules expire, max 7 days)
- Idempotency built into the protocol
- Content negotiation (JSON for agents, HTML for humans)
- Discovery endpoints (/llms.txt, OpenAPI, MCP manifest)
- Middleware composition: security → auth → rate limit → business logic
- Same API patterns as ProofSlip for ecosystem consistency

## ProofSlip Alignment

These projects share brand, stack, and patterns. Keep them consistent:

- **Brand:** Dark theme (#0a0a0a bg), green accent (#16a34a), Departure Mono font
- **Stack:** Hono v4, Drizzle ORM, Neon PostgreSQL, Vercel serverless, Vitest
- **Middleware order:** CORS → security headers → request ID → body limit → logger
- **Auth:** Bearer token `ak_` prefix, SHA-256 hash, prefix-based lookup
- **Rate limiting:** In-memory sliding window, per-key and per-IP
- **Views:** Template literal HTML (no JSX), inline styles, no client-side JS
- **Discovery:** llms.txt, llms-full.txt, openapi.json, mcp.json, agent.json
- **IDs:** Prefixed nanoid (`cap_`, `ak_`, `key_`)
- **Errors:** `{ error: "code", message: "description", request_id: "req_..." }`
- **Tests:** Vitest, unit tests in tests/lib/, route tests in tests/routes/

## Project Status

Live in production. Core API (create, fetch, auth, cleanup) implemented. Zero users currently — pre-adoption phase. See docs/ for specifications.

**Future plans (not yet started):**
- Schema V2 (memory/state/intent lanes)
- Umbrella brand site connecting ContextCapsule + ProofSlip (only after both have users)
