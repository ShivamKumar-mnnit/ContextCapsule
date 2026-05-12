import { Hono } from 'hono'
import { eq, count } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { wikis, pages, sources } from '../db/schema.js'
import { errorResponse } from '../lib/errors.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'
import { getWikiIndex } from '../lib/wiki-ops.js'

const wikiRouter = new Hono()

wikiRouter.use('*', apiKeyAuth)
wikiRouter.use('*', rateLimitByApiKey)

wikiRouter.get('/', async (c) => {
  const apiKeyRecord = (c as any).get('apiKeyRecord') as { wikiId: string | null }
  if (!apiKeyRecord.wikiId) {
    return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')
  }

  const db = getDb()
  const wiki = await db
    .select()
    .from(wikis)
    .where(eq(wikis.id, apiKeyRecord.wikiId))

  if (!wiki.length) {
    return errorResponse(c, 404, 'not_found', 'Wiki not found.')
  }

  const [pageCount] = await db
    .select({ count: count() })
    .from(pages)
    .where(eq(pages.wikiId, apiKeyRecord.wikiId))

  const [sourceCount] = await db
    .select({ count: count() })
    .from(sources)
    .where(eq(sources.wikiId, apiKeyRecord.wikiId))

  return c.json({
    wiki: {
      ...wiki[0],
      page_count: Number(pageCount.count),
      source_count: Number(sourceCount.count),
    },
  })
})

wikiRouter.put('/', async (c) => {
  const apiKeyRecord = (c as any).get('apiKeyRecord') as { wikiId: string | null }
  if (!apiKeyRecord.wikiId) {
    return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')
  }

  const body = await c.req.json().catch(() => null)
  if (!body) {
    return errorResponse(c, 400, 'validation_error', 'Invalid JSON body.')
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.title === 'string' && body.title.trim()) {
    updates.title = body.title.trim()
  }
  if (typeof body.description === 'string') {
    updates.description = body.description
  }

  const db = getDb()
  const updated = await db
    .update(wikis)
    .set(updates)
    .where(eq(wikis.id, apiKeyRecord.wikiId))
    .returning()

  return c.json({ wiki: updated[0] })
})

wikiRouter.get('/index', async (c) => {
  const apiKeyRecord = (c as any).get('apiKeyRecord') as { wikiId: string | null }
  if (!apiKeyRecord.wikiId) {
    return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')
  }

  const index = await getWikiIndex(apiKeyRecord.wikiId)
  return c.json({ index })
})

export { wikiRouter }
