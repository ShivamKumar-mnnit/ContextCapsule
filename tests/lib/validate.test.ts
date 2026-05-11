import { describe, it, expect } from 'vitest'
import {
  validateCreateCapsule,
  isValidationError,
  ValidationError,
  CreateCapsuleInput,
} from '../../src/lib/validate'

describe('validateCreateCapsule', () => {
  it('accepts a valid minimal input', () => {
    const result = validateCreateCapsule({ summary: 'Test summary' })
    expect(isValidationError(result)).toBe(false)
    expect((result as CreateCapsuleInput).summary).toBe('Test summary')
  })

  it('accepts a fully populated valid input', () => {
    const input = {
      summary: 'Full capsule',
      decisions: ['decision 1', 'decision 2'],
      next_steps: ['step 1'],
      payload: { key: 'value' },
      refs: { pr: 'https://github.com/org/repo/pull/1' },
      expires_in: 3600,
      idempotency_key: 'idem-123',
      audience: 'human',
    }
    const result = validateCreateCapsule(input)
    expect(isValidationError(result)).toBe(false)
    const capsule = result as CreateCapsuleInput
    expect(capsule.summary).toBe('Full capsule')
    expect(capsule.decisions).toEqual(['decision 1', 'decision 2'])
    expect(capsule.next_steps).toEqual(['step 1'])
    expect(capsule.payload).toEqual({ key: 'value' })
    expect(capsule.refs).toEqual({ pr: 'https://github.com/org/repo/pull/1' })
    expect(capsule.expires_in).toBe(3600)
    expect(capsule.idempotency_key).toBe('idem-123')
    expect(capsule.audience).toBe('human')
  })

  // summary validation
  it('rejects missing summary', () => {
    const result = validateCreateCapsule({})
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[])[0].field).toBe('summary')
  })

  it('rejects non-string summary', () => {
    const result = validateCreateCapsule({ summary: 123 })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[])[0].field).toBe('summary')
  })

  it('rejects summary over 500 chars', () => {
    const result = validateCreateCapsule({ summary: 'a'.repeat(501) })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[])[0].field).toBe('summary')
  })

  it('accepts summary at exactly 500 chars', () => {
    const result = validateCreateCapsule({ summary: 'a'.repeat(500) })
    expect(isValidationError(result)).toBe(false)
  })

  // decisions validation
  it('rejects non-array decisions', () => {
    const result = validateCreateCapsule({ summary: 'ok', decisions: 'not-array' })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'decisions')).toBe(true)
  })

  it('rejects decisions with more than 20 items', () => {
    const result = validateCreateCapsule({
      summary: 'ok',
      decisions: Array.from({ length: 21 }, (_, i) => `d${i}`),
    })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'decisions')).toBe(true)
  })

  it('rejects decisions with items over 500 chars', () => {
    const result = validateCreateCapsule({
      summary: 'ok',
      decisions: ['a'.repeat(501)],
    })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'decisions[0]')).toBe(true)
  })

  it('rejects decisions containing non-strings', () => {
    const result = validateCreateCapsule({
      summary: 'ok',
      decisions: [123 as any],
    })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'decisions[0]')).toBe(true)
  })

  // next_steps validation
  it('rejects non-array next_steps', () => {
    const result = validateCreateCapsule({ summary: 'ok', next_steps: 'not-array' })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'next_steps')).toBe(true)
  })

  it('rejects next_steps with more than 20 items', () => {
    const result = validateCreateCapsule({
      summary: 'ok',
      next_steps: Array.from({ length: 21 }, (_, i) => `s${i}`),
    })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects next_steps items over 500 chars', () => {
    const result = validateCreateCapsule({
      summary: 'ok',
      next_steps: ['a'.repeat(501)],
    })
    expect(isValidationError(result)).toBe(true)
  })

  // payload validation
  it('rejects non-object payload', () => {
    const result = validateCreateCapsule({ summary: 'ok', payload: 'string' })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'payload')).toBe(true)
  })

  it('rejects array payload', () => {
    const result = validateCreateCapsule({ summary: 'ok', payload: [1, 2] })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'payload')).toBe(true)
  })

  it('rejects null payload', () => {
    const result = validateCreateCapsule({ summary: 'ok', payload: null })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'payload')).toBe(true)
  })

  it('rejects payload over 32KB', () => {
    const bigValue = 'x'.repeat(33 * 1024)
    const result = validateCreateCapsule({ summary: 'ok', payload: { data: bigValue } })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'payload')).toBe(true)
  })

  // refs validation
  it('rejects non-object refs', () => {
    const result = validateCreateCapsule({ summary: 'ok', refs: 'string' })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'refs')).toBe(true)
  })

  it('rejects array refs', () => {
    const result = validateCreateCapsule({ summary: 'ok', refs: [1] })
    expect(isValidationError(result)).toBe(true)
  })

  // expires_in validation
  it('rejects non-number expires_in', () => {
    const result = validateCreateCapsule({ summary: 'ok', expires_in: '3600' })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'expires_in')).toBe(true)
  })

  it('rejects expires_in below 60', () => {
    const result = validateCreateCapsule({ summary: 'ok', expires_in: 59 })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects expires_in above 604800', () => {
    const result = validateCreateCapsule({ summary: 'ok', expires_in: 604801 })
    expect(isValidationError(result)).toBe(true)
  })

  it('accepts expires_in at boundaries', () => {
    expect(isValidationError(validateCreateCapsule({ summary: 'ok', expires_in: 60 }))).toBe(false)
    expect(isValidationError(validateCreateCapsule({ summary: 'ok', expires_in: 604800 }))).toBe(false)
  })

  // idempotency_key validation
  it('rejects non-string idempotency_key', () => {
    const result = validateCreateCapsule({ summary: 'ok', idempotency_key: 123 })
    expect(isValidationError(result)).toBe(true)
  })

  // audience validation
  it('rejects audience that is not "human"', () => {
    const result = validateCreateCapsule({ summary: 'ok', audience: 'robot' })
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[]).some((e) => e.field === 'audience')).toBe(true)
  })

  it('accepts audience of "human"', () => {
    const result = validateCreateCapsule({ summary: 'ok', audience: 'human' })
    expect(isValidationError(result)).toBe(false)
  })

  // body-level validation
  it('rejects null body', () => {
    const result = validateCreateCapsule(null)
    expect(isValidationError(result)).toBe(true)
    expect((result as ValidationError[])[0].field).toBe('body')
  })

  it('rejects non-object body', () => {
    const result = validateCreateCapsule('string')
    expect(isValidationError(result)).toBe(true)
  })

  // multiple errors
  it('returns multiple errors at once', () => {
    const result = validateCreateCapsule({
      decisions: 'not-array',
      next_steps: 'not-array',
      expires_in: 'bad',
    })
    expect(isValidationError(result)).toBe(true)
    // At least summary + decisions + next_steps + expires_in errors
    expect((result as ValidationError[]).length).toBeGreaterThanOrEqual(4)
  })
})

describe('isValidationError', () => {
  it('returns true for validation error arrays', () => {
    expect(isValidationError([{ field: 'f', message: 'm' }])).toBe(true)
  })

  it('returns false for empty array', () => {
    expect(isValidationError([])).toBe(false)
  })

  it('returns false for non-array', () => {
    expect(isValidationError({ summary: 'test' })).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidationError(null)).toBe(false)
  })
})
