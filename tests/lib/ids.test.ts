import { describe, it, expect } from 'vitest'
import { generateCapsuleId, generateApiKeyId, generateApiKey, getKeyPrefix } from '../../src/lib/ids'

describe('generateCapsuleId', () => {
  it('returns a string starting with cap_', () => {
    const id = generateCapsuleId()
    expect(id).toMatch(/^cap_/)
  })

  it('has correct length (cap_ + 21 chars)', () => {
    const id = generateCapsuleId()
    expect(id.length).toBe(4 + 21)
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCapsuleId()))
    expect(ids.size).toBe(100)
  })
})

describe('generateApiKeyId', () => {
  it('returns a string starting with key_', () => {
    const id = generateApiKeyId()
    expect(id).toMatch(/^key_/)
  })

  it('has correct length (key_ + 21 chars)', () => {
    const id = generateApiKeyId()
    expect(id.length).toBe(4 + 21)
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateApiKeyId()))
    expect(ids.size).toBe(100)
  })
})

describe('generateApiKey', () => {
  it('returns a string starting with ak_', () => {
    const key = generateApiKey()
    expect(key).toMatch(/^ak_/)
  })

  it('has correct length (ak_ + 64 hex chars)', () => {
    const key = generateApiKey()
    expect(key.length).toBe(3 + 64)
  })

  it('contains only hex characters after prefix', () => {
    const key = generateApiKey()
    const hex = key.slice(3)
    expect(hex).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()))
    expect(keys.size).toBe(100)
  })
})

describe('getKeyPrefix', () => {
  it('returns first 11 characters of the key', () => {
    const key = 'ak_abcdef1234567890'
    expect(getKeyPrefix(key)).toBe('ak_abcdef12')
  })

  it('works with a real generated key', () => {
    const key = generateApiKey()
    const prefix = getKeyPrefix(key)
    expect(prefix.length).toBe(11)
    expect(key.startsWith(prefix)).toBe(true)
  })
})
