import { FONT_FACE_CSS } from './font.js'

export function renderDocsPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Docs — Context Capsule</title>
  <meta name="description" content="Context Capsule API documentation. Create and fetch structured context capsules for agent handoffs.">
  <link rel="canonical" href="https://www.contextcapsule.ai/docs">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%230a0a0a'/><text x='50' y='68' text-anchor='middle' font-size='52' font-family='monospace' fill='%23e0e0e0'>C</text></svg>">
  <style>
    ${FONT_FACE_CSS}

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Departure Mono', monospace;
      background: #0a0a0a;
      color: #e0e0e0;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }
    h1 {
      font-size: 1.6rem;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    h1 a { color: #16a34a; text-decoration: none; }
    h1 a:hover { text-decoration: underline; }
    .subtitle {
      color: #888;
      font-size: 0.85rem;
      margin-bottom: 3rem;
    }
    h2 {
      font-size: 1.15rem;
      color: #fff;
      margin-top: 3rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #222;
    }
    h3 {
      font-size: 0.95rem;
      color: #ccc;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    p { margin-bottom: 1rem; color: #bbb; font-size: 0.85rem; }
    a { color: #16a34a; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      letter-spacing: 0.03em;
      margin-right: 0.5rem;
      vertical-align: middle;
    }
    .badge-post { background: #1a3a2a; color: #16a34a; }
    .badge-get { background: #1a2a3a; color: #4a9eda; }
    .endpoint-path {
      font-size: 0.9rem;
      color: #e0e0e0;
      vertical-align: middle;
    }
    pre {
      background: #111;
      border: 1px solid #1a1a1a;
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      margin-bottom: 1rem;
      font-size: 0.8rem;
      line-height: 1.6;
    }
    code {
      color: #ccc;
      font-family: 'Departure Mono', monospace;
      font-size: 0.8rem;
    }
    p code, li code {
      background: #111;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      border: 1px solid #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
    }
    th {
      text-align: left;
      color: #555;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #222;
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.7rem;
    }
    td {
      color: #aaa;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #151515;
    }
    ul { list-style: none; margin-bottom: 1rem; }
    ul li { color: #aaa; font-size: 0.85rem; padding: 0.2rem 0; }
    ul li::before { content: '→ '; color: #16a34a; }
    .section { margin-bottom: 2rem; }
    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #16a34a;
      text-decoration: none;
      font-size: 0.85rem;
    }
    .back-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← contextcapsule.ai</a>
    <h1><a href="/docs">API Documentation</a></h1>
    <p class="subtitle">Context Capsule v1 — Portable context for agent workflows</p>

    <!-- Authentication -->
    <h2>Authentication</h2>
    <div class="section">
      <p>Capsule creation requires a Bearer token. Get one via the signup endpoint. Keys use the <code>ak_</code> prefix.</p>
      <pre><code>Authorization: Bearer ak_your_api_key</code></pre>
      <p>Fetch endpoints are public — no authentication required.</p>
    </div>

    <!-- POST /v1/capsules -->
    <h2><span class="badge badge-post">POST</span> <span class="endpoint-path">/v1/capsules</span></h2>
    <div class="section">
      <p>Create a context capsule. Auth required. Rate limit: 60/min per API key.</p>
      <h3>Request</h3>
      <pre><code>curl -X POST https://www.contextcapsule.ai/v1/capsules \\
  -H "Authorization: Bearer ak_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "summary": "Refactored auth module",
    "decisions": ["Chose RS256 over HS256"],
    "next_steps": ["Add refresh tokens"],
    "payload": {"files": ["auth.ts"]},
    "refs": {"workflow_id": "wf_123"},
    "expires_in": 3600
  }'</code></pre>
      <h3>Response (201)</h3>
      <pre><code>{
  "id": "cap_...",
  "short_url": "https://www.contextcapsule.ai/capsule/cap_...",
  "expires_at": "2025-01-01T12:00:00.000Z",
  "request_id": "req_..."
}</code></pre>
    </div>

    <!-- GET /v1/capsules/:id -->
    <h2><span class="badge badge-get">GET</span> <span class="endpoint-path">/v1/capsules/:id</span></h2>
    <div class="section">
      <p>Fetch a capsule by ID. Public. Rate limit: 120/min per IP.</p>
      <pre><code>curl https://www.contextcapsule.ai/v1/capsules/cap_abc123</code></pre>
      <h3>Response (200)</h3>
      <pre><code>{
  "id": "cap_abc123",
  "summary": "Refactored auth module",
  "decisions": ["Chose RS256 over HS256"],
  "next_steps": ["Add refresh tokens"],
  "payload": {"files": ["auth.ts"]},
  "refs": {"workflow_id": "wf_123"},
  "audience": null,
  "created_at": "2025-01-01T11:00:00.000Z",
  "expires_at": "2025-01-01T12:00:00.000Z"
}</code></pre>
      <p>Short URL also works: <code>GET /capsule/:id</code></p>
    </div>

    <!-- POST /v1/auth/signup -->
    <h2><span class="badge badge-post">POST</span> <span class="endpoint-path">/v1/auth/signup</span></h2>
    <div class="section">
      <p>Get a free API key. Rate limit: 5/min per IP.</p>
      <pre><code>curl -X POST https://www.contextcapsule.ai/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com"}'</code></pre>
      <h3>Response (201)</h3>
      <pre><code>{
  "api_key": "ak_...",
  "message": "Store this key securely — it cannot be retrieved later."
}</code></pre>
    </div>

    <!-- POST /cron/cleanup -->
    <h2><span class="badge badge-post">POST</span> <span class="endpoint-path">/cron/cleanup</span></h2>
    <div class="section">
      <p>Hourly cleanup of expired capsules. Protected by a shared secret.</p>
      <pre><code>curl -X POST https://www.contextcapsule.ai/cron/cleanup \\
  -H "Authorization: Bearer CRON_SECRET"</code></pre>
      <h3>Response (200)</h3>
      <pre><code>{"deleted": 42}</code></pre>
    </div>

    <!-- Capsule Schema -->
    <h2>Capsule Schema</h2>
    <div class="section">
      <table>
        <tr><th>Field</th><th>Type</th><th>Required</th><th>Constraints</th></tr>
        <tr><td>summary</td><td>string</td><td>yes</td><td>max 500 chars</td></tr>
        <tr><td>decisions</td><td>string[]</td><td>no</td><td></td></tr>
        <tr><td>next_steps</td><td>string[]</td><td>no</td><td></td></tr>
        <tr><td>payload</td><td>object</td><td>no</td><td>max 32KB JSON</td></tr>
        <tr><td>refs</td><td>object</td><td>no</td><td>see below</td></tr>
        <tr><td>expires_in</td><td>number</td><td>no</td><td>60–604800s, default 86400</td></tr>
        <tr><td>idempotency_key</td><td>string</td><td>no</td><td>deduplication key</td></tr>
        <tr><td>audience</td><td>string</td><td>no</td><td>consumer hint</td></tr>
      </table>

      <h3>Refs Object</h3>
      <table>
        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        <tr><td>workflow_id</td><td>string</td><td>Workflow ID</td></tr>
        <tr><td>agent_id</td><td>string</td><td>Creating agent</td></tr>
        <tr><td>session_id</td><td>string</td><td>Creating session</td></tr>
        <tr><td>parent_capsule_id</td><td>string</td><td>Parent capsule (chaining)</td></tr>
        <tr><td>receipt_ids</td><td>string[]</td><td>ProofSlip receipt IDs</td></tr>
      </table>
    </div>

    <!-- Errors -->
    <h2>Errors</h2>
    <div class="section">
      <p>All errors return a JSON body with <code>error</code>, <code>message</code>, and <code>request_id</code>.</p>
      <table>
        <tr><th>Code</th><th>HTTP</th><th>Description</th></tr>
        <tr><td>validation_error</td><td>400</td><td>Request body failed validation</td></tr>
        <tr><td>unauthorized</td><td>401</td><td>Missing or invalid credentials</td></tr>
        <tr><td>capsule_not_found</td><td>404</td><td>Capsule not found or expired</td></tr>
        <tr><td>idempotency_conflict</td><td>409</td><td>Same key, different body</td></tr>
        <tr><td>email_exists</td><td>409</td><td>Email already registered</td></tr>
        <tr><td>rate_limited</td><td>429</td><td>Too many requests</td></tr>
        <tr><td>internal_error</td><td>500</td><td>Unexpected server error</td></tr>
      </table>
    </div>

    <!-- MCP Server -->
    <h2>MCP Server</h2>
    <div class="section">
      <p>Use Context Capsule from any MCP-compatible client:</p>
      <pre><code>npx -y @contextcapsule/mcp-server</code></pre>
      <p>Tools: <code>create_capsule</code>, <code>fetch_capsule</code>, <code>signup</code></p>
    </div>

    <!-- Discovery Endpoints -->
    <h2>Discovery Endpoints</h2>
    <div class="section">
      <table>
        <tr><th>URL</th><th>Format</th><th>Description</th></tr>
        <tr><td><a href="/llms.txt">/llms.txt</a></td><td>text</td><td>LLM-friendly summary</td></tr>
        <tr><td><a href="/llms-full.txt">/llms-full.txt</a></td><td>text</td><td>Full API reference</td></tr>
        <tr><td><a href="/.well-known/openapi.json">/.well-known/openapi.json</a></td><td>JSON</td><td>OpenAPI 3.1 spec</td></tr>
        <tr><td><a href="/.well-known/mcp.json">/.well-known/mcp.json</a></td><td>JSON</td><td>MCP discovery</td></tr>
        <tr><td><a href="/.well-known/agent.json">/.well-known/agent.json</a></td><td>JSON</td><td>Agent discovery</td></tr>
        <tr><td><a href="/robots.txt">/robots.txt</a></td><td>text</td><td>Robots &amp; discovery</td></tr>
        <tr><td><a href="/sitemap.xml">/sitemap.xml</a></td><td>XML</td><td>Sitemap</td></tr>
      </table>
    </div>

    <p style="color: #444; margin-top: 3rem; font-size: 0.75rem; text-align: center;">
      Context Capsule — contextcapsule.ai
    </p>
  </div>
</body>
</html>`
}
