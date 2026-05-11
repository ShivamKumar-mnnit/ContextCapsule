# ProofSlip Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Context Capsule with ProofSlip's patterns by adding: route integration tests, OG image generation, dev console, Resend email integration, and ai-plugin.json.

**Architecture:** Follow ProofSlip's exact patterns — same file structure, same styling, same middleware conventions. Adapt content for capsules (not receipts). Dev console at `/dev/console?key=<DEV_SECRET>`, email via Resend API with welcome template, OG image as pre-rendered PNG.

**Tech Stack:** Hono v4, Vitest, Resend API (fetch-based, no SDK), SVG-to-PNG for OG image.

---

### Task 1: Email Integration (Resend)

**Files:**
- Create: `src/lib/email.ts`
- Modify: `src/routes/auth.ts`

- [ ] **Step 1: Create `src/lib/email.ts`**

```typescript
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), error: 'RESEND_API_KEY not set', to: opts.to }))
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Context Capsule <noreply@contextcapsule.ai>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => 'unknown')
      console.error(JSON.stringify({ ts: new Date().toISOString(), error: 'resend_send_failed', status: res.status, body, to: opts.to }))
      return false
    }

    return true
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), error: 'resend_network_error', message: (err as Error).message, to: opts.to }))
    return false
  }
}

export function renderWelcomeEmail(apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',Courier,monospace;">
  <div style="max-width:480px;margin:2rem auto;padding:0 1rem;">

    <div style="background:#fafaf5;color:#1a1a1a;padding:2rem 1.5rem;">
      <div style="text-align:center;padding-bottom:1rem;border-bottom:1px dashed #ccc;margin-bottom:1rem;">
        <div style="font-size:1rem;letter-spacing:0.15em;text-transform:uppercase;">Context Capsule</div>
        <div style="display:inline-block;margin-top:0.5rem;padding:0.25rem 0.75rem;border:1px solid #16a34a;color:#16a34a;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;">API Key Issued</div>
      </div>

      <div style="margin:1rem 0;padding:0.75rem;background:#f0f0ea;font-size:0.85rem;line-height:1.5;">
        Your API key is ready. Save it somewhere safe — it cannot be retrieved later.
      </div>

      <div style="margin:1rem 0;padding:1rem;background:#111;color:#16a34a;font-size:0.8rem;word-break:break-all;line-height:1.6;font-family:'Courier New',Courier,monospace;">
        \${apiKey}
      </div>

      <div style="border-top:1px dashed #ccc;padding-top:1rem;margin-top:1rem;">
        <div style="font-size:0.7rem;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">Quick start</div>
        <div style="background:#f0f0ea;padding:0.75rem;font-size:0.7rem;line-height:1.6;overflow-x:auto;font-family:'Courier New',Courier,monospace;">
curl -X POST https://contextcapsule.ai/v1/capsules \\\\<br>
&nbsp;&nbsp;-H "Authorization: Bearer \${apiKey}" \\\\<br>
&nbsp;&nbsp;-H "Content-Type: application/json" \\\\<br>
&nbsp;&nbsp;-d '{"summary":"My first capsule","decisions":["Use React"],"next_steps":["Set up CI"]}'
        </div>
      </div>

      <div style="text-align:center;margin-top:1.5rem;padding-top:1rem;border-top:1px dashed #ccc;">
        <a href="https://contextcapsule.ai" style="color:#888;text-decoration:none;font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;">contextcapsule.ai</a>
        <div style="font-size:0.6rem;color:#bbb;margin-top:0.25rem;">portable context for agent workflows</div>
      </div>
    </div>

    <div style="text-align:center;margin-top:1rem;font-size:0.55rem;color:#444;line-height:1.6;">
      You received this because you signed up for a Context Capsule API key.<br>
      capsules expire, context compounds.
    </div>

  </div>
</body>
</html>`
}
```

- [ ] **Step 2: Add `source` field support to auth route**

In `src/routes/auth.ts`, add the import and source-based branching to match ProofSlip's pattern:

```typescript
import { sendEmail, renderWelcomeEmail } from '../lib/email.js'
```

After the `db.insert` block, replace the single return with:

```typescript
  const source = typeof body.source === 'string' ? body.source : 'api'

  if (source === 'web') {
    await sendEmail({
      to: email,
      subject: 'Your Context Capsule API Key',
      html: renderWelcomeEmail(key),
    })

    return c.json({
      tier: 'free',
      message: 'API key sent to your email.',
    }, 201)
  }

  return c.json({
    api_key: key,
    tier: 'free',
    message: 'Save this key now. It cannot be retrieved later.',
  }, 201)
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts src/routes/auth.ts
git commit -m "feat: Resend email integration with welcome template"
```

---

### Task 2: Dev Console

**Files:**
- Create: `src/views/dev-console.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create `src/views/dev-console.ts`**

