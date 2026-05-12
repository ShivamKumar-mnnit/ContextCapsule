import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { sources } from '../db/schema.js'
import { errorResponse } from '../lib/errors.js'
import { isValidSourceType } from '../lib/validate.js'
import { storeSource } from '../lib/wiki-ops.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'

const sourcesRouter = new Hono()

sourcesRouter.use('*', apiKeyAuth)
sourcesRouter.use('*', rateLimitByApiKey)

function getWikiId(c: any): string | null {
  return (c.get('apiKeyRecord') as { wikiId: string | null }).wikiId
}

// List sources (metadata only, no full content)
sourcesRouter.get('/', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const db = getDb()
  const rows = await db
    .select({
      id: sources.id,
      title: sources.title,
      type: sources.type,
      url: sources.url,
      pageIds: sources.pageIds,
      ingestedAt: sources.ingestedAt,
    })
    .from(sources)
    .where(eq(sources.wikiId, wikiId))

  return c.json({ sources: rows, total: rows.length })
})

// Get single source (includes full content)
sourcesRouter.get('/:id', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const db = getDb()
  const row = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, c.req.param('id')), eq(sources.wikiId, wikiId)))

  if (!row.length) return errorResponse(c, 404, 'not_found', 'Source not found.')

  return c.json({ source: row[0] })
})

// Store a raw source (client does processing separately)
// Body: { title, content, type?, url? }
sourcesRouter.post('/', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return errorResponse(c, 400, 'validation_error', 'Missing required field: title')
  }
  if (typeof body.content !== 'string' || !body.content.trim()) {
    return errorResponse(c, 400, 'validation_error', 'Missing required field: content')
  }

  const type = body.type ?? 'text'
  if (!isValidSourceType(type)) {
    return errorResponse(c, 400, 'validation_error', 'Invalid type. Must be: text, url, or file')
  }

  const sourceId = await storeSource({
    wikiId,
    title: body.title.trim(),
    content: body.content,
    type,
    url: typeof body.url === 'string' ? body.url : undefined,
  })

  return c.json({ source_id: sourceId }, 201)
})

export { sourcesRouter }
