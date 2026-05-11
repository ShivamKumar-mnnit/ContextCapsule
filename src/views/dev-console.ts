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
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'Departure Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      padding: 2rem;
    }

    .console {
      max-width: 720px;
      margin: 0 auto;
    }

    h1 {
      font-size: 1.4rem;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: #888;
      margin-bottom: 2rem;
    }

    .config {
      margin-bottom: 1.5rem;
    }

    .config label {
      display: block;
      color: #888;
      margin-bottom: 0.25rem;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .config input, .config textarea {
      width: 100%;
      background: #111;
      border: 1px solid #333;
      color: #e0e0e0;
      font-family: 'Departure Mono', monospace;
      font-size: 13px;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    .config textarea {
      min-height: 80px;
      resize: vertical;
    }

    .config input:focus, .config textarea:focus {
      outline: none;
      border-color: #555;
    }

    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .presets {
      margin-bottom: 1.5rem;
    }

    .presets h2 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
      margin-bottom: 0.5rem;
    }

    .preset-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .preset-grid button {
      background: #1a1a1a;
      border: 1px solid #333;
      color: #e0e0e0;
      font-family: 'Departure Mono', monospace;
      font-size: 11px;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .preset-grid button:hover {
      border-color: #666;
    }

    .fire-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .fire-row button {
      font-family: 'Departure Mono', monospace;
      font-size: 13px;
      padding: 0.6rem 1.2rem;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid #333;
      transition: opacity 0.15s;
    }

    .fire-row button:hover {
      opacity: 0.85;
    }

    .btn-fire {
      background: #fafaf5;
      color: #0a0a0a;
      font-weight: bold;
      border-color: #fafaf5;
    }

    .btn-toggle {
      background: #1a1a1a;
      color: #e0e0e0;
    }

    .results {
      border-top: 1px solid #222;
      padding-top: 1rem;
    }

    .results h2 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
      margin-bottom: 0.75rem;
    }

    .empty-state {
      color: #555;
      font-style: italic;
    }

    .result-card {
      background: #111;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }

    .result-card .tags {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .result-card .tag {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      background: #1a1a1a;
      border: 1px solid #333;
    }

    .result-card .tag.type { color: #7ecfff; border-color: #2a4a5a; }
    .result-card .tag.audience { color: #a0d995; border-color: #2a4a2a; }
    .result-card .tag.status { color: #ffd666; border-color: #4a4020; }

    .result-card .summary {
      margin-bottom: 0.5rem;
    }

    .result-card .detail {
      color: #888;
      font-size: 11px;
      margin-bottom: 0.25rem;
    }

    .result-card .links {
      margin-top: 0.5rem;
    }

    .result-card .links a {
      color: #7ecfff;
      text-decoration: none;
      font-size: 11px;
      margin-right: 1rem;
    }

    .result-card .links a:hover {
      text-decoration: underline;
    }

    .result-card .meta {
      color: #555;
      font-size: 10px;
      margin-top: 0.5rem;
    }

    .error-card {
      background: #1a0a0a;
      border: 1px solid #552222;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      color: #ff6b6b;
    }

    @media (max-width: 640px) {
      body { padding: 1rem; }
      .preset-grid { grid-template-columns: repeat(2, 1fr); }
      .row-2 { grid-template-columns: 1fr; }
      .fire-row { flex-direction: column; align-items: stretch; }
    }
  </style>
</head>
<body>
  <div class="console">
    <h1>Context Capsule Dev Console</h1>
    <p class="subtitle">Generate test capsules. Private — not indexed.</p>

    <div class="config">
      <label>API Key</label>
      <input type="password" id="apiKey" placeholder="ak_..." />

      <div class="row-2">
        <div>
          <label>Agent ID</label>
          <input type="text" id="agentId" value="test-agent" />
        </div>
        <div>
          <label>Workflow ID</label>
          <input type="text" id="workflowId" value="dev-test" />
        </div>
      </div>
    </div>

    <div class="presets">
      <h2>Quick Presets</h2>
      <div class="preset-grid">
        <button onclick="loadPreset('handoff')">Agent handoff</button>
        <button onclick="loadPreset('architecture')">Architecture decision</button>
        <button onclick="loadPreset('debug')">Debug context</button>
        <button onclick="loadPreset('sprint')">Sprint summary</button>
        <button onclick="loadPreset('migration')">Migration plan</button>
        <button onclick="loadPreset('incident')">Incident context</button>
      </div>
    </div>

    <div class="config">
      <label>Summary</label>
      <input type="text" id="summary" maxlength="500" placeholder="What happened or needs to happen" />

      <label>Decisions</label>
      <textarea id="decisions" placeholder="one per line"></textarea>

      <label>Next Steps</label>
      <textarea id="nextSteps" placeholder="one per line"></textarea>

      <label>TTL (seconds)</label>
      <input type="number" id="ttl" min="60" max="604800" value="86400" />
    </div>

    <div class="fire-row">
      <button class="btn-fire" onclick="fireCapsule()">Create Capsule</button>
      <button class="btn-toggle" id="audienceBtn" onclick="toggleAudience()">audience: agent</button>
    </div>

    <div class="results">
      <h2>Results</h2>
      <div id="resultsArea">
        <p class="empty-state">No capsules yet. Hit a preset or create one.</p>
      </div>
    </div>
  </div>

  <script>
    const PRESETS = {
      handoff: {
        summary: 'Sprint planning handoff — priorities locked for next cycle',
        decisions: 'Prioritize auth refactor over new dashboard\\nDefer analytics to Q3\\nUse feature flags for gradual rollout',
        next_steps: 'Deploy auth changes to staging by Thursday\\nSchedule QA review for Friday\\nUpdate stakeholder deck'
      },
      architecture: {
        summary: 'Architecture decision — adopting event sourcing for order pipeline',
        decisions: 'Use event sourcing over CRUD for order state\\nKafka for event bus, not RabbitMQ\\nPostgreSQL as projection store',
        next_steps: 'Draft event schemas by Wednesday\\nSpike Kafka cluster setup\\nUpdate ADR repository'
      },
      debug: {
        summary: 'Debug context — 502 errors on /api/checkout after deploy',
        decisions: 'Root cause is connection pool exhaustion under load\\nRollback not needed — config fix sufficient\\nIncrease pool size from 10 to 50',
        next_steps: 'Apply pool config to production\\nAdd connection pool monitoring alert\\nLoad test with updated settings'
      },
      sprint: {
        summary: 'Sprint 14 summary — shipped auth v2, deferred billing migration',
        decisions: 'Auth v2 shipped to 100% of users\\nBilling migration deferred to sprint 16\\nTech debt budget increased to 20%',
        next_steps: 'QA regression pass on auth flows\\nDraft billing migration RFC\\nSchedule sprint 15 planning'
      },
      migration: {
        summary: 'Database migration plan — splitting users table into auth and profiles',
        decisions: 'Dual-write strategy during migration window\\nZero-downtime with shadow reads\\n3-phase rollout over 2 weeks',
        next_steps: 'Generate migration scripts for phase 1\\nSet up shadow read monitoring\\nSchedule maintenance window for phase 3'
      },
      incident: {
        summary: 'Incident context — payment processing outage, 45 min duration',
        decisions: 'Root cause was expired TLS cert on payment gateway\\nNo data loss confirmed\\nManual renewal applied as hotfix',
        next_steps: 'Automate cert renewal with Let\\'s Encrypt\\nAdd cert expiry monitoring (7-day warning)\\nPublish post-mortem by Friday'
      }
    };

    let currentAudience = null;

    function loadPreset(key) {
      const preset = PRESETS[key];
      if (!preset) return;
      document.getElementById('summary').value = preset.summary;
      document.getElementById('decisions').value = preset.decisions;
      document.getElementById('nextSteps').value = preset.next_steps;
    }

    function toggleAudience() {
      const btn = document.getElementById('audienceBtn');
      if (currentAudience === null) {
        currentAudience = 'human';
        btn.textContent = 'audience: human';
      } else {
        currentAudience = null;
        btn.textContent = 'audience: agent';
      }
    }

    function textToArray(text) {
      return text.split('\\n').map(s => s.trim()).filter(s => s.length > 0);
    }

    async function fireCapsule() {
      const apiKey = document.getElementById('apiKey').value.trim();
      const summary = document.getElementById('summary').value.trim();
      const decisions = textToArray(document.getElementById('decisions').value);
      const nextSteps = textToArray(document.getElementById('nextSteps').value);
      const ttl = parseInt(document.getElementById('ttl').value, 10) || 86400;
      const agentId = document.getElementById('agentId').value.trim();
      const workflowId = document.getElementById('workflowId').value.trim();

      if (!apiKey) { alert('API Key is required'); return; }
      if (!summary) { alert('Summary is required'); return; }

      const body = {
        summary,
        expires_in: ttl,
        refs: {}
      };

      if (decisions.length > 0) body.decisions = decisions;
      if (nextSteps.length > 0) body.next_steps = nextSteps;
      if (agentId) body.refs.agent_id = agentId;
      if (workflowId) body.refs.workflow_id = workflowId;
      if (currentAudience) body.audience = currentAudience;

      const area = document.getElementById('resultsArea');
      // Clear empty state
      const empty = area.querySelector('.empty-state');
      if (empty) empty.remove();

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

        if (!res.ok) {
          area.insertAdjacentHTML('afterbegin',
            '<div class="error-card">' +
              '<strong>ERROR ' + res.status + '</strong><br>' +
              (data.message || data.error || 'Request failed') +
            '</div>'
          );
          return;
        }

        const audienceTag = data.audience
          ? '<span class="tag audience">' + data.audience + '</span>'
          : '<span class="tag audience">agent</span>';

        const decisionsStr = data.decisions && data.decisions.length
          ? '<div class="detail">decisions: ' + data.decisions.join(' | ') + '</div>'
          : '';

        const stepsStr = data.next_steps && data.next_steps.length
          ? '<div class="detail">next_steps: ' + data.next_steps.join(' | ') + '</div>'
          : '';

        const expires = new Date(data.expires_at).toLocaleString();

        const card =
          '<div class="result-card">' +
            '<div class="tags">' +
              '<span class="tag type">capsule</span>' +
              audienceTag +
              '<span class="tag status">CREATED</span>' +
            '</div>' +
            '<div class="summary">' + data.summary + '</div>' +
            decisionsStr +
            stepsStr +
            '<div class="links">' +
              '<a href="' + data.capsule_url + '" target="_blank">View Capsule</a>' +
              '<a href="' + data.capsule_url + '.json" target="_blank">JSON</a>' +
            '</div>' +
            '<div class="meta">' + data.capsule_id + ' &middot; expires ' + expires + '</div>' +
          '</div>';

        area.insertAdjacentHTML('afterbegin', card);

      } catch (err) {
        area.insertAdjacentHTML('afterbegin',
          '<div class="error-card">' +
            '<strong>NETWORK ERROR</strong><br>' +
            err.message +
          '</div>'
        );
      }
    }
  </script>
</body>
</html>`
}
