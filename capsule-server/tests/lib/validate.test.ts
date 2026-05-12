import { describe, it, expect } from 'vitest'
import { isValidEmail, isValidPageType, isValidSourceType } from '../../src/lib/validate.js'

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('a+b@x.io')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
  })
})

describe('isValidPageType', () => {
  it('accepts known types', () => {
    expect(isValidPageType('concept')).toBe(true)
    expect(isValidPageType('entity')).toBe(true)
    expect(isValidPageType('synthesis')).toBe(true)
  })

  it('rejects unknown types', () => {
    expect(isValidPageType('random')).toBe(false)
  })
})

describe('isValidSourceType', () => {
  it('accepts text, url, file', () => {
    expect(isValidSourceType('text')).toBe(true)
    expect(isValidSourceType('url')).toBe(true)
    expect(isValidSourceType('file')).toBe(true)
  })

  it('rejects unknown types', () => {
    expect(isValidSourceType('pdf')).toBe(false)
  })
})
