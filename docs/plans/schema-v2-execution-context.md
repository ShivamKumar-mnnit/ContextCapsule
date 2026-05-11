# Schema V2: Portable Execution Context

## The Change

Current capsule schema is flat: `summary`, `decisions`, `next_steps`, `payload`, `refs`.

V2 introduces three structured lanes inside capsules — **memory**, **state**, **intent** — while keeping the flat fields as backward-compatible sugar.

## Why

The current schema works for simple handoffs but doesn't distinguish between "what happened before" (memory), "what's true right now" (state), and "what should happen next" (intent). Agents consuming capsules have to infer which is which from unstructured `decisions` and `next_steps` arrays.

The three-lane model makes capsules machine-parseable by role, not just by field name.

## Design Principles

- **Compact.** Capsules should be readable by a human in seconds.
- **Task-bounded.** One capsule = one workflow moment, not an archive.
- **Immediately useful.** An agent receiving a capsule can act without additional context.
- **Not a database.** No logs, transcripts, audit trails, or retrieval systems.

## Proposed Schema V2

```json
{
  "capsule_id": "cap_abc123",
  "summary": "Refund approved, awaiting confirmation email to customer",

  "memory": {
    "key_facts": [
      "Refund request opened 2h ago by customer via chat",
      "Manager approved $45 refund at 14:30 UTC",
      "Customer prefers email over phone"
    ]
  },

  "state": {
    "refund_approved": true,
    "refund_processed": false,
    "email_sent": false,
    "amount_usd": 45
  },

  "intent": {
    "goal": "Send confirmation email and close ticket",
    "next_step": "email_customer",
    "guardrails": [
      "Do not issue refund again — already processed upstream",
      "Escalate if email bounces"
    ]
  },

  "payload": {},
  "refs": {
    "workflow_id": "wf_refund_382",
    "parent_capsule_id": "cap_prev456",
    "receipt_ids": ["rct_refund_approval"]
  },

  "expires_in": 3600
}
```

## Migration Strategy

### Phase 1: Additive (non-breaking)
- Add `memory`, `state`, `intent` as optional JSONB columns
- Existing `decisions`, `next_steps` continue to work unchanged
- API accepts both old and new fields
- Response always includes all fields present

### Phase 2: Sugar mapping
- If a capsule has `memory`/`state`/`intent`, auto-generate `decisions` and `next_steps` from them for backward compat
- If a capsule only has `decisions`/`next_steps`, serve them as-is (no forced migration)

### Phase 3: Deprecation (much later, if ever)
- Mark `decisions`/`next_steps` as deprecated in docs
- Keep accepting them indefinitely — breaking changes kill adoption

## Database Changes

```sql
-- Add new columns (all nullable, all JSONB)
ALTER TABLE capsules ADD COLUMN memory JSONB;
ALTER TABLE capsules ADD COLUMN state JSONB;
ALTER TABLE capsules ADD COLUMN intent JSONB;
```

Drizzle schema additions:
```typescript
memory: jsonb('memory'),   // { key_facts: string[] }
state: jsonb('state'),     // arbitrary key-value
intent: jsonb('intent'),   // { goal, next_step, guardrails[] }
```

## Validation Rules

### memory
- `key_facts`: string[], max 20 items, max 500 chars each
- Optional. Omit if no relevant history.

### state  
- Arbitrary JSON object, max 32KB
- Flat key-value preferred (not deeply nested)
- Optional.

### intent
- `goal`: string, required if intent present, max 500 chars
- `next_step`: string, optional, max 200 chars  
- `guardrails`: string[], max 10 items, max 500 chars each
- Optional as a whole. If present, `goal` is required.

### Cross-field
- At least ONE of: `summary`, `memory`, `state`, `intent` must be present (currently `summary` is required — keep that)
- Total capsule body max stays 32KB

## API Changes

### POST /v1/capsules — request body additions
All new fields optional alongside existing fields:
```
memory.key_facts[]  — prior context facts
state               — current known values  
intent.goal         — what to accomplish
intent.next_step    — immediate next action
intent.guardrails[] — constraints / do-not-do
```

### GET /v1/capsules/:id — response additions
New fields appear in response when present. No changes to existing fields.

## What This Enables

1. **Typed consumption** — agents can read just `intent` to know what to do, just `state` to check conditions, just `memory` for background
2. **Chaining** — next capsule's `memory` can include facts from previous capsule's `state`
3. **Guardrails** — explicit "do not" instructions travel with the capsule, reducing goal drift
4. **ProofSlip integration** — `refs.receipt_ids` link capsule intent to proven actions

## Open Questions

- Should `state` support a simple schema/type hint? (e.g., `state_schema: "refund_flow_v1"`) — probably not yet
- Should `memory.key_facts` allow structured objects, not just strings? — keep strings for v2, revisit in v3
- Max `guardrails` count: 10 enough? Probably yes for v2

## Implementation Order

1. Add Drizzle schema columns + migration
2. Update validation in `src/lib/validate.ts`
3. Update create route to accept new fields
4. Update fetch route to return new fields
5. Update capsule view page to render lanes
6. Update OpenAPI spec, llms.txt, docs
7. Update MCP server tool definitions
8. Add tests for new fields
