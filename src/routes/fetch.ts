import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { capsules } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { renderCapsulePage } from '../views/capsule-page.js'
import { renderNotFoundPage } from '../views/not-found-page.js'
import { rateLimitByIp } from '../middleware/rate-limit.js'

const fetchRouter = new Hono()

fetchRouter.use('*', rateLimitByIp(120))

fetchRouter.get('/:capsuleId', async (c) => {
  const capsuleId = c.req.param('capsuleId')
  const db = getDb()

  const results = await db
    .select()
    .from(capsules)
    .where(eq(capsules.id, capsuleId))

  const capsule = results[0]

  if (!capsule || capsule.expiresAt < new Date()) {
    const wantsJson =
      c.req.header('Accept')?.includes('application/json') ||
      c.req.query('format') === 'json'

    if (wantsJson) {
      return c.json(
        { error: 'capsule_not_found', message: 'Capsule does not exist, has expired, or has been deleted.' },
        404
      )
    }
    return c.html(renderNotFoundPage(), 404)
  }

  const wantsJson =
    c.req.header('Accept')?.includes('application/json') ||
    c.req.query('format') === 'json'

  if (wantsJson) {
    return c.json({
      capsule_id: capsule.id,
      summary: capsule.summary,
      decisions: capsule.decisions,
      next_steps: capsule.nextSteps,
      payload: capsule.payload,
      refs: capsule.refs,
      created_at: capsule.createdAt.toISOString(),
      expires_at: capsule.expiresAt.toISOString(),
      ...(capsule.audience ? { audience: capsule.audience } : {}),
    })
  }

  return c.html(renderCapsulePage({
    id: capsule.id,
    summary: capsule.summary,
    decisions: capsule.decisions as string[] | null,
    nextSteps: capsule.nextSteps as string[] | null,
    payload: capsule.payload,
    refs: capsule.refs,
    audience: capsule.audience,
    createdAt: capsule.createdAt.toISOString(),
    expiresAt: capsule.expiresAt.toISOString(),
  }))
})

export { fetchRouter }
