import { createMiddleware } from 'hono/factory'
import { checkRateLimit } from '../lib/rate-limit.js'
import { errorResponse } from '../lib/errors.js'

function setRateLimitHeaders(c: any, result: { limit: number; remaining: number; resetAt: number }) {
  c.header('X-RateLimit-Limit', String(result.limit))
  c.header('X-RateLimit-Remaining', String(Math.max(0, result.remaining)))
  c.header('X-RateLimit-Reset', String(result.resetAt))
}

export const rateLimitByApiKey = createMiddleware(async (c, next) => {
  const apiKeyRecord = (c as any).get('apiKeyRecord') as { id: string } | undefined
  if (!apiKeyRecord) {
    await next()
    return
  }

  const result = checkRateLimit(`apikey:${apiKeyRecord.id}`, 60, 60_000)
  setRateLimitHeaders(c, result)

  if (!result.allowed) {
    return errorResponse(c, 429, 'rate_limited', 'Too many requests. Try again later.')
  }

  await next()
})

export function rateLimitByIp(limit: number, windowMs: number = 60_000) {
  return createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown'

    const result = checkRateLimit(`ip:${ip}:${limit}`, limit, windowMs)
    setRateLimitHeaders(c, result)

    if (!result.allowed) {
      return errorResponse(c, 429, 'rate_limited', 'Too many requests. Try again later.')
    }

    await next()
  })
}
