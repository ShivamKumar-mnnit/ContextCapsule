import { nanoid } from 'nanoid'

export function generateApiKeyId(): string {
  return `key_${nanoid(21)}`
}

export function generateApiKey(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `ak_${hex}`
}

export function generateWikiId(): string {
  return `wik_${nanoid(21)}`
}

export function generatePageId(): string {
  return `pag_${nanoid(21)}`
}

export function generateSourceId(): string {
  return `src_${nanoid(21)}`
}

export function generateCrossRefId(): string {
  return `ref_${nanoid(21)}`
}

export function generateLogId(): string {
  return `log_${nanoid(21)}`
}

export function getKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 11)
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}