Follow ProofSlip's dev-console.ts pattern exactly, adapted for capsules:
- Same dark theme, same CSS structure, same layout
- Replace receipt fields with capsule fields: summary, decisions, next_steps, TTL
- Replace presets with capsule-specific presets (handoff, architecture-decision, debug-context, sprint-summary, migration-plan, incident-context)
- POST to `/v1/capsules` instead of `/v1/receipts`
- Show `capsule_id`, `capsule_url`, decisions, next_steps in results
- Title: "Context Capsule Dev Console"

```typescript
import { FONT_FACE_CSS } from './font.js'

export function renderDevConsole(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Context Capsule Dev Console</title>
  <style>
    ${FONT_FACE_CSS}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Departure Mono', monospace;
      font-size: 14px;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .console { max-width: 720px; width: 100%; }
    h1 {
      font-size: 1.2rem;
      font-weight: normal;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      font-size: 0.75rem;
      color: #555;
      margin-bottom: 2rem;
    }
    .config {
      background: #111;
      border: 1px solid #222;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    .config-title {
      font-size: 0.75rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }
    .field { margin-bottom: 0.75rem; }
    .field:last-child { margin-bottom: 0; }
    label {
      display: block;
      font-size: 0.7rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.3rem;
    }
    input, select, textarea {
      width: 100%;
      background: #0a0a0a;
      border: 1px solid #222;
      color: #e0e0e0;
      font-family: 'Departure Mono', monospace;
      font-size: 0.8rem;
      padding: 0.5rem;
    }
    textarea { resize: vertical; min-height: 3rem; }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #444;
    }
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .presets { margin-bottom: 2rem; }
    .presets-title {
      font-size: 0.75rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.5rem;
    }
    .preset-btn {
      background: #111;
      border: 1px solid #222;
      color: #e0e0e0;
      font-family: 'Departure Mono', monospace;
      font-size: 0.75rem;
      padding: 0.75rem 0.5rem;
      cursor: pointer;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .preset-btn:hover { border-color: #16a34a; color: #16a34a; }
    .preset-btn:active { background: #16a34a; color: #0a0a0a; }
    .fire-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .fire-btn {
      flex: 1;
      background: #fafaf5;
      color: #0a0a0a;
      border: none;
      font-family: 'Departure Mono', monospace;
      font-size: 0.85rem;
      padding: 0.75rem;
      cursor: pointer;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .fire-btn:hover { background: #e8e8e0; }
    .fire-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .audience-toggle {
      background: #111;
      border: 1px solid #222;
      color: #666;
      font-family: 'Departure Mono', monospace;
      font-size: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      letter-spacing: 0.05em;
    }
    .audience-toggle.active { border-color: #16a34a; color: #16a34a; }
    .results-title {
      font-size: 0.75rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }
    .result-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .result-card {
      background: #111;
      border: 1px solid #222;
      padding: 1rem;
    }
    .result-card.error { border-color: #a85454; }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .result-type {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .result-status {
      font-size: 0.7rem;
      color: #16a34a;
    }
    .result-summary {
      font-size: 0.8rem;
      color: #888;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }
    .result-details {
      font-size: 0.7rem;
      color: #555;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }
    .result-links { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .result-links a {
      font-size: 0.7rem;
      color: #16a34a;
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    .result-links a:hover { text-decoration: underline; }
    .result-id { font-size: 0.65rem; color: #444; }
    .result-error { font-size: 0.8rem; color: #a85454; }
    .result-time { font-size: 0.65rem; color: #444; margin-top: 0.3rem; }
    .empty-state {
      font-size: 0.8rem;
      color: #333;
      text-align: center;
      padding: 2rem;
      border: 1px dashed #1a1a1a;
    }
    @media (max-width: 640px) {
      body { padding: 1rem 0.75rem; }
      .preset-grid { grid-template-columns: repeat(2, 1fr); }
      .row-2 { grid-template-columns: 1fr; }
      .fire-row { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="console">
    <h1>Dev Console</h1>
    <div class="subtitle">Generate test capsules. Private — not indexed.</div>

    <div class="config">
      <div class="config-title">Agent Config</div>
      <div class="field">
        <label>API Key</label>
        <input type="password" id="apiKey" placeholder="ak_..." autocomplete="off">
      </div>
      <div class="row-2">
        <div class="field">
          <label>Agent ID</label>
          <input type="text" id="agentId" value="test-agent" placeholder="e.g. planning-bot">
        </div>
        <div class="field">
          <label>Workflow ID</label>
          <input type="text" id="workflowId" value="dev-test" placeholder="e.g. sprint-handoff-v2">
        </div>
      </div>
    </div>

    <div class="presets">
      <div class="presets-title">Quick Presets</div>
      <div class="preset-grid">
        <button class="preset-btn" onclick="loadPreset('handoff')">Agent<br>handoff</button>
        <button class="preset-btn" onclick="loadPreset('architecture')">Architecture<br>decision</button>
        <button class="preset-btn" onclick="loadPreset('debug')">Debug<br>context</button>
        <button class="preset-btn" onclick="loadPreset('sprint')">Sprint<br>summary</button>
        <button class="preset-btn" onclick="loadPreset('migration')">Migration<br>plan</button>
        <button class="preset-btn" onclick="loadPreset('incident')">Incident<br>context</button>
      </div>
    </div>

    <div class="config">
      <div class="config-title">Capsule Fields</div>
      <div class="field">
        <label>Summary (500 chars max)</label>
        <input type="text" id="capsuleSummary" value="Test capsule from dev console" maxlength="500">
      </div>
      <div class="field">
        <label>Decisions (one per line)</label>
        <textarea id="capsuleDecisions" rows="3" placeholder="Use React for frontend&#10;PostgreSQL for persistence"></textarea>
      </div>
      <div class="field">
        <label>Next Steps (one per line)</label>
        <textarea id="capsuleNextSteps" rows="3" placeholder="Set up CI pipeline&#10;Write integration tests"></textarea>
      </div>
      <div class="field">
        <label>TTL (seconds, 60-604800)</label>
        <input type="number" id="capsuleTtl" value="86400" min="60" max="604800">
      </div>
    </div>

    <div class="fire-row">
      <button class="fire-btn" id="fireBtn" onclick="fireCapsule()">Create Capsule</button>
      <button class="audience-toggle" id="audienceBtn" onclick="toggleAudience()">audience: agent</button>
    </div>

    <div>
      <div class="results-title">Results</div>
      <div class="result-list" id="results">
        <div class="empty-state">No capsules yet. Hit a preset or create one.</div>
      </div>
    </div>
  </div>

  <script>
    let audience = null;

    const PRESETS = {
      'handoff': {
        summary: 'Sprint planning context for billing-agent handoff to deploy-agent',
        decisions: 'Prioritize payment retry logic\\nDefer webhook migration to next sprint',
        nextSteps: 'Deploy retry queue to staging\\nRun load test against payment gateway'
      },
      'architecture': {
        summary: 'Architecture decision: event sourcing for order pipeline',
        decisions: 'Use event sourcing over CRUD for audit trail\\nPostgreSQL as event store\\nDebezium for CDC to downstream services',
        nextSteps: 'Define event schema\\nSet up Debezium connector\\nMigrate order-create to event-based'
      },
      'debug': {
        summary: 'Debug context: intermittent 502s on /api/checkout after deploy v2.4.1',
        decisions: 'Root cause: connection pool exhaustion under load\\nHotfix: increase pool max from 10 to 25',
        nextSteps: 'Apply pool config change\\nMonitor p99 latency for 24h\\nAdd pool exhaustion alert'
      },
      'sprint': {
        summary: 'Sprint 14 summary: auth system overhaul complete, 3 items carried over',
        decisions: 'Shipped OAuth2 PKCE flow\\nDeferred SAML support to Sprint 16\\nCarried over rate-limit tuning',
        nextSteps: 'QA regression pass on auth flows\\nUpdate API docs for new OAuth endpoints\\nSchedule SAML spike'
      },
      'migration': {
        summary: 'Database migration plan: users table split into users + profiles',
        decisions: 'Zero-downtime migration using dual-write\\nKeep legacy columns for 2 weeks\\nBackfill profiles from existing data',
        nextSteps: 'Create profiles table migration\\nDeploy dual-write code\\nRun backfill script\\nRemove legacy columns'
      },
      'incident': {
        summary: 'Incident INC-2847: payment processing outage 2026-04-02 14:00-14:45 UTC',
        decisions: 'Root cause: expired TLS cert on payment gateway\\nMitigation: auto-renewal enabled\\nNo data loss confirmed',
        nextSteps: 'Add cert expiry monitoring\\nUpdate runbook with renewal steps\\nSchedule post-mortem'
      }
    };

    function loadPreset(key) {
      const p = PRESETS[key];
      document.getElementById('capsuleSummary').value = p.summary;
      document.getElementById('capsuleDecisions').value = p.decisions;
      document.getElementById('capsuleNextSteps').value = p.nextSteps;
    }

    function toggleAudience() {
      const btn = document.getElementById('audienceBtn');
      if (audience === 'human') {
        audience = null;
        btn.textContent = 'audience: agent';
        btn.classList.remove('active');
      } else {
        audience = 'human';
        btn.textContent = 'audience: human';
        btn.classList.add('active');
      }
    }

    function textToArray(text) {
      return text.trim().split('\\n').map(s => s.trim()).filter(Boolean);
    }

    async function fireCapsule() {
      const apiKey = document.getElementById('apiKey').value.trim();
      if (!apiKey) { alert('Enter your API key first.'); return; }

      const btn = document.getElementById('fireBtn');
      btn.disabled = true;
      btn.textContent = 'Creating...';

      const decisions = textToArray(document.getElementById('capsuleDecisions').value);
      const nextSteps = textToArray(document.getElementById('capsuleNextSteps').value);

      const body = {
        summary: document.getElementById('capsuleSummary').value,
        expires_in: parseInt(document.getElementById('capsuleTtl').value) || 86400,
        refs: {
          agent_id: document.getElementById('agentId').value || 'test-agent',
          workflow_id: document.getElementById('workflowId').value || 'dev-test'
        }
      };
      if (decisions.length > 0) body.decisions = decisions;
      if (nextSteps.length > 0) body.next_steps = nextSteps;
      if (audience === 'human') body.audience = 'human';

      try {
        const res = await fetch('/v1/capsules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify(body)
        });
        const data = await res.json();

        const container = document.getElementById('results');
        const empty = container.querySelector('.empty-state');
        if (empty) empty.remove();

        if (!res.ok) {
          container.insertAdjacentHTML('afterbegin',
            '<div class="result-card error">' +
              '<div class="result-error">' + (data.error || 'unknown_error') + ': ' + (data.message || 'Request failed') + '</div>' +
              '<div class="result-time">' + new Date().toLocaleTimeString() + '</div>' +
            '</div>'
          );
        } else {
          const audienceTag = data.audience ? ' &middot; audience: human' : '';
          const decisionsHtml = data.decisions && data.decisions.length > 0
            ? '<div class="result-details">Decisions: ' + data.decisions.join(' | ') + '</div>'
            : '';
          const stepsHtml = data.next_steps && data.next_steps.length > 0
            ? '<div class="result-details">Next: ' + data.next_steps.join(' | ') + '</div>'
            : '';

          container.insertAdjacentHTML('afterbegin',
            '<div class="result-card">' +
              '<div class="result-header">' +
                '<span class="result-type">capsule' + audienceTag + '</span>' +
                '<span class="result-status">CREATED</span>' +
              '</div>' +
              '<div class="result-summary">' + data.summary + '</div>' +
              decisionsHtml + stepsHtml +
              '<div class="result-links">' +
                '<a href="' + data.capsule_url + '" target="_blank">View Capsule</a>' +
                '<a href="' + data.capsule_url + '?format=json" target="_blank">JSON</a>' +
              '</div>' +
              '<div class="result-id">' + data.capsule_id + '</div>' +
              '<div class="result-time">expires ' + new Date(data.expires_at).toLocaleString() + '</div>' +
            '</div>'
          );
        }
      } catch (err) {
        const container = document.getElementById('results');
        container.insertAdjacentHTML('afterbegin',
          '<div class="result-card error"><div class="result-error">Network error: ' + err.message + '</div></div>'
        );
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Capsule';
      }
    }
  </script>
</body>
</html>`
}
```

- [ ] **Step 2: Add dev console route to `src/index.ts`**

Add import:
```typescript
import { renderDevConsole } from './views/dev-console.js'
```

Add route before the 404 fallback (after the sitemap route):
```typescript
app.get('/dev/console', (c) => {
  const secret = c.req.query('key')
  if (!secret || secret !== process.env.DEV_SECRET) {
    return c.json({ error: 'not_found', message: 'Route not found.' }, 404)
  }
  return c.html(renderDevConsole())
})
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/views/dev-console.ts src/index.ts
git commit -m "feat: dev console for testing capsule creation"
```

---

### Task 3: OG Image

**Files:**
- Create: `src/views/og-image.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create `src/views/og-image.ts`**

