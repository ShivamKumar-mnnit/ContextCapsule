export function renderLlmsFullTxt(): string {
  return `# Context Capsule — Full API Reference

> Portable context for agent workflows. Create structured, compressed, ephemeral handoff packets.
> Website: https://www.contextcapsule.ai
> Sister product: ProofSlip (proofslip.ai)

================================================================================
## Authentication
================================================================================

All capsule creation requests require a Bearer token.
API keys have the prefix "ak_" and are hashed with SHA-256 before storage.

Header format:
  Authorization: Bearer ak_your_api_key

Fetch endpoints are public — no auth required.

================================================================================
## POST /v1/auth/signup
================================================================================

Get a free API key. Public endpoint.

Rate limit: 5/min per IP

Request:
  POST https://www.contextcapsule.ai/v1/auth/signup
  Content-Type: application/json

  {"email": "you@example.com"}

Success response (201):
  {
    "api_key": "ak_...",
    "message": "Store this key securely — it cannot be retrieved later."
  }

Error responses:
  400 — validation_error: Invalid email format
  409 — email_exists: An account with this email already exists
  429 — rate_limited: Too many signup attempts

curl example:
  curl -X POST https://www.contextcapsule.ai/v1/auth/signup \\
    -H "Content-Type: application/json" \\
    -d '{"email": "agent@example.com"}'

================================================================================
## POST /v1/capsules
================================================================================

Create a context capsule. Auth required.

Rate limit: 60/min per API key

Request:
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
    "payload": {
      "files_changed": ["src/auth.ts", "src/middleware.ts"],
      "test_results": {"passed": 42, "failed": 0}
    },
    "refs": {
      "workflow_id": "wf_abc123",
      "agent_id": "agent_codegen",
      "session_id": "sess_xyz",
      "parent_capsule_id": "cap_parent",
      "receipt_ids": ["rcpt_1", "rcpt_2"]
    },
    "expires_in": 3600,
    "idempotency_key": "unique-request-id-123",
    "audience": "deployment-agent"
  }

Success response (201):
  {
    "id": "cap_...",
    "short_url": "https://www.contextcapsule.ai/capsule/cap_...",
    "expires_at": "2025-01-01T12:00:00.000Z",
    "request_id": "req_..."
  }

Error responses:
  400 — validation_error: Missing or invalid fields
  401 — unauthorized: Missing or invalid API key
  409 — idempotency_conflict: Same key used with different body
  429 — rate_limited: Too many create requests

### Field Reference

| Field            | Type     | Required | Constraints                          |
|------------------|----------|----------|--------------------------------------|
| summary          | string   | yes      | max 500 characters                   |
| decisions        | string[] | no       | array of decision strings            |
| next_steps       | string[] | no       | array of next step strings           |
| payload          | object   | no       | arbitrary JSON, max 32KB             |
| refs             | object   | no       | reference links (see below)          |
| expires_in       | number   | no       | 60–604800 seconds (default 86400)    |
| idempotency_key  | string   | no       | client-provided deduplication key    |
| audience         | string   | no       | hint for intended consumer           |

### Refs Object

| Field              | Type     | Description                        |
|--------------------|----------|------------------------------------|
| workflow_id        | string   | Workflow this capsule belongs to   |
| agent_id           | string   | Agent that created this capsule    |
| session_id         | string   | Session that created this capsule  |
| parent_capsule_id  | string   | Parent capsule ID (for chaining)   |
| receipt_ids        | string[] | Receipt IDs from ProofSlip         |

### Idempotency Protocol

Include an idempotency_key in the request body. If a capsule was already created
with the same key by the same API key, the original capsule is returned (200).
If the same key is used with a different body, a 409 idempotency_conflict error
is returned.

curl example:
  curl -X POST https://www.contextcapsule.ai/v1/capsules \\
    -H "Authorization: Bearer ak_your_key" \\
    -H "Content-Type: application/json" \\
    -d '{
      "summary": "Completed database migration",
      "decisions": ["Used pgroll for zero-downtime migration"],
      "expires_in": 7200
    }'

================================================================================
## GET /v1/capsules/:id
================================================================================

Fetch a capsule by ID. Public — no auth required.

Rate limit: 120/min per IP

Request:
  GET https://www.contextcapsule.ai/v1/capsules/cap_abc123

Success response (200):
  {
    "id": "cap_abc123",
    "summary": "Refactored auth module to use JWT tokens",
    "decisions": ["Chose RS256 over HS256"],
    "next_steps": ["Implement refresh token rotation"],
    "payload": {"files_changed": ["src/auth.ts"]},
    "refs": {"workflow_id": "wf_abc123", "agent_id": "agent_codegen"},
    "audience": "deployment-agent",
    "created_at": "2025-01-01T11:00:00.000Z",
    "expires_at": "2025-01-01T12:00:00.000Z"
  }

Error responses:
  404 — capsule_not_found: Capsule not found or expired
  429 — rate_limited: Too many fetch requests

curl example:
  curl https://www.contextcapsule.ai/v1/capsules/cap_abc123

================================================================================
## GET /capsule/:id (Short URL)
================================================================================

Alias for GET /v1/capsules/:id. Same behavior, same response.

curl example:
  curl https://www.contextcapsule.ai/capsule/cap_abc123

================================================================================
## POST /cron/cleanup
================================================================================

Hourly cleanup of expired capsules. Protected by a shared secret.

Header:
  Authorization: Bearer CRON_SECRET

Success response (200):
  {"deleted": 42}

Error responses:
  401 — unauthorized: Invalid cron secret

================================================================================
## GET /health
================================================================================

Health check endpoint.

Response (200):
  {"status": "ok"}

================================================================================
## Error Codes
================================================================================

| Code                  | HTTP | Description                                   |
|-----------------------|------|-----------------------------------------------|
| validation_error      | 400  | Request body failed validation                |
| unauthorized          | 401  | Missing or invalid auth credentials           |
| capsule_not_found     | 404  | Capsule does not exist or has expired         |
| idempotency_conflict  | 409  | Same idempotency key, different request body  |
| email_exists          | 409  | Email already registered                      |
| rate_limited          | 429  | Rate limit exceeded                           |
| internal_error        | 500  | Unexpected server error                       |

All error responses include:
  {
    "error": "error_code",
    "message": "Human-readable description",
    "request_id": "req_..."
  }

================================================================================
## Rate Limits
================================================================================

| Endpoint          | Limit      | Scope    |
|-------------------|------------|----------|
| POST /v1/capsules | 60/min     | API key  |
| GET /v1/capsules  | 120/min    | IP       |
| POST /v1/auth     | 5/min      | IP       |

Rate limit headers are included in responses:
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 59
  X-RateLimit-Reset: 1704067200

================================================================================
## Discovery Endpoints
================================================================================

| URL                                  | Format   | Description              |
|--------------------------------------|----------|--------------------------|
| /docs                                | HTML     | API documentation page   |
| /llms.txt                            | text     | LLM-friendly summary     |
| /llms-full.txt                       | text     | Full API reference (this)|
| /.well-known/openapi.json            | JSON     | OpenAPI 3.1 spec         |
| /.well-known/mcp.json                | JSON     | MCP discovery manifest   |
| /.well-known/agent.json              | JSON     | Agent discovery manifest |
| /robots.txt                          | text     | Robots & discovery hints |
| /sitemap.xml                         | XML      | Sitemap                  |

================================================================================
## MCP Server
================================================================================

Install and run the MCP server:
  npx -y @contextcapsule/mcp-server

Package: @contextcapsule/mcp-server

Tools provided:
  - create_capsule: Create a context capsule
  - fetch_capsule: Fetch a capsule by ID
  - signup: Get a free API key
`
}
