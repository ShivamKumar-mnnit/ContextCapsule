import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { opsLog } from '../db/schema.js'
import { errorResponse } from '../lib/errors.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'

const logRouter = new Hono()

logRouter.use('*', apiKeyAuth)
logRouter.use('*', rateLimitByApiKey)

logRouter.get('/', async (c) => {
  const apiKeyRecord = (c as any).get('apiKeyRecord') as { wikiId: string | null }
  if (!apiKeyRecord.wikiId) {
    return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')
  }

  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200)
  const offset = parseInt(c.req.query('offset') ?? '0', 10)
  const type = c.req.query('type') // optional filter: ingest | query | lint

  const db = getDb()
  let query = db
    .select()
    .from(opsLog)
    .where(eq(opsLog.wikiId, apiKeyRecord.wikiId))
    .orderBy(desc(opsLog.createdAt))
    .limit(limit)
    .offset(offset)

  if (type && ['ingest', 'query', 'lint'].includes(type)) {
    query = db
      .select()
      .from(opsLog)
      .where(eq(opsLog.wikiId, apiKeyRecord.wikiId) && eq(opsLog.type, type) as any)
      .orderBy(desc(opsLog.createdAt))
      .limit(limit)
      .offset(offset)
  }

  const rows = await query

  return c.json({ log: rows, count: rows.length, limit, offset })
})

export { logRouter }
