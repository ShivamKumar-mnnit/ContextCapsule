import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { capsules, apiKeys } from '../db/schema.js'
import { eq, and, sql } from 'drizzle-orm'
import { generateCapsuleId } from '../lib/ids.js'
import { validateCreateCapsule, isValidationError } from '../lib/validate.js'
import { errorResponse } from '../lib/errors.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'

const capsulesRouter = new Hono()

capsulesRouter.use('*', apiKeyAuth)
capsulesRouter.use('*', rateLimitByApiKey)

capsulesRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const validated = validateCreateCapsule(body)

  if (isValidationError(validated)) {
    const firstError = validated[0]
    return errorResponse(c, 400, 'validation_error', `${firstError.field}: ${firstError.message}`)
  }

  const apiKeyRecord = (c as any).get('apiKeyRecord') as { id: string }
  const db = getDb()

  // Idempotency check
  if (validated.idempotency_key) {
    const existing = await db
      .select()
      .from(capsules)
      .where(
        and(
          eq(capsules.apiKeyId, apiKeyRecord.id),
          eq(capsules.idempotencyKey, validated.idempotency_key)
        )
      )

    if (existing.length > 0) {
      const capsule = existing[0]

      if (capsule.summary !== validated.summary || capsule.audience !== (validated.audience || null)) {
        return errorResponse(c, 409, 'idempotency_conflict', 'A capsule with this idempotency_key already exists with different content.')
      }

      const baseUrl = process.env.BASE_URL || 'https://www.contextcapsule.ai'
      return c.json({
        capsule_id: capsule.id,
        summary: capsule.summary,
        decisions: capsule.decisions || null,
        next_steps: capsule.nextSteps || null,
        capsule_url: `${baseUrl}/capsule/${capsule.id}`,
        created_at: capsule.createdAt.toISOString(),
        expires_at: capsule.expiresAt.toISOString(),
        idempotency_key: capsule.idempotencyKey,
        ...(capsule.audience ? { audience: capsule.audience } : {}),
      }, 200)
    }
  }

  const capsuleId = generateCapsuleId()
  const expiresIn = validated.expires_in || 86400
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  await db.insert(capsules).values({
    id: capsuleId,
    apiKeyId: apiKeyRecord.id,
    summary: validated.summary,
    decisions: validated.decisions || null,
    nextSteps: validated.next_steps || null,
    payload: validated.payload || null,
    refs: validated.refs || null,
    idempotencyKey: validated.idempotency_key || null,
    audience: validated.audience || null,
    expiresAt,
  })

  await db.update(apiKeys)
    .set({ usageCount: sql`${apiKeys.usageCount} + 1` })
    .where(eq(apiKeys.id, apiKeyRecord.id))
    .catch(() => {})

  const baseUrl = process.env.BASE_URL || 'https://www.contextcapsule.ai'

  return c.json({
    capsule_id: capsuleId,
    summary: validated.summary,
    decisions: validated.decisions || null,
    next_steps: validated.next_steps || null,
    capsule_url: `${baseUrl}/capsule/${capsuleId}`,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    idempotency_key: validated.idempotency_key || null,
    ...(validated.audience ? { audience: validated.audience } : {}),
  }, 201)
})

export { capsulesRouter }
