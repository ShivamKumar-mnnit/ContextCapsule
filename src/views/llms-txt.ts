export function renderLlmsTxt(): string {
  return `# Context Capsule

> Portable context for agent workflows. Create structured, compressed, ephemeral handoff packets.

## Quick Start

### 1. Get an API key

POST https://www.contextcapsule.ai/v1/auth/signup
Content-Type: application/json

{"email": "you@example.com"}

Response: {"api_key": "ak_..."}

### 2. Create a capsule

POST https://www.contextcapsule.ai/v1/capsules
Authorization: Bearer ak_your_key
Content-Type: application/json

{
  "summary": "Refactored auth module to use JWT tokens",
  "decisions": [
    "Chose RS256 over HS256 for token signing",
    "Set token expiry to 15 minutes"
  ],
  "next_steps": [
    "Implement refresh token rotation",
    "Add rate limiting to token endpoint"
  ],
  "payload": {"files_changed": ["src/auth.ts", "src/middleware.ts"]},
  "refs": {
    "workflow_id": "wf_abc123",
    "agent_id": "agent_codegen",
    "session_id": "sess_xyz"
  },
  "expires_in": 3600
}

Response: {"id": "cap_...", "short_url": "https://www.contextcapsule.ai/capsule/cap_...", "expires_at": "..."}

### 3. Fetch a capsule

GET https://www.contextcapsule.ai/v1/capsules/{id}

No auth required. Returns the full capsule JSON.

Short URL also works: GET https://www.contextcapsule.ai/capsule/{id}

## Create Capsule Schema

| Field            | Type          | Required | Constraints                    |
|------------------|---------------|----------|--------------------------------|
| summary          | string        | yes      | max 500 chars                  |
| decisions        | string[]      | no       | array of strings               |
| next_steps       | string[]      | no       | array of strings               |
| payload          | object        | no       | max 32KB JSON                  |
| refs             | object        | no       | see below                      |
| expires_in       | number        | no       | 60-604800 seconds, default 86400 |
| idempotency_key  | string        | no       | for deduplication              |
| audience         | string        | no       | hint for consumers             |

### Refs Object

| Field              | Type     |
|--------------------|----------|
| workflow_id        | string   |
| agent_id           | string   |
| session_id         | string   |
| parent_capsule_id  | string   |
| receipt_ids        | string[] |

## Auth

All create requests require a Bearer token with the ak_ prefix.
Fetch requests are public — no auth needed.

## Rate Limits

- Create: 60/min per API key
- Fetch: 120/min per IP
- Signup: 5/min per IP

## Discovery

- API docs: https://www.contextcapsule.ai/docs
- Full reference: https://www.contextcapsule.ai/llms-full.txt
- OpenAPI spec: https://www.contextcapsule.ai/.well-known/openapi.json
- MCP discovery: https://www.contextcapsule.ai/.well-known/mcp.json
- MCP server: npx -y @contextcapsule/mcp-server
`
}
