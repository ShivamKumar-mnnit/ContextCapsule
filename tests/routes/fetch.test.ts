import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../src/index.js'
import { seedTestApiKey, cleanupTestApiKey } from '../helpers.js'

let apiKey: string
let keyId: string
let capsuleId: string

beforeAll(async () => {
  const result = await seedTestApiKey()
  apiKey = result.key
  keyId = result.keyId

  const res = await app.request('/v1/capsules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      summary: 'Fetch test capsule',
      decisions: ['Test decision'],
      audience: 'human',
    }),
  })
  const data = await res.json()
  capsuleId = data.capsule_id
})

afterAll(async () => {
  await cleanupTestApiKey(keyId)
})

describe('GET /v1/capsules/:id', () => {
  it('returns capsule as JSON', async () => {
    const res = await app.request(`/v1/capsules/${capsuleId}`, {
      headers: { 'Accept': 'application/json' },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.capsule_id).toBe(capsuleId)
    expect(data.summary).toBe('Fetch test capsule')
  })

  it('returns HTML for browser requests', async () => {
    const res = await app.request(`/v1/capsules/${capsuleId}`, {
      headers: { 'Accept': 'text/html' },
    })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Fetch test capsule')
  })

  it('returns JSON with ?format=json', async () => {
    const res = await app.request(`/v1/capsules/${capsuleId}?format=json`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.capsule_id).toBe(capsuleId)
  })

  it('returns 404 for nonexistent capsule', async () => {
    const res = await app.request('/v1/capsules/cap_nonexistent123456', {
      headers: { 'Accept': 'application/json' },
    })
    expect(res.status).toBe(404)
  })

  it('short URL /capsule/:id works', async () => {
    const res = await app.request(`/capsule/${capsuleId}?format=json`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.capsule_id).toBe(capsuleId)
  })
})
