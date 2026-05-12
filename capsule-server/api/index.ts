import type { IncomingMessage, ServerResponse } from 'node:http'
import app from '../src/index.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Buffer the request body
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const body = Buffer.concat(chunks)

  // Build a Web API Request from the Node.js IncomingMessage
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url ?? '/', `https://${host}`)

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
  }

  const request = new Request(url.toString(), {
    method: req.method ?? 'GET',
    headers,
    body: ['GET', 'HEAD'].includes(req.method ?? '') ? undefined : body,
  })

  // Run through Hono
  const response = await app.fetch(request)

  // Write response back to Node.js ServerResponse
  const resHeaders: Record<string, string> = {}
  response.headers.forEach((val, key) => { resHeaders[key] = val })
  res.writeHead(response.status, resHeaders)

  const resBody = await response.arrayBuffer()
  res.end(Buffer.from(resBody))
}