Follow ProofSlip's pattern — pre-render an SVG as a base64-encoded PNG. For the initial version, use an SVG served as-is (no resvg dependency needed — we can add PNG rendering later if needed).

```typescript
export function renderOgImageSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <text x="600" y="240" text-anchor="middle" font-family="Courier New, monospace" font-size="56" font-weight="bold" fill="#e0e0e0" letter-spacing="12">CONTEXT CAPSULE</text>
  <line x1="400" y1="270" x2="800" y2="270" stroke="#222" stroke-width="1" stroke-dasharray="8,6"/>
  <rect x="480" y="295" width="240" height="36" rx="0" fill="none" stroke="#16a34a" stroke-width="1"/>
  <text x="600" y="320" text-anchor="middle" font-family="Courier New, monospace" font-size="16" fill="#16a34a" letter-spacing="4">HANDOFF PACKET</text>
  <text x="600" y="390" text-anchor="middle" font-family="Courier New, monospace" font-size="20" fill="#555" letter-spacing="2">portable context for agent workflows</text>
  <line x1="400" y1="430" x2="800" y2="430" stroke="#222" stroke-width="1" stroke-dasharray="8,6"/>
  <text x="600" y="480" text-anchor="middle" font-family="Courier New, monospace" font-size="14" fill="#444" letter-spacing="2">capsules expire, context compounds</text>
</svg>`
}
```

- [ ] **Step 2: Add OG image route to `src/index.ts`**

Add import:
```typescript
import { renderOgImageSvg } from './views/og-image.js'
```

Add route (near other static routes):
```typescript
app.get('/og-image.png', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(renderOgImageSvg())
})
```

Note: Using SVG served at the `.png` path with `image/svg+xml` content type. Most social platforms accept SVG for OG images. If we need actual PNG later, add `@resvg/resvg-js` as a dev dependency like ProofSlip does.

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/views/og-image.ts src/index.ts
git commit -m "feat: OG image for social sharing"
```

