import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../src/index.js'
import { seedTestApiKey, cleanupTestApiKey } from '../helpers.js'

let apiKey: string
let keyId: string

beforeAll(async () => {
  const result = await seedTestApiKey()
  apiKey = result.key
  keyId = result.keyId
})

afterAll(async () => {
  await cleanupTestApiKey(keyId)
})

function post(path: string, body: Record<string, unknown>, key = apiKey) {
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /v1/capsules', () => {
  it('creates a capsule with required fields', async () => {
    const res = await post('/v1/capsules', { summary: 'Test capsule from integration test' })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.capsule_id).toMatch(/^cap_/)
    expect(data.summary).toBe('Test capsule from integration test')
    expect(data.capsule_url).toContain('/capsule/')
    expect(data.expires_at).toBeTruthy()
  })

  it('creates a capsule with all fields', async () => {
    const res = await post('/v1/capsules', {
      summary: 'Full capsule test',
      decisions: ['Use React', 'Deploy to Vercel'],
      next_steps: ['Set up CI', 'Write tests'],
      payload: { key: 'value' },
      refs: { agent_id: 'test-agent', workflow_id: 'test-wf' },
      expires_in: 3600,
      audience: 'human',
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.decisions).toEqual(['Use React', 'Deploy to Vercel'])
    expect(data.next_steps).toEqual(['Set up CI', 'Write tests'])
    expect(data.audience).toBe('human')
  })

  it('rejects request without auth', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'No auth' }),
    })
    expect(res.status).toBe(401)
  })

  it('rejects invalid payload', async () => {
    const res = await post('/v1/capsules', {})
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('validation_error')
  })

  it('handles idempotency key', async () => {
    const body = { summary: 'Idempotent capsule', idempotency_key: `idem-${Date.now()}` }
    const res1 = await post('/v1/capsules', body)
    expect(res1.status).toBe(201)
    const data1 = await res1.json()
    const res2 = await post('/v1/capsules', body)
    expect(res2.status).toBe(200)
    const data2 = await res2.json()
    expect(data2.capsule_id).toBe(data1.capsule_id)
  })
})
