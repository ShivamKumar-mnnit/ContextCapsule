import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '../../src/lib/rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset the module to clear the windows map between tests
    vi.useFakeTimers()
  })

  it('allows first request', () => {
    const result = checkRateLimit('test-first', 10, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
    expect(result.limit).toBe(10)
  })

  it('decrements remaining on subsequent requests', () => {
    const r1 = checkRateLimit('test-decrement', 10, 60_000)
    expect(r1.remaining).toBe(9)

    const r2 = checkRateLimit('test-decrement', 10, 60_000)
    expect(r2.remaining).toBe(8)

    const r3 = checkRateLimit('test-decrement', 10, 60_000)
    expect(r3.remaining).toBe(7)
  })

  it('blocks when limit is exceeded', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-exceed', 3, 60_000)
    }
    const result = checkRateLimit('test-exceed', 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('uses separate windows for different keys', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key-a', 3, 60_000)
    }
    // key-a is exhausted
    expect(checkRateLimit('key-a', 3, 60_000).allowed).toBe(false)

    // key-b should still be allowed
    const result = checkRateLimit('key-b', 3, 60_000)
    expect(result.allowed).toBe(true)
  })

  it('resets after window expires', () => {
    checkRateLimit('test-reset', 1, 1_000)
    expect(checkRateLimit('test-reset', 1, 1_000).allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(1_100)

    const result = checkRateLimit('test-reset', 1, 1_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('returns resetAt as seconds (not ms)', () => {
    const result = checkRateLimit('test-reset-at', 10, 60_000)
    // resetAt should be in seconds, roughly now + 60s
    const nowSeconds = Math.ceil(Date.now() / 1000)
    expect(result.resetAt).toBeGreaterThanOrEqual(nowSeconds)
    expect(result.resetAt).toBeLessThanOrEqual(nowSeconds + 61)
  })

  it('handles limit of 1', () => {
    const r1 = checkRateLimit('test-one', 1, 60_000)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(0)

    const r2 = checkRateLimit('test-one', 1, 60_000)
    expect(r2.allowed).toBe(false)
    expect(r2.remaining).toBe(0)
  })
})
