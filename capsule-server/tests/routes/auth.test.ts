import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../src/index.js'

const mockInsert = vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) }))
const mockSelect = vi.fn()

vi.mock('../../src/db/client.js', () => ({
  getDb: () => ({
    insert: mockInsert,
    select: mockSelect,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /v1/auth/signup', () => {
  it('returns 400 when email is missing', async () => {
    const res = await app.request('/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('validation_error')
  })

  it('returns 400 for invalid email format', async () => {
    const res = await app.request('/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail' }),
    })
    expect(res.status).toBe(400)
  })
})