---

### Task 4: ai-plugin.json Discovery Endpoint

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add ai-plugin.json route to `src/index.ts`**

Add after the existing agent.json route:
```typescript
app.get('/.well-known/ai-plugin.json', (c) => {
  c.header('Cache-Control', 'public, max-age=86400')
  return c.json({
    schema_version: 'v1',
    name_for_human: 'Context Capsule',
    name_for_model: 'context_capsule',
    description_for_human: 'Portable context packets for AI agent workflows.',
    description_for_model:
      'Create, fetch, and share structured context capsules that agents use for handoffs. ' +
      'Capsules contain summaries, decisions, and next steps. ' +
      'Use this to reduce context window waste, coordinate multi-agent workflows, ' +
      'and hand off structured working memory between sessions. Capsules expire after 7 days max.',
    auth: { type: 'service_http', authorization_type: 'bearer' },
    api: { type: 'openapi', url: 'https://contextcapsule.ai/.well-known/openapi.json' },
    logo_url: 'https://contextcapsule.ai/og-image.png',
    contact_email: 'hello@contextcapsule.ai',
    legal_info_url: 'https://contextcapsule.ai',
  })
})
```

- [ ] **Step 2: Update robots.txt to include ai-plugin.json**

In the robots.txt handler, add the line:
```
'# OpenAI plugin: /.well-known/ai-plugin.json\n' +
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: ai-plugin.json discovery endpoint"
```

