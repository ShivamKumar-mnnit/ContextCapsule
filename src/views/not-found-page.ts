import { FONT_FACE_CSS } from './font.js'

export function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capsule Not Found | Context Capsule</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%230a0a0a'/><text x='50' y='68' text-anchor='middle' font-size='52' font-family='monospace' fill='%23e0e0e0'>C</text></svg>">
  <style>
    ${FONT_FACE_CSS}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Departure Mono', monospace;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .printout-wrapper {
      max-width: 440px;
      width: 100%;
      display: flex;
      position: relative;
      margin: 0 auto;
      opacity: 0.7;
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
      border: 1px solid #666;
      flex-shrink: 0;
    }
    .printout {
      flex: 1;
      overflow: hidden;
      border: 1px solid #999;
      position: relative;
    }
    .printout-tear-top,
    .printout-tear-bottom {
      height: 6px;
      background: repeating-linear-gradient(
        90deg,
        #e0ddd8 0px,
        #e0ddd8 4px,
        transparent 4px,
        transparent 8px
      );
    }
    .printout-header {
      text-align: center;
      padding: 1.25rem 1rem 1rem;
      background: #e0ddd8;
    }
    .printout-header h2 {
      font-size: 0.9rem;
      font-weight: normal;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #999;
    }
    .expired-badge {
      display: inline-block;
      margin-top: 0.4rem;
      padding: 0.2rem 0.6rem;
      border: 1px solid #999;
      color: #999;
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .message {
      text-align: center;
      padding: 1.5rem 1.25rem;
      font-size: 0.75rem;
      line-height: 1.6;
      color: #aaa;
      background: #eae7e2;
    }
    .printout-footer {
      text-align: center;
      padding: 0.75rem 1rem;
      background: #e0ddd8;
    }
    .printout-footer a {
      color: #999;
      text-decoration: none;
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-family: 'Departure Mono', monospace;
    }
    .printout-footer a:hover { color: #666; }

    @media (max-width: 640px) {
      .printout-wrapper { max-width: 100%; }
      .pin-strip { display: none; }
    }
  </style>
</head>
<body>
  <div class="printout-wrapper">
    <div class="pin-strip left">
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
    </div>
    <div class="printout">
      <div class="printout-tear-top"></div>
      <div class="printout-header">
        <h2>Context Capsule</h2>
        <div class="expired-badge">Expired / Not Found</div>
      </div>
      <div class="message">
        This capsule does not exist, has expired, or has been deleted.<br>
        Capsules expire after their configured TTL (default 24 hours).
      </div>
      <div class="printout-footer">
        <a href="/">contextcapsule.ai</a>
      </div>
      <div class="printout-tear-bottom"></div>
    </div>
    <div class="pin-strip right">
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
      <div class="pin-hole"></div><div class="pin-hole"></div><div class="pin-hole"></div>
    </div>
  </div>
</body>
</html>`
}
