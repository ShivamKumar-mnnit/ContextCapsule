import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { apiKeys, wikis } from '../db/schema.js'
import { generateApiKey, generateApiKeyId, generateWikiId, getKeyPrefix } from '../lib/ids.js'
import { sha256 } from '../lib/hash.js'
import { errorResponse } from '../lib/errors.js'
import { isValidEmail } from '../lib/validate.js'
import { rateLimitByIp } from '../middleware/rate-limit.js'

const authRouter = new Hono()

authRouter.use('*', rateLimitByIp(5))

authRouter.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || typeof body.email !== 'string' || !body.email.trim()) {
    return errorResponse(c, 400, 'validation_error', 'Missing required field: email')
  }

  const email = body.email.trim().toLowerCase()

  if (!isValidEmail(email)) {
    return errorResponse(c, 400, 'validation_error', 'Invalid email format.')
  }

  const db = getDb()

  const existing = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.ownerEmail, email))

  if (existing.length > 0) {
    return errorResponse(c, 409, 'email_exists', 'An API key already exists for this email.')
  }

  const key = generateApiKey()
  const keyId = generateApiKeyId()
  const wikiId = generateWikiId()
  const wikiTitle = typeof body.wiki_title === 'string' && body.wiki_title.trim()
    ? body.wiki_title.trim()
    : 'My Wiki'

  // Create wiki first, then key (key references wiki)
  await db.insert(wikis).values({
    id: wikiId,
    ownerKeyId: keyId,
    title: wikiTitle,
    description: typeof body.wiki_description === 'string' ? body.wiki_description : null,
  })

  await db.insert(apiKeys).values({
    id: keyId,
    keyPrefix: getKeyPrefix(key),
    keyHash: sha256(key),
    ownerEmail: email,
    tier: 'free',
    wikiId,
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return c.json({
    api_key: key,
    wiki_id: wikiId,
    tier: 'free',
    message: 'Save this key now. It cannot be retrieved later.',
  }, 201)
})

export { authRouter }