---

### Task 5: Route Integration Tests

**Files:**
- Create: `tests/routes/auth.test.ts`
- Create: `tests/routes/capsules.test.ts`
- Create: `tests/routes/fetch.test.ts`
- Create: `tests/routes/api-hygiene.test.ts`

- [ ] **Step 1: Create `tests/routes/auth.test.ts`**

```typescript
import { describe, it, expect, afterAll } from 'vitest'
import app from '../../src/index.js'
import { getTestDb } from '../helpers.js'
import { apiKeys } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'

const createdEmails: string[] = []
let ipCounter = 0

function post(path: string, body: Record<string, unknown>) {
  ipCounter++
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  })
}

afterAll(async () => {
  const db = getTestDb()
  for (const email of createdEmails) {
    await db.delete(apiKeys).where(eq(apiKeys.ownerEmail, email))
  }
})

describe('POST /v1/auth/signup', () => {
  it('creates an API key for a new email', async () => {
    const email = `auth-test-${Date.now()}@contextcapsule.ai`
    createdEmails.push(email)
    const res = await post('/v1/auth/signup', { email })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.api_key).toMatch(/^ak_[0-9a-f]{64}$/)
    expect(data.tier).toBe('free')
  })

  it('rejects duplicate email', async () => {
    const email = `auth-dup-${Date.now()}@contextcapsule.ai`
    createdEmails.push(email)
    await post('/v1/auth/signup', { email })

    const res = await post('/v1/auth/signup', { email })
    expect(res.status).toBe(409)

    const data = await res.json()
    expect(data.error).toBe('email_exists')
  })

  it('rejects missing email', async () => {
    const res = await post('/v1/auth/signup', {})
    expect(res.status).toBe(400)
  })

  it('rejects invalid email format', async () => {
    const res = await post('/v1/auth/signup', { email: 'not-an-email' })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('validation_error')
  })
})
```

