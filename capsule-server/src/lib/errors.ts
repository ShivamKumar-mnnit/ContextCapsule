import { Context } from 'hono'

export function errorResponse(c: Context, status: number, error: string, message: string) {
  const requestId = (c as any).get('requestId') || null
  return c.json({ error, message, request_id: requestId }, status as any)
}
