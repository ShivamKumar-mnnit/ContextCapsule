import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { capsules } from '../db/schema.js'
import { lt } from 'drizzle-orm'
import { errorResponse } from '../lib/errors.js'

const cronRouter = new Hono()

cronRouter.post('/cleanup', async (c) => {
  const authHeader = c.req.header('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse(c, 401, 'unauthorized', 'Invalid cron secret.')
  }

  const db = getDb()
  const now = new Date()

  const deleted = await db
    .delete(capsules)
    .where(lt(capsules.expiresAt, now))
    .returning({ id: capsules.id })

  return c.json({
    deleted_count: deleted.length,
    cleaned_at: now.toISOString(),
  })
})

export { cronRouter }