- [ ] **Step 2: Create `tests/routes/capsules.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../src/index.js'
import { seedTestApiKey, cleanupTestApiKey } from '../helpers.js'

let apiKey: string
let keyId: string

beforeAll(async () => {
  const result = await seedTestApiKey()
  apiKey = result.key
  keyId = result.keyId
})

afterAll(async () => {
  await cleanupTestApiKey(keyId)
})

function post(path: string, body: Record<string, unknown>, key = apiKey) {
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /v1/capsules', () => {
  it('creates a capsule with required fields', async () => {
    const res = await post('/v1/capsules', {
      summary: 'Test capsule from integration test',
    })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.capsule_id).toMatch(/^cap_/)
    expect(data.summary).toBe('Test capsule from integration test')
    expect(data.capsule_url).toContain('/capsule/')
    expect(data.expires_at).toBeTruthy()
  })

  it('creates a capsule with all fields', async () => {
    const res = await post('/v1/capsules', {
      summary: 'Full capsule test',
      decisions: ['Use React', 'Deploy to Vercel'],
      next_steps: ['Set up CI', 'Write tests'],
      payload: { key: 'value' },
      refs: { agent_id: 'test-agent', workflow_id: 'test-wf' },
      expires_in: 3600,
      audience: 'human',
    })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.decisions).toEqual(['Use React', 'Deploy to Vercel'])
    expect(data.next_steps).toEqual(['Set up CI', 'Write tests'])
    expect(data.audience).toBe('human')
  })

  it('rejects request without auth', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'No auth' }),
    })
    expect(res.status).toBe(401)
  })

  it('rejects invalid payload', async () => {
    const res = await post('/v1/capsules', {})
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('validation_error')
  })

  it('handles idempotency key', async () => {
    const body = {
      summary: 'Idempotent capsule',
      idempotency_key: `idem-${Date.now()}`,
    }

    const res1 = await post('/v1/capsules', body)
    expect(res1.status).toBe(201)
    const data1 = await res1.json()

    const res2 = await post('/v1/capsules', body)
    expect(res2.status).toBe(200)
    const data2 = await res2.json()

    expect(data2.capsule_id).toBe(data1.capsule_id)
  })
})
```

