import { createMiddleware } from 'hono/factory'
import { getDb } from '../db/client.js'
import { apiKeys } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { sha256 } from '../lib/hash.js'
import { getKeyPrefix } from '../lib/ids.js'
import { errorResponse } from '../lib/errors.js'

export const apiKeyAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, 401, 'unauthorized', 'Missing or invalid Authorization header. Use: Bearer {api_key}')
  }

  const key = authHeader.slice(7)
  if (!key.startsWith('ak_') || key.length !== 67) {
    return errorResponse(c, 401, 'unauthorized', 'Invalid API key format.')
  }

  const prefix = getKeyPrefix(key)
  const hash = sha256(key)

  const db = getDb()
  const candidates = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, prefix))

  const matched = candidates.find((k) => k.keyHash === hash)
  if (!matched) {
    return errorResponse(c, 401, 'unauthorized', 'Invalid API key.')
  }

  c.set('apiKeyRecord', matched)
  await next()
})
