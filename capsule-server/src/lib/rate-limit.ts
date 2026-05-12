const windows = new Map<string, { count: number; resetAt: number }>()

let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60_000

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; limit: number; remaining: number; resetAt: number } {
  cleanup()

  const now = Date.now()
  const entry = windows.get(key)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs
    windows.set(key, { count: 1, resetAt })
    return { allowed: true, limit, remaining: limit - 1, resetAt: Math.ceil(resetAt / 1000) }
  }

  entry.count++
  if (entry.count > limit) {
    return { allowed: false, limit, remaining: 0, resetAt: Math.ceil(entry.resetAt / 1000) }
  }

  return { allowed: true, limit, remaining: limit - entry.count, resetAt: Math.ceil(entry.resetAt / 1000) }
}