- [ ] **Step 3: Create `tests/routes/fetch.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../src/index.js'
import { seedTestApiKey, cleanupTestApiKey } from '../helpers.js'

let apiKey: string
let keyId: string
let capsuleId: string

beforeAll(async () => {
  const result = await seedTestApiKey()
  apiKey = result.key
  keyId = result.keyId

  const res = await app.request('/v1/capsules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      summary: 'Fetch test capsule',
      decisions: ['Test decision'],
      audience: 'human',
    }),
  })
  const data = await res.json()
  capsuleId = data.capsule_id
})

afterAll(async () => {
  await cleanupTestApiKey(keyId)
})

describe('GET /v1/capsules/:id', () => {
  it('returns capsule as JSON', async () => {
    const res = await app.request(`/v1/capsules/${capsuleId}`, {
      headers: { 'Accept': 'application/json' },
    })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.capsule_id).toBe(capsuleId)
    expect(data.summary).toBe('Fetch test capsule')
  })

  it('returns HTML for browser requests', async () => {
    const res = await app.request(`/v1/capsules/${capsuleId}`, {
      headers: { 'Accept': 'text/html' },
    })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Fetch test capsule')
  })

  it('returns JSON with ?format=json', async () => {
    const res = await app.request(`/v1/capsules/${capsuleId}?format=json`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.capsule_id).toBe(capsuleId)
  })

  it('returns 404 for nonexistent capsule', async () => {
    const res = await app.request('/v1/capsules/cap_nonexistent123456', {
      headers: { 'Accept': 'application/json' },
    })
    expect(res.status).toBe(404)
  })

  it('short URL /capsule/:id works', async () => {
    const res = await app.request(`/capsule/${capsuleId}?format=json`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.capsule_id).toBe(capsuleId)
  })
})
```

- [ ] **Step 4: Create `tests/routes/api-hygiene.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import app from '../../src/index.js'

describe('API hygiene', () => {
  it('health endpoint returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
  })

  it('sets security headers', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('sets CORS headers', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('sets request ID header', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('x-request-id')).toMatch(/^req_/)
  })

  it('returns 404 for unknown routes', async () => {
    const res = await app.request('/unknown/path')
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('not_found')
  })

  it('OPTIONS returns 204 for CORS preflight', async () => {
    const res = await app.request('/v1/capsules', { method: 'OPTIONS' })
    expect(res.status).toBe(204)
  })

  it('discovery endpoints return content', async () => {
    const llms = await app.request('/llms.txt')
    expect(llms.status).toBe(200)

    const openapi = await app.request('/.well-known/openapi.json')
    expect(openapi.status).toBe(200)

    const mcp = await app.request('/.well-known/mcp.json')
    expect(mcp.status).toBe(200)

    const agent = await app.request('/.well-known/agent.json')
    expect(agent.status).toBe(200)
  })
})
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: All existing + new tests pass

- [ ] **Step 6: Commit**

```bash
git add tests/routes/
git commit -m "feat: route integration tests for auth, capsules, fetch, api-hygiene"
```

---

### Task 6: Resend Domain Setup (Manual)

This is a manual step — not code.

- [ ] **Step 1: Set up Resend for contextcapsule.ai**

1. Go to https://resend.com/domains
2. Add domain: `contextcapsule.ai`
3. Resend will show DNS records to add in Namecheap:
   - SPF TXT record
   - DKIM CNAME records (usually 3)
   - Optional DMARC TXT record
4. Add these records in Namecheap Advanced DNS
5. Wait for verification (usually 5-30 min)
6. Copy the Resend API key
7. Add `RESEND_API_KEY=re_...` to Vercel environment variables for the context-capsule project
8. Add `DEV_SECRET=<your-secret>` to Vercel environment variables if not already set

- [ ] **Step 2: Test email delivery**

Use the dev console at `https://www.contextcapsule.ai/dev/console?key=<DEV_SECRET>` or curl:
```bash
curl -X POST https://www.contextcapsule.ai/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "source": "web"}'
```

Expected: Email arrives with API key in receipt-styled template.
