export const PAGE_TYPES = ['concept', 'entity', 'source-summary', 'synthesis', 'query-result', 'overview'] as const
export type PageType = typeof PAGE_TYPES[number]

export const SOURCE_TYPES = ['text', 'url', 'file'] as const
export type SourceType = typeof SOURCE_TYPES[number]

export const CROSS_REF_LABELS = ['related', 'contradicts', 'supports', 'extends'] as const
export type CrossRefLabel = typeof CROSS_REF_LABELS[number]

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPageType(type: string): type is PageType {
  return PAGE_TYPES.includes(type as PageType)
}

export function isValidSourceType(type: string): type is SourceType {
  return SOURCE_TYPES.includes(type as SourceType)
}

export function isValidCrossRefLabel(label: string): label is CrossRefLabel {
  return CROSS_REF_LABELS.includes(label as CrossRefLabel)
}
