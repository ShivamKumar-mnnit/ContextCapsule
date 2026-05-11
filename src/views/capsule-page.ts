import { FONT_FACE_CSS } from './font.js'

export interface CapsuleViewData {
  id: string
  summary: string
  decisions: string[] | null
  nextSteps: string[] | null
  payload: unknown
  refs: unknown
  audience: string | null
  createdAt: string
  expiresAt: string
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`
}

export function renderCapsulePage(data: CapsuleViewData): string {
  const baseUrl = process.env.BASE_URL || 'https://www.contextcapsule.ai'
  const capsuleUrl = `${baseUrl}/capsule/${data.id}`
  const tweetText = encodeURIComponent(`Context capsule: ${data.summary}\n\n${capsuleUrl}\n\nvia @contextcapsule`)

  const ogTags = data.audience === 'human' ? `
  <meta property="og:title" content="${escapeHtml(data.summary)}">
  <meta property="og:description" content="Context Capsule — active">
  <meta property="og:image" content="${baseUrl}/og-image.png">
  <meta property="og:url" content="${capsuleUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@contextcapsule">
  <meta name="twitter:title" content="${escapeHtml(data.summary)}">
  <meta name="twitter:description" content="Context Capsule — active">
  <meta name="twitter:image" content="${baseUrl}/og-image.png">` : ''

  const decisionsHtml = data.decisions && data.decisions.length > 0 ? `
          <div class="printout-row">
            <div class="printout-section-label">Decisions</div>
            <ul>
              ${data.decisions.map(d => `<li>${escapeHtml(d)}</li>`).join('\n              ')}
            </ul>
          </div>` : ''

  const nextStepsHtml = data.nextSteps && data.nextSteps.length > 0 ? `
          <div class="printout-row">
            <div class="printout-section-label">Next Steps</div>
            <ul>
              ${data.nextSteps.map(s => `<li>${escapeHtml(s)}</li>`).join('\n              ')}
            </ul>
          </div>` : ''

  const payloadHtml = data.payload ? `
          <div class="printout-details">
            <details>
              <summary>&gt; view payload</summary>
              <pre>${escapeHtml(JSON.stringify(data.payload, null, 2))}</pre>
            </details>
          </div>` : ''

  const pinHoles = '<div class="pin-hole"></div>'.repeat(18)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capsule ${escapeHtml(data.id)} | Context Capsule</title>${ogTags}
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%230a0a0a'/><text x='50' y='68' text-anchor='middle' font-size='52' font-family='monospace' fill='%23e0e0e0'>C</text></svg>">
  <style>
    ${FONT_FACE_CSS}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Departure Mono', monospace;
      font-size: 16px;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 1.5rem;
    }
    .container {
      max-width: 600px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Tractor-feed printout */
    .printout-wrapper {
      max-width: 440px;
      width: 100%;
      display: flex;
      position: relative;
      margin: 0 auto;
    }
    .pin-strip {
      width: 22px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 14px;
      gap: 18px;
    }
    .pin-strip.left { margin-right: 2px; }
    .pin-strip.right { margin-left: 2px; }
    .pin-hole {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0a0a0a;
      border: 1px solid #999;
      flex-shrink: 0;
    }
    .printout {
      flex: 1;
      overflow: hidden;
      border: 1px solid #ccc;
      position: relative;
    }
    .printout-tear-top,
    .printout-tear-bottom {
      height: 6px;
      background: repeating-linear-gradient(
        90deg,
        #fafaf5 0px,
        #fafaf5 4px,
        transparent 4px,
        transparent 8px
      );
    }
    .printout-row {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      line-height: 1.5;
    }
    .printout-row:nth-child(odd) {
      background: #e8f5e8;
      color: #1a1a1a;
    }
    .printout-row:nth-child(even) {
      background: #fafaf5;
      color: #1a1a1a;
    }
    .printout-header {
      text-align: center;
      padding: 1rem 1rem 0.75rem;
      background: #e8f5e8;
    }
    .printout-header h2 {
      font-size: 0.9rem;
      font-weight: normal;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #1a1a1a;
    }
    .printout-badge {
      display: inline-block;
      margin-top: 0.4rem;
      padding: 0.2rem 0.6rem;
      border: 1px solid #16a34a;
      color: #16a34a;
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .printout-id {
      text-align: center;
      font-size: 0.6rem;
      color: #888;
      padding: 0.25rem 1rem 0.5rem;
      background: #fafaf5;
    }
    .printout-section-label {
      font-size: 0.6rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.25rem;
    }
    .printout-row ul {
      list-style: none;
      padding: 0;
      margin: 0.25rem 0 0 0;
    }
    .printout-row ul li {
      font-size: 0.75rem;
      line-height: 1.6;
    }
    .printout-row ul li::before {
      content: "> ";
      color: #888;
    }
    .printout-footer {
      text-align: center;
      padding: 0.5rem 1rem 0.75rem;
      font-size: 0.6rem;
      color: #888;
      background: #e8f5e8;
    }
    .printout-details {
      padding: 0.5rem 1rem;
      background: #fafaf5;
    }
    .printout-details summary {
      cursor: pointer;
      font-size: 0.65rem;
      color: #888;
      letter-spacing: 0.05em;
    }
    .printout-details pre {
      background: #f0f0ea;
      padding: 0.5rem;
      overflow-x: auto;
      font-size: 0.6rem;
      margin-top: 0.4rem;
      font-family: 'Departure Mono', monospace;
      color: #1a1a1a;
    }
    .printout-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: #888;
    }

    /* Actions below printout */
    .actions {
      max-width: 440px;
      width: 100%;
      margin-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .actions a {
      color: #555;
      text-decoration: none;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
      font-family: 'Departure Mono', monospace;
    }
    .actions a:hover {
      color: #e0e0e0;
    }
    .share-link {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border: 1px solid #333;
      text-transform: uppercase;
    }
    .share-link:hover {
      border-color: #555;
    }

    /* Responsive */
    @media (max-width: 640px) {
      body { padding: 2rem 1rem; }
      .printout-wrapper { max-width: 100%; }
      .pin-strip { display: none; }
      .printout-row { padding: 0.4rem 0.75rem; font-size: 0.7rem; }
      .printout-row ul li { font-size: 0.65rem; }
      .printout-header h2 { font-size: 0.8rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="printout-wrapper">
      <div class="pin-strip left">
        ${pinHoles}
      </div>
      <div class="printout">
        <div class="printout-tear-top"></div>
        <div class="printout-header">
          <h2>Context Capsule</h2>
          <div class="printout-badge">Active</div>
        </div>
        <div class="printout-id">${escapeHtml(data.id)}</div>
        <div class="printout-row">
          <div class="printout-section-label">Summary</div>
          ${escapeHtml(data.summary)}
        </div>${decisionsHtml}${nextStepsHtml}${payloadHtml}
        <div class="printout-row">
          <div class="printout-meta">
            <span>${formatDate(data.createdAt)}</span>
            <span>expires ${formatDate(data.expiresAt)}</span>
          </div>
        </div>
        <div class="printout-footer">
          contextcapsule.ai
        </div>
        <div class="printout-tear-bottom"></div>
      </div>
      <div class="pin-strip right">
        ${pinHoles}
      </div>
    </div>

    <div class="actions">
      <a href="/">contextcapsule.ai</a>
      <a class="share-link" href="https://x.com/intent/tweet?text=${tweetText}" target="_blank" rel="noopener">share on X</a>
    </div>
  </div>
</body>
</html>`
}
