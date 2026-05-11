import { describe, it, expect } from 'vitest'
import app from '../../src/index.js'

describe('API hygiene', () => {
  it('health endpoint returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
  })

  it('sets security headers', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('sets CORS headers', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it('sets request ID header', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('x-request-id')).toMatch(/^req_/)
  })

  it('returns 404 for unknown routes', async () => {
    const res = await app.request('/unknown/path')
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('not_found')
  })

  it('OPTIONS returns 204 for CORS preflight', async () => {
    const res = await app.request('/v1/capsules', { method: 'OPTIONS' })
    expect(res.status).toBe(204)
  })

  it('discovery endpoints return content', async () => {
    const llms = await app.request('/llms.txt')
    expect(llms.status).toBe(200)

    const openapi = await app.request('/.well-known/openapi.json')
    expect(openapi.status).toBe(200)

    const mcp = await app.request('/.well-known/mcp.json')
    expect(mcp.status).toBe(200)

    const agent = await app.request('/.well-known/agent.json')
    expect(agent.status).toBe(200)
  })
})
