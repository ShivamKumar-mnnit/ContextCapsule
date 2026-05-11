import { FONT_FACE_CSS } from './font.js'

export function renderLandingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Context Capsule — Portable Context for Agent Workflows</title>
  <meta name="description" content="Free API for AI agent handoffs. Create structured, compressed context packets that agents pass between sessions. Less context window waste, better multi-agent coordination. Create, fetch, expire.">
  <meta name="keywords" content="AI agent context, agent handoff API, multi-agent coordination, context compression, agent working memory, LLM context management, agent workflow handoff, portable agent context, structured context API, ephemeral context packets">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Context Capsule">
  <link rel="canonical" href="https://www.contextcapsule.ai">
  <meta property="og:title" content="Context Capsule — Portable Context for Agent Workflows">
  <meta property="og:description" content="Free handoff API for AI agents. Structured, compressed context packets that expire. Less window waste, better coordination. Create, fetch, expire.">
  <meta property="og:image" content="https://www.contextcapsule.ai/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="https://www.contextcapsule.ai">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Context Capsule">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Context Capsule — Portable Context for Agent Workflows">
  <meta name="twitter:description" content="Free handoff API for AI agents. Structured, compressed context packets that expire. Less window waste, better coordination.">
  <meta name="twitter:image" content="https://www.contextcapsule.ai/og-image.png">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%230a0a0a'/><text x='50' y='68' text-anchor='middle' font-size='52' font-family='monospace' fill='%23e0e0e0'>C</text></svg>">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Context Capsule",
    "description": "Free AI agent handoff API. Create structured, compressed context packets that agents pass between sessions. Prevents context loss, reduces token waste, and enables clean multi-agent coordination.",
    "url": "https://www.contextcapsule.ai",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "keywords": "AI agent context, agent handoff, context compression, multi-agent coordination, ephemeral context",
    "creator": {
      "@type": "Organization",
      "name": "Context Capsule",
      "url": "https://www.contextcapsule.ai"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier — 500 capsules per month"
    }
  }
  </script>
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
      padding: 6rem 1.5rem;
    }
    .container {
      max-width: 600px;
      width: 100%;
    }

    /* Hero */
    .hero {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .hero-brand {
      font-size: 4.5rem;
      font-weight: normal;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 1rem;
      text-align: center;
      line-height: 1.2;
    }
    .hero-word {
      display: block;
    }
    .hero-word:last-child span:last-child {
      letter-spacing: 0;
    }
    .hero-word:first-child span:last-child {
      letter-spacing: 0;
    }
    .hero-tagline {
      font-size: 0.85rem;
      color: #555;
      margin-bottom: 2rem;
    }
    .hero-headline {
      font-size: 1.2rem;
      font-weight: normal;
      line-height: 1.6;
      margin-bottom: 0;
    }

    /* CTA */
    .cta {
      margin-bottom: 3rem;
      text-align: center;
    }
    .signup-row {
      display: flex;
      gap: 0;
      margin-bottom: 0.75rem;
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
    }
    .signup-input {
      flex: 1;
      background: #111;
      border: 1px solid #222;
      border-right: none;
      color: #e0e0e0;
      font-family: 'Departure Mono', monospace;
      font-size: 0.85rem;
      padding: 0.85rem 1rem;
    }
    .signup-input:focus {
      outline: none;
      border-color: #444;
    }
    .signup-input::placeholder { color: #444; }
    .cta-button {
      background: #16a34a;
      color: #fff;
      border: 1px solid #16a34a;
      padding: 0.85rem 1.5rem;
      font-family: 'Departure Mono', monospace;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      white-space: nowrap;
    }
    .cta-button:hover {
      background: #15803d;
      border-color: #15803d;
    }
    .cta-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cta-subtext {
      font-size: 0.75rem;
      color: #444;
    }
    .key-display {
      background: #111;
      border: 1px solid #16a34a;
      padding: 1.25rem;
      margin-bottom: 0.75rem;
      text-align: left;
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
    }
    .key-label {
      font-size: 0.7rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .signup-error-msg {
      font-size: 0.85rem;
      color: #a85454;
    }

    /* Capsule showcase — tractor-feed printout */
    .showcase {
      margin-bottom: 5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .section-label {
      font-size: 0.7rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin-bottom: 2rem;
      text-align: center;
    }
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

    /* How it works */
    .how-it-works {
      margin-bottom: 5rem;
    }
    .steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .step {
      background: #111;
      border: 1px solid #1a1a1a;
      padding: 1.5rem;
    }
    .step-number {
      font-size: 0.7rem;
      color: #333;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .step-title {
      font-size: 1.2rem;
      color: #e0e0e0;
      margin-bottom: 0.5rem;
      font-weight: normal;
    }
    .step-description {
      font-size: 0.8rem;
      color: #555;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .step-description:last-child {
      margin-bottom: 0;
    }
    .code-block {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      color: #7c9a5e;
      padding: 1rem;
      font-size: 0.75rem;
      line-height: 1.6;
      overflow-x: auto;
      font-family: 'Departure Mono', monospace;
    }
    .code-block .comment {
      color: #444;
    }

    /* Two interfaces */
    .two-ways {
      margin-bottom: 5rem;
    }
    .two-ways-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #1a1a1a;
      border: 1px solid #1a1a1a;
    }
    .two-ways-item {
      background: #0a0a0a;
      padding: 1.25rem;
    }
    .two-ways-label {
      font-size: 0.65rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 0.5rem;
    }
    .two-ways-title {
      font-size: 0.9rem;
      color: #e0e0e0;
      margin-bottom: 0.4rem;
    }
    .two-ways-desc {
      font-size: 0.75rem;
      color: #555;
      line-height: 1.5;
    }
    .two-ways-footnote {
      font-size: 0.75rem;
      color: #333;
      margin-top: 1rem;
      text-align: center;
    }

    /* Comparison */
    .comparison {
      margin-bottom: 5rem;
    }
    .comparison-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .comparison-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #111;
    }
    .comparison-what {
      font-size: 0.8rem;
      color: #555;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .comparison-problem {
      font-size: 0.8rem;
      color: #333;
      line-height: 1.5;
    }
    .comparison-punchline {
      font-size: 0.8rem;
      color: #888;
      line-height: 1.6;
      padding-left: 1rem;
      border-left: 2px solid #16a34a;
    }

    /* Failure cases */
    .failures {
      margin-bottom: 5rem;
    }
    .failure-card {
      border: 1px solid #1a1a1a;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .failure-scenario {
      padding: 1.25rem;
      background: #0d0d0d;
    }
    .failure-label {
      font-size: 0.65rem;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .failure-title {
      font-size: 0.9rem;
      color: #e0e0e0;
      margin-bottom: 0.5rem;
    }
    .failure-halves {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #1a1a1a;
    }
    .failure-half {
      padding: 1rem 1.25rem;
      background: #0a0a0a;
    }
    .failure-half-label {
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .failure-half-label.without { color: #a85454; }
    .failure-half-label.with { color: #16a34a; }
    .failure-half p {
      font-size: 0.75rem;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }
    .failure-half.bad p { color: #776060; }
    .failure-half.good p { color: #8a8a8a; }
    .failure-half code {
      font-family: 'Departure Mono', monospace;
      font-size: 0.7rem;
      background: #111;
      padding: 0.1rem 0.35rem;
    }

    @media (max-width: 640px) {
      .failure-halves { grid-template-columns: 1fr; }
    }

    /* Ecosystem */
    .ecosystem {
      margin-bottom: 5rem;
    }
    .ecosystem-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #1a1a1a;
      border: 1px solid #1a1a1a;
      margin-bottom: 1rem;
    }
    .ecosystem-item {
      background: #0a0a0a;
      padding: 1.25rem;
    }
    .ecosystem-name {
      font-size: 0.85rem;
      color: #e0e0e0;
      margin-bottom: 0.4rem;
    }
    .ecosystem-role {
      font-size: 0.7rem;
      color: #16a34a;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .ecosystem-desc {
      font-size: 0.75rem;
      color: #555;
      line-height: 1.5;
    }
    .ecosystem-footnote {
      font-size: 0.75rem;
      color: #333;
      text-align: center;
    }
    .ecosystem-footnote a {
      color: #444;
      text-decoration: none;
    }
    .ecosystem-footnote a:hover { color: #888; }

    /* MCP install */
    .mcp-install {
      margin-bottom: 5rem;
      text-align: center;
    }
    .mcp-install-cmd {
      display: inline-block;
      background: #111;
      border: 1px solid #1a1a1a;
      padding: 0.6rem 1.25rem;
      font-size: 0.75rem;
      color: #7c9a5e;
      font-family: 'Departure Mono', monospace;
      margin-top: 1rem;
      letter-spacing: 0.02em;
    }
    .mcp-install-note {
      font-size: 0.65rem;
      color: #333;
      margin-top: 0.6rem;
    }
    .mcp-install-note a {
      color: #444;
      text-decoration: none;
    }
    .mcp-install-note a:hover {
      color: #888;
    }

    /* Footer nav */
    .footer-nav {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #111;
      width: 100%;
    }
    .footer-nav a {
      font-size: 0.75rem;
      color: #444;
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    .footer-nav a:hover {
      color: #888;
    }

    /* Footer */
    .site-footer {
      font-size: 0.75rem;
      color: #333;
      text-align: center;
      width: 100%;
    }

    /* Tablet */
    @media (max-width: 640px) {
      body { padding: 3rem 1rem; }
      .hero { margin-bottom: 2rem; }
      .hero-brand { font-size: 3.2rem; letter-spacing: 0.14em; }
      .hero-tagline { font-size: 0.75rem; }
      .hero-headline { font-size: 1rem; }
      .section-label { font-size: 0.65rem; }
      .printout-wrapper { max-width: 100%; }
      .pin-strip { display: none; }
      .step { padding: 1rem; }
      .step-title { font-size: 1rem; }
      .code-block { font-size: 0.65rem; padding: 0.75rem; }
      .two-ways-grid { grid-template-columns: 1fr; }
      .ecosystem-grid { grid-template-columns: 1fr; }
      .failure-halves { grid-template-columns: 1fr; }
      .how-it-works, .showcase, .comparison, .two-ways, .failures, .ecosystem, .mcp-install { margin-bottom: 3rem; }
      .cta { margin-bottom: 2rem; }
      .cta-button { padding: 0.75rem 1.5rem; font-size: 0.85rem; }
      .signup-row { flex-direction: column; }
      .signup-input { border-right: 1px solid #222; }
      .comparison-item { flex-direction: column; gap: 0.25rem; }
      .footer-nav { gap: 1.25rem; }
    }

    /* Mobile */
    @media (max-width: 440px) {
      .hero-brand { font-size: 2.5rem; letter-spacing: 0.1em; }
      .hero-headline { font-size: 0.9rem; }
      .printout-row { padding: 0.4rem 0.75rem; font-size: 0.7rem; }
      .printout-row ul li { font-size: 0.65rem; }
      .printout-section-label { font-size: 0.55rem; }
      .printout-header h2 { font-size: 0.8rem; }
      .printout-meta { font-size: 0.55rem; }
      .failure-half { padding: 0.75rem 1rem; }
      .failure-half p { font-size: 0.7rem; }
      .failure-title { font-size: 0.8rem; }
      .ecosystem-desc { font-size: 0.7rem; }
      .footer-nav { gap: 1rem; flex-wrap: wrap; }
    }

    /* Small mobile */
    @media (max-width: 340px) {
      .hero-brand { font-size: 2rem; letter-spacing: 0.08em; }
    }

    /* Glyph flicker */
    .glyph-flicker {
      display: inline-block;
      transition: opacity 0.12s ease;
    }
  </style>
</head>
<body>
  <main class="container">

    <!-- Hero -->
    <section class="hero">
      <div class="hero-brand" aria-label="Context Capsule">
        <div class="hero-word"><span>C</span><span class="glyph-flicker" data-alt="0">O</span><span>N</span><span>T</span><span>E</span><span>X</span><span>T</span></div>
        <div class="hero-word"><span>C</span><span>A</span><span>P</span><span>S</span><span>U</span><span>L</span><span>E</span></div>
      </div>
      <div class="hero-tagline">portable context for agent workflows</div>
      <h1 class="hero-headline">The context your agents need &mdash; nothing they don&rsquo;t.</h1>
    </section>

    <!-- CTA -->
    <section class="cta" id="signup">
      <div id="signup-form">
        <div class="signup-row">
          <input type="email" id="signup-email" placeholder="you@example.com" class="signup-input" autocomplete="email">
          <button id="signup-btn" class="cta-button" onclick="doSignup()">Get API key</button>
        </div>
        <div class="cta-subtext">Free — 500 capsules/month. No credit card.</div>
      </div>
      <div id="signup-result" style="display:none">
        <div class="key-display">
          <div class="key-label" style="color:#16a34a;font-size:0.85rem;margin-bottom:0.75rem">Check your email</div>
          <div style="font-size:0.8rem;color:#888;line-height:1.6;">Your API key has been sent to <strong id="sent-email" style="color:#e0e0e0"></strong>.<br>It looks like a printout &mdash; you&rsquo;ll recognize it.</div>
        </div>
        <div class="cta-subtext" style="margin-top:0.75rem">Didn&rsquo;t get it? Check spam, or sign up via curl for instant access.</div>
      </div>
      <div id="signup-error" style="display:none">
        <div class="signup-error-msg" id="signup-error-msg"></div>
        <button class="cta-button" onclick="resetSignup()" style="margin-top:0.75rem">Try again</button>
      </div>
    </section>

    <!-- Capsule Showcase — tractor-feed printout -->
    <section class="showcase">
      <div class="printout-wrapper">
        <div class="pin-strip left">
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
        </div>
        <div class="printout">
          <div class="printout-tear-top"></div>
          <div class="printout-header">
            <h2>Context Capsule</h2>
            <div class="printout-badge">Active</div>
          </div>
          <div class="printout-id">cap_k7x9m2nq4p1r8w3v5</div>
          <div class="printout-row">
            <div class="printout-section-label">Summary</div>
            Investigated auth bug in refresh token logic. Root cause: JWT refresh window expired silently. Fixed in auth/refresh.ts with extended 7-day window.
          </div>
          <div class="printout-row">
            <div class="printout-section-label">Decisions</div>
            <ul>
              <li>Extended refresh window to 7 days over sliding sessions</li>
              <li>Kept legacy endpoint — 3 downstream consumers depend on it</li>
            </ul>
          </div>
          <div class="printout-row">
            <div class="printout-section-label">Next Steps</div>
            <ul>
              <li>Deploy to staging and run integration suite</li>
              <li>Notify API consumers about deprecation timeline</li>
            </ul>
          </div>
          <div class="printout-details">
            <details>
              <summary>&gt; view payload</summary>
              <pre>{
  "files_changed": ["src/auth/refresh.ts"],
  "test_results": "14 pass, 0 fail",
  "related_receipts": ["rct_proof1"]
}</pre>
            </details>
          </div>
          <div class="printout-row">
            <div class="printout-meta">
              <span>2 Apr 2026 12:00</span>
              <span>expires 3 Apr 2026</span>
            </div>
          </div>
          <div class="printout-footer">
            contextcapsule.ai
          </div>
          <div class="printout-tear-bottom"></div>
        </div>
        <div class="pin-strip right">
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
          <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <div class="section-label">How It Works</div>
      <div class="steps">

        <div class="step">
          <div class="step-number">01</div>
          <div class="step-title">Create</div>
          <p class="step-description">Package your agent&rsquo;s working context into a capsule — decisions, findings, next steps.</p>
          <div class="code-block"><span class="comment"># POST /v1/capsules</span>
{
  "summary": "Investigated auth bug. Fixed in auth/refresh.ts.",
  "decisions": ["Extended refresh window to 7 days"],
  "next_steps": ["Deploy to staging", "Notify consumers"],
  "idempotency_key": "auth-fix-session-42"
}</div>
        </div>

        <div class="step">
          <div class="step-number">02</div>
          <div class="step-title">Fetch</div>
          <p class="step-description">The next agent loads the capsule. Structured context, no re-discovery, no token waste.</p>
          <div class="code-block"><span class="comment"># GET /v1/capsules/cap_k7x9m2nq4p1r8w3v5</span>
{
  "id": "cap_k7x9m2nq4p1r8w3v5",
  "summary": "Investigated auth bug. Fixed in auth/refresh.ts.",
  "decisions": ["Extended refresh window to 7 days"],
  "next_steps": ["Deploy to staging", "Notify consumers"],
  "expires_at": "2026-04-03T12:00:00Z"
}</div>
        </div>

        <div class="step">
          <div class="step-number">03</div>
          <div class="step-title">Expire</div>
          <p class="step-description">Capsules auto-expire. Default 24 hours, up to 7 days. No stale context, no cleanup.</p>
        </div>

      </div>
    </section>

    <!-- Two interfaces -->
    <section class="two-ways">
      <div class="section-label">One capsule, two interfaces</div>
      <div class="two-ways-grid">
        <div class="two-ways-item">
          <div class="two-ways-label">For humans</div>
          <div class="two-ways-title">Shareable URL</div>
          <div class="two-ways-desc">Every capsule has a readable page. Share the link to see exactly what context was handed off &mdash; decisions, next steps, payload.</div>
        </div>
        <div class="two-ways-item">
          <div class="two-ways-label">For agents</div>
          <div class="two-ways-title">JSON API</div>
          <div class="two-ways-desc">Same capsule, machine-readable. Your agent fetches structured context and picks up exactly where the last one left off.</div>
        </div>
      </div>
      <div class="two-ways-footnote">Content negotiation &mdash; same URL, different formats.</div>
    </section>

    <!-- Why not just... -->
    <section class="comparison">
      <div class="section-label">Why not just use...</div>
      <div class="comparison-grid">
        <div class="comparison-item">
          <div class="comparison-what">Full conversation?</div>
          <div class="comparison-problem">50k tokens of noise to find 500 tokens of signal.</div>
        </div>
        <div class="comparison-item">
          <div class="comparison-what">A summary?</div>
          <div class="comparison-problem">Lossy. Misses decisions, open questions, structured data.</div>
        </div>
        <div class="comparison-item">
          <div class="comparison-what">A shared database?</div>
          <div class="comparison-problem">Couples your agents. No expiry, no structure, no portability.</div>
        </div>
      </div>
      <div class="comparison-punchline">Context Capsule gives the next agent compressed, structured, expiring context it can act on immediately.</div>
    </section>

    <!-- Why agents need capsules -->
    <section class="failures">
      <div class="section-label">Why agents need structured handoffs</div>

      <div class="failure-card">
        <div class="failure-scenario">
          <div class="failure-label">Wasted tokens</div>
          <div class="failure-title">Agent B re-discovers everything Agent A already found because the raw conversation was too long to pass.</div>
        </div>
        <div class="failure-halves">
          <div class="failure-half bad">
            <div class="failure-half-label without">Without capsules</div>
            <p>Agent A spends 50k tokens researching a bug. Agent B gets a one-line summary. Spends another 40k tokens re-investigating the same code paths.</p>
          </div>
          <div class="failure-half good">
            <div class="failure-half-label with">With Context Capsule</div>
            <p>Agent A creates a capsule with <code>summary</code>, <code>decisions</code>, and <code>next_steps</code>. Agent B loads 500 tokens of structured context and starts at step 4.</p>
          </div>
        </div>
      </div>

      <div class="failure-card">
        <div class="failure-scenario">
          <div class="failure-label">Lost decisions</div>
          <div class="failure-title">A handoff agent reverses a critical decision because it was buried in conversation history.</div>
        </div>
        <div class="failure-halves">
          <div class="failure-half bad">
            <div class="failure-half-label without">Without capsules</div>
            <p>Agent A decided to keep the legacy endpoint. Agent B doesn&rsquo;t know this, deletes it. Three services break.</p>
          </div>
          <div class="failure-half good">
            <div class="failure-half-label with">With Context Capsule</div>
            <p>The capsule&rsquo;s <code>decisions</code> field explicitly lists &ldquo;kept legacy endpoint &mdash; 3 consumers depend on it.&rdquo; Agent B reads it and leaves it alone.</p>
          </div>
        </div>
      </div>

      <div class="failure-card">
        <div class="failure-scenario">
          <div class="failure-label">Context overflow</div>
          <div class="failure-title">An agent&rsquo;s context window fills up with stale handoff data from three sessions ago.</div>
        </div>
        <div class="failure-halves">
          <div class="failure-half bad">
            <div class="failure-half-label without">Without capsules</div>
            <p>Each handoff dumps more text into the context window. By session 4, the agent is hallucinating against outdated information from session 1.</p>
          </div>
          <div class="failure-half good">
            <div class="failure-half-label with">With Context Capsule</div>
            <p>Each capsule expires. The agent only loads the most recent one. Chain them via <code>parent_capsule_id</code> if you need history. Fresh context, always.</p>
          </div>
        </div>
      </div>

    </section>

    <!-- ProofSlip + Context Capsule ecosystem -->
    <section class="ecosystem">
      <div class="section-label">Two primitives, one coordination layer</div>
      <div class="ecosystem-grid">
        <div class="ecosystem-item">
          <div class="ecosystem-name">ProofSlip</div>
          <div class="ecosystem-role">Verification</div>
          <div class="ecosystem-desc">Did it happen? Ephemeral receipts your agents verify before they act. Proof of past actions.</div>
        </div>
        <div class="ecosystem-item">
          <div class="ecosystem-name">Context Capsule</div>
          <div class="ecosystem-role">Knowledge</div>
          <div class="ecosystem-desc">What do I need to know? Structured handoff packets that carry decisions, findings, and next steps forward.</div>
        </div>
      </div>
      <div class="ecosystem-footnote">Capsules reference receipts. Receipts prove what capsules describe. <a href="https://proofslip.ai" target="_blank">proofslip.ai &rarr;</a></div>
    </section>

    <!-- MCP -->
    <section class="mcp-install">
      <div class="section-label">MCP Server</div>
      <div class="mcp-install-cmd">npx -y @contextcapsule/mcp-server</div>
      <div class="mcp-install-note">Works with Claude Desktop, Cursor, Windsurf, and any MCP client.</div>
    </section>

    <!-- Footer nav -->
    <nav class="footer-nav">
      <a href="/docs">API docs</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="https://www.proofslip.ai" target="_blank">ProofSlip</a>
      <a href="https://www.npmjs.com/package/@contextcapsule/mcp-server" target="_blank">npm</a>
      <a href="https://github.com/Johnny-Z13/context-capsule" target="_blank">GitHub</a>
    </nav>

    <!-- Footer -->
    <footer class="site-footer">
      contextcapsule.ai &mdash; capsules expire, knowledge transfers.
    </footer>

  </main>
  <script>
    var SIGNUP_URL = "/v1/auth/signup";
    async function doSignup() {
      var email = document.getElementById("signup-email").value.trim();
      if (!email) return;
      var btn = document.getElementById("signup-btn");
      btn.disabled = true;
      btn.textContent = "...";
      try {
        var res = await fetch(SIGNUP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, source: "web" })
        });
        var data = await res.json();
        if (!res.ok) {
          document.getElementById("signup-form").style.display = "none";
          document.getElementById("signup-error-msg").textContent = data.message || "Something went wrong.";
          document.getElementById("signup-error").style.display = "block";
          return;
        }
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("sent-email").textContent = email;
        document.getElementById("signup-result").style.display = "block";
      } catch (err) {
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("signup-error-msg").textContent = "Network error. Try again.";
        document.getElementById("signup-error").style.display = "block";
      } finally {
        btn.disabled = false;
        btn.textContent = "Get API key";
      }
    }
    function resetSignup() {
      document.getElementById("signup-error").style.display = "none";
      document.getElementById("signup-form").style.display = "block";
    }
    document.getElementById("signup-email").addEventListener("keydown", function(e) {
      if (e.key === "Enter") doSignup();
    });

    // Glyph flicker: O ↔ 0
    (function() {
      var glyphs = document.querySelectorAll('.glyph-flicker');
      glyphs.forEach(function(el, i) {
        var original = el.textContent;
        var alt = el.getAttribute('data-alt');
        var showing = true;
        var delay = i * 2400;
        setTimeout(function tick() {
          el.style.opacity = '0';
          setTimeout(function() {
            showing = !showing;
            el.textContent = showing ? original : alt;
            el.style.opacity = '1';
          }, 120);
          setTimeout(tick, 4000 + Math.random() * 2000);
        }, 3000 + delay);
      });
    })();
  </script>
</body>
</html>`
}
