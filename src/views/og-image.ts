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
