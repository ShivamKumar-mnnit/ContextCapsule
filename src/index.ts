import { Hono } from 'hono'
import { capsulesRouter } from './routes/capsules.js'
import { fetchRouter } from './routes/fetch.js'
import { authRouter } from './routes/auth.js'
import { cronRouter } from './routes/cron.js'
import { renderLandingPage } from './views/landing-page.js'
import { renderDevConsole } from './views/dev-console.js'
import { renderDocsPage } from './views/docs-page.js'
import { renderLlmsTxt } from './views/llms-txt.js'
import { renderLlmsFullTxt } from './views/llms-full-txt.js'
import { getOpenApiSpec } from './views/openapi.js'
import { getMcpDiscovery } from './views/mcp-json.js'
import { renderOgImageSvg } from './views/og-image.js'
import { renderCapsulePage } from './views/capsule-page.js'
import { cors, requestId, bodyLimit, securityHeaders } from './middleware/security.js'
import { requestLogger } from './middleware/logger.js'

const app = new Hono()

// Global middleware
app.use('*', cors)
app.use('*', securityHeaders)
app.use('*', requestId)
app.use('*', bodyLimit(49_152))
app.use('*', requestLogger)

// Global error handler
app.onError((err, c) => {
  const requestIdValue = (c as any).get('requestId') || null
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    error: err.message,
    request_id: requestIdValue,
    method: c.req.method,
    path: c.req.path,
  }))

  return c.json({
    error: 'internal_error',
    message: 'An unexpected error occurred. Please try again later.',
    request_id: requestIdValue,
  }, 500)
})

// Routes
app.get('/', (c) => c.html(renderLandingPage()))
app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/v1/capsules', fetchRouter)
app.route('/capsule', fetchRouter)
app.route('/v1/capsules', capsulesRouter)
app.route('/v1/auth', authRouter)
app.route('/cron', cronRouter)

// Example capsule
app.get('/example', (c) => {
  c.header('Cache-Control', 'public, max-age=86400')
  return c.html(renderCapsulePage({
    id: 'cap_example_9k2m7x4p',
    summary: 'Schema migration complete — user table split into users + profiles. Ready for integration tests.',
    decisions: [
      'Used addColumn for backward compat (no recreate)',
      'Dual-write enabled for 2-week transition period',
      'Backfill profiles from existing user data before cutover',
    ],
    nextSteps: [
      'Run integration tests against new schema',
      'Update API serializers for profile fields',
      'Schedule cutover date with platform team',
    ],
    payload: {
      migration_id: 'mig_20260403_split_users',
      tables_affected: ['users', 'profiles'],
      rows_backfilled: 12847,
      backward_compat: true,
    },
    refs: {
      workflow_id: 'migration-456',
      agent_id: 'schema-agent',
      session_id: 'sess_abc123',
    },
    audience: 'human',
    createdAt: '2026-04-03T12:00:00.000Z',
    expiresAt: '2026-04-10T12:00:00.000Z',
  }))
})

// Discovery endpoints
app.get('/docs', (c) => c.html(renderDocsPage()))
app.get('/llms.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(renderLlmsTxt())
})
app.get('/llms-full.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(renderLlmsFullTxt())
})
app.get('/.well-known/openapi.json', (c) => {
  c.header('Cache-Control', 'public, max-age=86400')
  return c.json(getOpenApiSpec())
})
app.get('/.well-known/mcp.json', (c) => {
  c.header('Cache-Control', 'public, max-age=86400')
  return c.json(getMcpDiscovery())
})
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
    api: { type: 'openapi', url: 'https://www.contextcapsule.ai/.well-known/openapi.json' },
    logo_url: 'https://www.contextcapsule.ai/og-image.png',
    contact_email: 'hello@contextcapsule.ai',
    legal_info_url: 'https://www.contextcapsule.ai',
  })
})
app.get('/.well-known/agent.json', (c) => {
  c.header('Cache-Control', 'public, max-age=86400')
  return c.json({
    name: 'Context Capsule',
    description: 'Portable context for agent workflows. Structured, compressed, ephemeral handoff packets.',
    url: 'https://www.contextcapsule.ai',
    version: '1.0.0',
    capabilities: ['capsules', 'handoffs', 'context-compression'],
    protocol: 'openapi',
    api: { type: 'openapi', url: 'https://www.contextcapsule.ai/.well-known/openapi.json' },
    auth: { type: 'bearer', signup_url: 'https://www.contextcapsule.ai/v1/auth/signup' },
    mcp: { package: '@contextcapsule/mcp-server', install: 'npx -y @contextcapsule/mcp-server' },
    llms_txt: 'https://www.contextcapsule.ai/llms.txt',
  })
})
app.get('/robots.txt', (c) => {
  return c.text(
    'User-agent: *\nAllow: /\n\n' +
    'Sitemap: https://www.contextcapsule.ai/sitemap.xml\n\n' +
    '# AI agent discovery\n' +
    '# LLM context: /llms.txt\n' +
    '# Full LLM docs: /llms-full.txt\n' +
    '# OpenAPI spec: /.well-known/openapi.json\n' +
    '# OpenAI plugin: /.well-known/ai-plugin.json\n' +
    '# Agent protocol: /.well-known/agent.json\n' +
    '# MCP discovery: /.well-known/mcp.json\n' +
    '# API docs: /docs\n'
  )
})
app.get('/sitemap.xml', (c) => {
  c.header('Content-Type', 'application/xml')
  return c.body(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.contextcapsule.ai</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://www.contextcapsule.ai/docs</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.contextcapsule.ai/llms.txt</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://www.contextcapsule.ai/llms-full.txt</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://www.contextcapsule.ai/.well-known/openapi.json</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://www.contextcapsule.ai/.well-known/mcp.json</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://www.contextcapsule.ai/.well-known/agent.json</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://www.contextcapsule.ai/.well-known/ai-plugin.json</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>`)
})

app.get('/og-image.png', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(renderOgImageSvg())
})

// Google Search Console verification
app.get('/google72aa1534e21928da.html', (c) => {
  return c.text('google-site-verification: google72aa1534e21928da.html')
})

// Dev console (private, requires DEV_SECRET)
app.get('/dev/console', (c) => {
  const secret = c.req.query('key')
  if (!secret || secret !== process.env.DEV_SECRET) {
    return c.json({ error: 'not_found', message: 'Route not found.' }, 404)
  }
  return c.html(renderDevConsole())
})

// 404 fallback
app.notFound((c) => {
  return c.json({ error: 'not_found', message: 'Route not found.' }, 404)
})

export default app
