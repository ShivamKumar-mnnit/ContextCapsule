export interface ContextCapsuleConfig {
  apiKey?: string
  baseUrl: string
}

export function resolveConfig(options?: {
  apiKey?: string
  baseUrl?: string
}): ContextCapsuleConfig {
  return {
    apiKey: options?.apiKey ?? process.env.CONTEXTCAPSULE_API_KEY,
    baseUrl:
      options?.baseUrl ??
      process.env.CONTEXTCAPSULE_BASE_URL ??
      'https://www.contextcapsule.ai',
  }
}
