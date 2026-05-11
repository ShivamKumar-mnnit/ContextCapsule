import { Context } from 'hono'

export function errorResponse(c: Context, status: number, error: string, message: string) {
  return c.json({ error, message }, status as any)
}
