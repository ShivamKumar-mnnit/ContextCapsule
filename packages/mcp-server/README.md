# @contextcapsule/mcp-server

[![npm version](https://img.shields.io/npm/v/@contextcapsule/mcp-server)](https://www.npmjs.com/package/@contextcapsule/mcp-server)
[![license](https://img.shields.io/npm/l/@contextcapsule/mcp-server)](https://github.com/Johnny-Z13/context-capsule/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@contextcapsule/mcp-server)](https://nodejs.org)

MCP server for [Context Capsule](https://www.contextcapsule.ai) — portable execution context for AI agent workflows. Create and fetch structured context capsules that carry decisions, next steps, and working memory between agents and sessions.

## Tools

### `create_capsule`
Create a context capsule to hand off execution context between agents or sessions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `summary` | string | Yes | What happened — max 500 chars |
| `decisions` | string[] | No | Key decisions made (max 20 items) |
| `next_steps` | string[] | No | What should happen next (max 20 items) |
| `payload` | object | No | Structured JSON data (max 32KB) |
| `refs` | object | No | Workflow references (workflow_id, agent_id, etc.) |
| `expires_in` | number | No | TTL in seconds (60–604800, default 7 days) |
| `idempotency_key` | string | No | Prevents duplicate capsules on retry |
| `audience` | "human" | No | Enrich view page with social cards |

**Requires:** `CONTEXTCAPSULE_API_KEY` environment variable.

### `fetch_capsule`
Fetch a capsule to resume work from where another agent left off.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `capsule_id` | string | Yes | The capsule ID (starts with `cap_`) |

**No API key required.**

### `signup`
Get a free API key (500 capsules/month).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Your email address |

**No API key required.**

## Usage Example

```
You: "Create a capsule summarizing the database migration we just finished"

Agent calls create_capsule:
  summary: "Migrated user table — split into users + profiles with dual-write"
  decisions: ["Used addColumn for backward compat", "2-week transition period"]
  next_steps: ["Run integration tests", "Update API serializers"]
  refs: { workflow_id: "migration-456", agent_id: "schema-agent" }

→ Returns capsule_id and capsule_url

You: "Fetch capsule cap_abc123 and continue the migration work"

Agent calls fetch_capsule:
  capsule_id: "cap_abc123"

→ Returns full context: summary, decisions, next_steps, payload, refs
→ Agent picks up exactly where the previous session left off
```

## Setup

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "contextcapsule": {
      "command": "npx",
      "args": ["-y", "@contextcapsule/mcp-server"],
      "env": {
        "CONTEXTCAPSULE_API_KEY": "ak_your_key_here"
      }
    }
  }
}
```

### Cursor / Windsurf

Add to MCP settings:

```json
{
  "mcpServers": {
    "contextcapsule": {
      "command": "npx",
      "args": ["-y", "@contextcapsule/mcp-server"],
      "env": {
        "CONTEXTCAPSULE_API_KEY": "ak_your_key_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add contextcapsule -- npx -y @contextcapsule/mcp-server
```

Then set your API key in your environment or `.env` file.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `CONTEXTCAPSULE_API_KEY` | For creating capsules | Your API key (starts with `ak_`) |
| `CONTEXTCAPSULE_BASE_URL` | No | API base URL (default: `https://www.contextcapsule.ai`) |

## Get an API Key

Use the `signup` tool from any MCP client, or:

```bash
curl -X POST https://www.contextcapsule.ai/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "source": "api"}'
```

## Links

- [Live Site](https://www.contextcapsule.ai)
- [API Docs](https://www.contextcapsule.ai/docs)
- [ProofSlip](https://www.proofslip.ai) (sister product — receipts + verification)
- [GitHub](https://github.com/Johnny-Z13/context-capsule)

## License

[MIT](https://github.com/Johnny-Z13/context-capsule/blob/main/LICENSE)
