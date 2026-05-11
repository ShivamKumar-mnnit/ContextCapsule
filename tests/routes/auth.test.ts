import { describe, it, expect, afterAll } from 'vitest'
import app from '../../src/index.js'
import { getTestDb } from '../helpers.js'
import { apiKeys } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'

const createdEmails: string[] = []
let ipCounter = 0

function post(path: string, body: Record<string, unknown>) {
  ipCounter++
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  })
}

afterAll(async () => {
  const db = getTestDb()
  for (const email of createdEmails) {
    await db.delete(apiKeys).where(eq(apiKeys.ownerEmail, email))
  }
})

describe('POST /v1/auth/signup', () => {
  it('creates an API key for a new email', async () => {
    const email = `auth-test-${Date.now()}@contextcapsule.ai`
    createdEmails.push(email)
    const res = await post('/v1/auth/signup', { email })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.api_key).toMatch(/^ak_[0-9a-f]{64}$/)
    expect(data.tier).toBe('free')
  })

  it('rejects duplicate email', async () => {
    const email = `auth-dup-${Date.now()}@contextcapsule.ai`
    createdEmails.push(email)
    await post('/v1/auth/signup', { email })
    const res = await post('/v1/auth/signup', { email })
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('email_exists')
  })

  it('rejects missing email', async () => {
    const res = await post('/v1/auth/signup', {})
    expect(res.status).toBe(400)
  })

  it('rejects invalid email format', async () => {
    const res = await post('/v1/auth/signup', { email: 'not-an-email' })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('validation_error')
  })
})
