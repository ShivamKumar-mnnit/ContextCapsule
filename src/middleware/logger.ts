import { createMiddleware } from 'hono/factory'

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now()

  await next()

  const latencyMs = Date.now() - start
  const apiKeyRecord = (c as any).get('apiKeyRecord') as { id: string } | undefined

  const log = {
    ts: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    latency_ms: latencyMs,
    request_id: (c as any).get('requestId') || null,
    api_key_id: apiKeyRecord?.id || null,
    ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || null,
  }

  console.log(JSON.stringify(log))
})
