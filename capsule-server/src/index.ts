import { Hono } from 'hono'
import { authRouter } from './routes/auth.js'
import { wikiRouter } from './routes/wiki.js'
import { pagesRouter } from './routes/pages.js'
import { sourcesRouter } from './routes/sources.js'
import { operationsRouter } from './routes/operations.js'
import { logRouter } from './routes/log.js'
import { cors, securityHeaders, requestId, bodyLimit } from './middleware/security.js'
import { requestLogger } from './middleware/logger.js'

const app = new Hono()

// Global middleware
app.use('*', cors)
app.use('*', securityHeaders)
app.use('*', requestId)
app.use('*', bodyLimit(512 * 1024)) // 512 KB — sources can be large
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
    message: 'An unexpected error occurred.',
    request_id: requestIdValue,
  }, 500)
})

// Health
app.get('/health', (c) => c.json({ status: 'ok', service: 'capsule-server' }))

// Auth
app.route('/v1/auth', authRouter)

// Wiki metadata + index
app.route('/v1/wiki', wikiRouter)

// Pages — CRUD + batch + cross-refs
app.route('/v1/wiki/pages', pagesRouter)

// Sources — store raw documents
app.route('/v1/wiki/sources', sourcesRouter)

// Capsule export — compress wiki to shareable context
app.route('/v1/wiki', operationsRouter)

// Operations log
app.route('/v1/wiki/log', logRouter)

// Discovery
app.get('/llms.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.text(`# Capsule Server — LLM-wiki storage backend

## What it is
A persistent, tree-structured knowledge base as a service.
No LLM runs server-side. Clients (Ollama, Claude Code, any agent) process
sources locally and push structured pages to this server via REST.

## Auth
All /v1/* routes require:  Authorization: Bearer ak_<key>
Get a key:  POST /v1/auth/signup  { "email": "..." }

## Typical agent workflow
1. POST /v1/wiki/sources          Store a raw source document
2. (Client runs Ollama locally)   Process source, decide what pages to create
3. POST /v1/wiki/pages/batch      Push processed pages to the server
4. POST /v1/wiki/cross-refs       Link related pages
5. POST /v1/wiki/capsule          Export wiki as a context capsule to share

## Wiki pages
GET    /v1/wiki/pages             List all pages (?format=tree|flat)
POST   /v1/wiki/pages             Create single page
POST   /v1/wiki/pages/batch       Create multiple pages at once (max 50)
GET    /v1/wiki/pages/:id         Get page + its cross-refs
PUT    /v1/wiki/pages/:id         Update page
DELETE /v1/wiki/pages/:id         Delete page + its cross-refs
POST   /v1/wiki/pages/cross-refs  Add cross-ref between two pages
DELETE /v1/wiki/pages/cross-refs/:id  Remove cross-ref

## Wiki metadata
GET /v1/wiki          Wiki info + page/source counts
PUT /v1/wiki          Update title / description
GET /v1/wiki/index    All pages grouped by type
GET /v1/wiki/sources  List ingested sources
GET /v1/wiki/log      Operations history (ingest/capsule)

## Capsule export
POST /v1/wiki/capsule
  Body: { page_ids?: string[], max_chars?: number, label?: string }
  Returns a markdown context blob ready to use in an agent's context window.

## OpenAPI
GET /.well-known/openapi.json
`)
})

app.get('/.well-known/openapi.json', (c) => {
  c.header('Cache-Control', 'public, max-age=3600')
  return c.json({
    openapi: '3.1.0',
    info: {
      title: 'Capsule Server',
      version: '1.0.0',
      description: 'LLM-wiki storage backend. Clients process content locally (Ollama etc.) and push structured pages here.',
    },
    servers: [{ url: process.env.BASE_URL ?? 'https://capsule-server.vercel.app' }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: 'API key with ak_ prefix' },
      },
      schemas: {
        Page: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            wiki_id: { type: 'string' },
            parent_id: { type: 'string', nullable: true },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string', description: 'Markdown content' },
            type: { type: 'string', enum: ['concept', 'entity', 'source-summary', 'synthesis', 'query-result', 'overview'] },
            metadata: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/v1/auth/signup': {
        post: {
          summary: 'Create API key + wiki',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    wiki_title: { type: 'string' },
                    wiki_description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'API key and wiki created' } },
        },
      },
      '/v1/wiki/sources': {
        post: {
          summary: 'Store a raw source document',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    type: { type: 'string', enum: ['text', 'url', 'file'], default: 'text' },
                    url: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Source stored, returns source_id' } },
        },
      },
      '/v1/wiki/pages/batch': {
        post: {
          summary: 'Create multiple pages at once (client-processed)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pages'],
                  properties: {
                    pages: {
                      type: 'array',
                      maxItems: 50,
                      items: {
                        type: 'object',
                        required: ['title'],
                        properties: {
                          title: { type: 'string' },
                          type: { type: 'string' },
                          content: { type: 'string' },
                          parent_title: { type: 'string' },
                          cross_ref_titles: { type: 'array', items: { type: 'string' } },
                          metadata: { type: 'object' },
                        },
                      },
                    },
                    source_id: { type: 'string', description: 'Link pages to their source' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Pages created, returns created_page_ids' } },
        },
      },
      '/v1/wiki/capsule': {
        post: {
          summary: 'Export wiki pages as a shareable context capsule',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    page_ids: { type: 'array', items: { type: 'string' }, description: 'Subset of pages to include (default: all)' },
                    max_chars: { type: 'number', default: 32000 },
                    label: { type: 'string', description: 'Human-readable label for this capsule' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Capsule context text + metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      capsule_text: { type: 'string' },
                      page_count: { type: 'number' },
                      char_count: { type: 'number' },
                      truncated: { type: 'boolean' },
                      wiki_title: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
})

// Cron placeholder (daily)
app.get('/cron/cleanup', (c) => {
  const secret = c.req.header('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET ?? ''}`) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  return c.json({ status: 'ok', ran_at: new Date().toISOString() })
})

app.notFound((c) => {
  return c.json({ error: 'not_found', message: 'Route not found.' }, 404)
})

export default app
