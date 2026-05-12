import { describe, it, expect } from 'vitest'
import {
  generateApiKey, generateApiKeyId, generateWikiId,
  generatePageId, generateSourceId, getKeyPrefix, slugify,
} from '../../src/lib/ids.js'

describe('id generators', () => {
  it('generateApiKey starts with ak_ and is 67 chars', () => {
    const key = generateApiKey()
    expect(key.startsWith('ak_')).toBe(true)
    expect(key.length).toBe(67)
  })

  it('generateApiKeyId starts with key_', () => {
    expect(generateApiKeyId().startsWith('key_')).toBe(true)
  })

  it('generateWikiId starts with wik_', () => {
    expect(generateWikiId().startsWith('wik_')).toBe(true)
  })

  it('generatePageId starts with pag_', () => {
    expect(generatePageId().startsWith('pag_')).toBe(true)
  })

  it('generateSourceId starts with src_', () => {
    expect(generateSourceId().startsWith('src_')).toBe(true)
  })

  it('getKeyPrefix returns first 11 chars', () => {
    const key = generateApiKey()
    expect(getKeyPrefix(key)).toBe(key.slice(0, 11))
  })
})

describe('slugify', () => {
  it('converts title to slug', () => {
    expect(slugify('Machine Learning')).toBe('machine-learning')
  })

  it('strips special characters', () => {
    expect(slugify('A/B Testing & Metrics!')).toBe('ab-testing-metrics')
  })

  it('collapses multiple dashes', () => {
    expect(slugify('Hello   World')).toBe('hello-world')
  })
})
