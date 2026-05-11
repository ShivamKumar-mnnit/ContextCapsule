# Context Capsule Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Context Capsule API — a portable context handoff service for agent workflows, cloned from ProofSlip's architecture.

**Architecture:** Standalone Hono + Drizzle ORM + Neon PostgreSQL app deployed to Vercel. Same middleware stack, auth, and patterns as ProofSlip. Capsules are immutable, ephemeral (default 24h, max 7 days), with structured sections (summary, decisions, next_steps, payload, refs).

**Tech Stack:** Hono v4, Drizzle ORM, Neon PostgreSQL, TypeScript (strict), Vitest, nanoid, Vercel serverless

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `drizzle.config.ts`
- Create: `vercel.json`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Create package.json**

```json
{
  "name": "context-capsule",
  "version": "1.0.0",
  "description": "Portable context for agent workflows",
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "test": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts",
    "db:query": "tsx src/db/query.ts"
  },
  "type": "module",
  "dependencies": {
    "@hono/node-server": "^1.19.11",
    "@neondatabase/serverless": "^1.0.2",
    "drizzle-orm": "^0.45.1",
    "hono": "^4.12.8",
    "nanoid": "^5.1.7"
  },
  "devDependencies": {
    "@types/node": "^25.5.0",
    "dotenv": "^17.3.1",
    "drizzle-kit": "^0.31.10",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "vitest": "^4.1.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "types": ["node"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 3: Create drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 4: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
.env
.vercel/
.superpowers/
.claude/settings.local.json
```

**Step 6: Create .env.example**

```
DATABASE_URL=postgresql://...
BASE_URL=http://localhost:3000
CRON_SECRET=your-secret-here
RESEND_API_KEY=re_...
DEV_SECRET=your-dev-secret
NODEJS_HELPERS=0
```

**Step 7: Install dependencies**

Run: `npm install`

**Step 8: Commit**

```bash
git add package.json tsconfig.json drizzle.config.ts vercel.json .gitignore .env.example
git commit -m "feat: project scaffolding"
```

---

### Task 2: Shared Libraries (lib/)

**Files:**
- Create: `src/lib/ids.ts`
- Create: `src/lib/hash.ts`
- Create: `src/lib/errors.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/validate.ts`
- Create: `tests/setup.ts`
- Test: `tests/lib/ids.test.ts`
- Test: `tests/lib/hash.test.ts`
- Test: `tests/lib/rate-limit.test.ts`
- Test: `tests/lib/validate.test.ts`

**Step 1: Write tests for ids.ts**

```typescript
// tests/lib/ids.test.ts
import { describe, it, expect } from 'vitest'
import { generateCapsuleId, generateApiKeyId, generateApiKey, getKeyPrefix } from '../../src/lib/ids.js'

describe('ids', () => {
  it('generates capsule IDs with cap_ prefix', () => {
    const id = generateCapsuleId()
    expect(id).toMatch(/^cap_[A-Za-z0-9_-]{21}$/)
  })

  it('generates unique capsule IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCapsuleId()))
    expect(ids.size).toBe(100)
  })

  it('generates API key IDs with key_ prefix', () => {
    const id = generateApiKeyId()
    expect(id).toMatch(/^key_[A-Za-z0-9_-]{21}$/)
  })

  it('generates API keys with ak_ prefix and 64 hex chars', () => {
    const key = generateApiKey()
    expect(key).toMatch(/^ak_[0-9a-f]{64}$/)
    expect(key.length).toBe(67)
  })

  it('extracts key prefix correctly', () => {
    const key = generateApiKey()
    const prefix = getKeyPrefix(key)
    expect(prefix).toBe(key.slice(0, 11))
    expect(prefix).toMatch(/^ak_[0-9a-f]{8}$/)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/ids.test.ts`
Expected: FAIL — module not found

**Step 3: Implement ids.ts**

```typescript
// src/lib/ids.ts
import { nanoid } from 'nanoid'

export function generateCapsuleId(): string {
  return `cap_${nanoid(21)}`
}

export function generateApiKeyId(): string {
  return `key_${nanoid(21)}`
}

export function generateApiKey(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `ak_${hex}`
}

export function getKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 11)
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/ids.test.ts`
Expected: PASS

**Step 5: Write tests for hash.ts**

```typescript
// tests/lib/hash.test.ts
import { describe, it, expect } from 'vitest'
import { sha256 } from '../../src/lib/hash.js'

describe('sha256', () => {
  it('returns consistent hash for same input', () => {
    expect(sha256('hello')).toBe(sha256('hello'))
  })

  it('returns different hash for different input', () => {
    expect(sha256('hello')).not.toBe(sha256('world'))
  })

  it('returns 64 hex characters', () => {
    expect(sha256('test')).toMatch(/^[0-9a-f]{64}$/)
  })
})
```

**Step 6: Implement hash.ts**

```typescript
// src/lib/hash.ts
import { createHash } from 'node:crypto'

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
```

**Step 7: Run hash tests**

Run: `npx vitest run tests/lib/hash.test.ts`
Expected: PASS

**Step 8: Write tests for rate-limit.ts**

```typescript
// tests/lib/rate-limit.test.ts
import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '../../src/lib/rate-limit.js'

describe('checkRateLimit', () => {
  it('allows requests under limit', () => {
    const key = `test-${Date.now()}`
    const result = checkRateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests over limit', () => {
    const key = `test-block-${Date.now()}`
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000)
    const result = checkRateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})
```

**Step 9: Implement rate-limit.ts**

```typescript
// src/lib/rate-limit.ts
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
```

**Step 10: Run rate-limit tests**

Run: `npx vitest run tests/lib/rate-limit.test.ts`
Expected: PASS

**Step 11: Write tests for validate.ts**

```typescript
// tests/lib/validate.test.ts
import { describe, it, expect } from 'vitest'
import { validateCreateCapsule, isValidationError } from '../../src/lib/validate.js'

describe('validateCreateCapsule', () => {
  it('accepts valid minimal capsule', () => {
    const result = validateCreateCapsule({ summary: 'Fixed the auth bug.' })
    expect(isValidationError(result)).toBe(false)
  })

  it('accepts valid full capsule', () => {
    const result = validateCreateCapsule({
      summary: 'Fixed the auth bug.',
      decisions: ['Extended refresh to 7 days'],
      next_steps: ['Deploy to staging'],
      payload: { files: ['auth.ts'] },
      refs: { workflow_id: 'wf_123', receipt_ids: ['rct_abc'] },
      expires_in: 3600,
      idempotency_key: 'my-key',
      audience: 'human',
    })
    expect(isValidationError(result)).toBe(false)
  })

  it('rejects missing summary', () => {
    const result = validateCreateCapsule({})
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects summary over 500 chars', () => {
    const result = validateCreateCapsule({ summary: 'a'.repeat(501) })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects decisions with more than 20 items', () => {
    const result = validateCreateCapsule({
      summary: 'test',
      decisions: Array.from({ length: 21 }, (_, i) => `decision ${i}`),
    })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects decision item over 500 chars', () => {
    const result = validateCreateCapsule({
      summary: 'test',
      decisions: ['a'.repeat(501)],
    })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects next_steps with more than 20 items', () => {
    const result = validateCreateCapsule({
      summary: 'test',
      next_steps: Array.from({ length: 21 }, (_, i) => `step ${i}`),
    })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects payload over 32KB', () => {
    const result = validateCreateCapsule({
      summary: 'test',
      payload: { data: 'x'.repeat(33_000) },
    })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects expires_in below 60', () => {
    const result = validateCreateCapsule({ summary: 'test', expires_in: 30 })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects expires_in above 604800', () => {
    const result = validateCreateCapsule({ summary: 'test', expires_in: 700_000 })
    expect(isValidationError(result)).toBe(true)
  })

  it('rejects invalid audience', () => {
    const result = validateCreateCapsule({ summary: 'test', audience: 'robot' })
    expect(isValidationError(result)).toBe(true)
  })
})
```

**Step 12: Implement validate.ts**

```typescript
// src/lib/validate.ts
export interface CreateCapsuleInput {
  summary: string
  decisions?: string[]
  next_steps?: string[]
  payload?: Record<string, unknown>
  refs?: {
    workflow_id?: string
    agent_id?: string
    session_id?: string
    parent_capsule_id?: string
    receipt_ids?: string[]
  }
  expires_in?: number
  idempotency_key?: string
  audience?: 'human'
}

export interface ValidationError {
  error: 'validation_error'
  message: string
}

export function validateCreateCapsule(body: unknown): CreateCapsuleInput | ValidationError {
  if (!body || typeof body !== 'object') {
    return { error: 'validation_error', message: 'Request body must be a JSON object.' }
  }

  const b = body as Record<string, unknown>

  // summary — required, max 500
  if (!b.summary || typeof b.summary !== 'string') {
    return { error: 'validation_error', message: 'summary is required and must be a string.' }
  }
  if (b.summary.length > 500) {
    return { error: 'validation_error', message: 'summary must be 500 characters or fewer.' }
  }

  // decisions — optional string array, max 20 items, 500 chars each
  if (b.decisions !== undefined) {
    if (!Array.isArray(b.decisions)) {
      return { error: 'validation_error', message: 'decisions must be an array of strings.' }
    }
    if (b.decisions.length > 20) {
      return { error: 'validation_error', message: 'decisions must have 20 items or fewer.' }
    }
    for (const d of b.decisions) {
      if (typeof d !== 'string') {
        return { error: 'validation_error', message: 'Each decision must be a string.' }
      }
      if (d.length > 500) {
        return { error: 'validation_error', message: 'Each decision must be 500 characters or fewer.' }
      }
    }
  }

  // next_steps — optional string array, max 20 items, 500 chars each
  if (b.next_steps !== undefined) {
    if (!Array.isArray(b.next_steps)) {
      return { error: 'validation_error', message: 'next_steps must be an array of strings.' }
    }
    if (b.next_steps.length > 20) {
      return { error: 'validation_error', message: 'next_steps must have 20 items or fewer.' }
    }
    for (const s of b.next_steps) {
      if (typeof s !== 'string') {
        return { error: 'validation_error', message: 'Each next step must be a string.' }
      }
      if (s.length > 500) {
        return { error: 'validation_error', message: 'Each next step must be 500 characters or fewer.' }
      }
    }
  }

  // payload — optional JSON object, max 32KB
  if (b.payload !== undefined) {
    if (typeof b.payload !== 'object' || b.payload === null || Array.isArray(b.payload)) {
      return { error: 'validation_error', message: 'payload must be a JSON object.' }
    }
    if (JSON.stringify(b.payload).length > 32_768) {
      return { error: 'validation_error', message: 'payload must be 32KB or smaller.' }
    }
  }

  // refs — optional object
  if (b.refs !== undefined) {
    if (typeof b.refs !== 'object' || b.refs === null || Array.isArray(b.refs)) {
      return { error: 'validation_error', message: 'refs must be a JSON object.' }
    }
  }

  // expires_in — 60 to 604800
  if (b.expires_in !== undefined) {
    if (typeof b.expires_in !== 'number' || b.expires_in < 60 || b.expires_in > 604800) {
      return { error: 'validation_error', message: 'expires_in must be between 60 and 604800 seconds.' }
    }
  }

  // audience
  if (b.audience !== undefined) {
    if (b.audience !== 'human') {
      return { error: 'validation_error', message: 'audience must be "human" if provided.' }
    }
  }

  return {
    summary: b.summary as string,
    decisions: b.decisions as string[] | undefined,
    next_steps: b.next_steps as string[] | undefined,
    payload: b.payload as Record<string, unknown> | undefined,
    refs: b.refs as CreateCapsuleInput['refs'],
    expires_in: b.expires_in as number | undefined,
    idempotency_key: b.idempotency_key as string | undefined,
    audience: b.audience as 'human' | undefined,
  }
}

export function isValidationError(result: CreateCapsuleInput | ValidationError): result is ValidationError {
  return 'error' in result
}
```

**Step 13: Implement errors.ts**

```typescript
// src/lib/errors.ts
import { Context } from 'hono'

export function errorResponse(c: Context, status: number, error: string, message: string) {
  return c.json({ error, message }, status as any)
}
```

**Step 14: Create test setup**

```typescript
// tests/setup.ts
import 'dotenv/config'
```

**Step 15: Run all lib tests**

Run: `npx vitest run tests/lib/`
Expected: ALL PASS

**Step 16: Commit**

```bash
git add src/lib/ tests/
git commit -m "feat: shared libraries — ids, hash, rate-limit, validate, errors"
```

---

### Task 3: Database Schema & Utilities

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `src/db/migrate.ts`
- Create: `src/db/seed.ts`
- Create: `src/db/query.ts`

**Step 1: Create schema.ts**

```typescript
// src/db/schema.ts
import { pgTable, text, integer, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const capsules = pgTable('capsules', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').notNull(),
  summary: text('summary').notNull(),
  decisions: jsonb('decisions'),
  nextSteps: jsonb('next_steps'),
  payload: jsonb('payload'),
  refs: jsonb('refs'),
  idempotencyKey: text('idempotency_key'),
  audience: text('audience'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex('idx_capsules_idempotency').on(table.apiKeyId, table.idempotencyKey),
  index('idx_capsules_expires_at').on(table.expiresAt),
  index('idx_capsules_api_key_id').on(table.apiKeyId),
])

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  ownerEmail: text('owner_email').notNull(),
  tier: text('tier').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  usageCount: integer('usage_count').default(0),
  usageResetAt: timestamp('usage_reset_at', { withTimezone: true }),
}, (table) => [
  index('idx_api_keys_prefix').on(table.keyPrefix),
])
```

**Step 2: Create client.ts**

```typescript
// src/db/client.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql, { schema })
}
```

**Step 3: Create migrate.ts**

```typescript
// src/db/migrate.ts
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  console.log('Migrations complete.')
}

main().catch(console.error)
```

**Step 4: Create seed.ts**

```typescript
// src/db/seed.ts
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { apiKeys } from './schema.js'
import { generateApiKey, generateApiKeyId, getKeyPrefix } from '../lib/ids.js'
import { sha256 } from '../lib/hash.js'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seed() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npm run db:seed -- user@example.com')
    process.exit(1)
  }

  const key = generateApiKey()
  const keyId = generateApiKeyId()

  await db.insert(apiKeys).values({
    id: keyId,
    keyPrefix: getKeyPrefix(key),
    keyHash: sha256(key),
    ownerEmail: email,
    tier: 'free',
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  console.log(`\nAPI key created for ${email}:`)
  console.log(`\n  ${key}\n`)
  console.log('Save this key now. It cannot be retrieved later.\n')
}

seed().catch(console.error)
```

**Step 5: Create query.ts**

```typescript
// src/db/query.ts
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const keys = await sql`SELECT id, key_prefix, owner_email, tier, usage_count FROM api_keys`
  console.log('=== API KEYS ===')
  for (const k of keys) {
    console.log(`  ${k.key_prefix}...  ${k.owner_email}  tier=${k.tier}  usage=${k.usage_count}`)
  }

  const caps = await sql`SELECT id, summary, created_at, expires_at FROM capsules ORDER BY created_at DESC`
  console.log(`\n=== CAPSULES (${caps.length}) ===`)
  for (const c of caps) {
    console.log(`  ${c.id}  "${c.summary}"`)
    console.log(`    created: ${c.created_at}  expires: ${c.expires_at}`)
  }
}

main().catch(console.error)
```

**Step 6: Generate initial migration**

Run: `npx drizzle-kit generate`
(Requires DATABASE_URL in .env — user will set this up with Neon first)

**Step 7: Commit**

```bash
git add src/db/
git commit -m "feat: database schema, client, migrations, seed"
```

---

### Task 4: Middleware Stack

**Files:**
- Create: `src/middleware/security.ts`
- Create: `src/middleware/logger.ts`
- Create: `src/middleware/api-key-auth.ts`
- Create: `src/middleware/rate-limit.ts`

**Step 1: Create security.ts**

```typescript
// src/middleware/security.ts
import { createMiddleware } from 'hono/factory'
import { nanoid } from 'nanoid'

export const cors = createMiddleware(async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  c.header('Access-Control-Expose-Headers', 'X-Request-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset')
  c.header('Access-Control-Max-Age', '86400')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
})

export const requestId = createMiddleware(async (c, next) => {
  const id = c.req.header('x-request-id') || `req_${nanoid(16)}`
  c.set('requestId', id)
  c.header('X-Request-Id', id)
  await next()
})

export function bodyLimit(maxBytes: number) {
  return createMiddleware(async (c, next) => {
    const contentLength = c.req.header('content-length')
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return c.json(
        { error: 'payload_too_large', message: `Request body must be ${Math.floor(maxBytes / 1024)}KB or smaller.` },
        413
      )
    }
    await next()
  })
}

export const securityHeaders = createMiddleware(async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
})
```

**Step 2: Create logger.ts**

```typescript
// src/middleware/logger.ts
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
```

**Step 3: Create api-key-auth.ts**

```typescript
// src/middleware/api-key-auth.ts
import { createMiddleware } from 'hono/factory'
import { getDb } from '../db/client.js'
import { apiKeys } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { sha256 } from '../lib/hash.js'
import { getKeyPrefix } from '../lib/ids.js'
import { errorResponse } from '../lib/errors.js'

export const apiKeyAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, 401, 'unauthorized', 'Missing or invalid Authorization header. Use: Bearer {api_key}')
  }

  const key = authHeader.slice(7)
  if (!key.startsWith('ak_') || key.length !== 67) {
    return errorResponse(c, 401, 'unauthorized', 'Invalid API key format.')
  }

  const prefix = getKeyPrefix(key)
  const hash = sha256(key)

  const db = getDb()
  const candidates = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, prefix))

  const matched = candidates.find((k) => k.keyHash === hash)
  if (!matched) {
    return errorResponse(c, 401, 'unauthorized', 'Invalid API key.')
  }

  c.set('apiKeyRecord', matched)
  await next()
})
```

**Step 4: Create rate-limit.ts middleware**

```typescript
// src/middleware/rate-limit.ts
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
```

**Step 5: Commit**

```bash
git add src/middleware/
git commit -m "feat: middleware stack — security, logger, auth, rate limiting"
```

---

### Task 5: Routes — Create & Fetch Capsules

**Files:**
- Create: `src/routes/capsules.ts`
- Create: `src/routes/fetch.ts`
- Create: `src/routes/auth.ts`
- Create: `src/routes/cron.ts`
- Test: `tests/helpers.ts`
- Test: `tests/routes/capsules.test.ts`

**Step 1: Create test helpers**

```typescript
// tests/helpers.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { apiKeys, capsules } from '../src/db/schema.js'
import { generateApiKey, generateApiKeyId, getKeyPrefix } from '../src/lib/ids.js'
import { sha256 } from '../src/lib/hash.js'
import { eq } from 'drizzle-orm'

export function getTestDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql)
}

export async function seedTestApiKey() {
  const db = getTestDb()
  const key = generateApiKey()
  const keyId = generateApiKeyId()

  await db.insert(apiKeys).values({
    id: keyId,
    keyPrefix: getKeyPrefix(key),
    keyHash: sha256(key),
    ownerEmail: 'test@contextcapsule.ai',
    tier: 'free',
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return { key, keyId }
}

export async function cleanupTestApiKey(keyId: string) {
  const db = getTestDb()
  await db.delete(capsules).where(eq(capsules.apiKeyId, keyId))
  await db.delete(apiKeys).where(eq(apiKeys.id, keyId))
}
```

**Step 2: Write capsule route tests**

```typescript
// tests/routes/capsules.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../src/index.js'
import { seedTestApiKey, cleanupTestApiKey } from '../helpers.js'

let apiKey: string
let apiKeyId: string

beforeAll(async () => {
  const result = await seedTestApiKey()
  apiKey = result.key
  apiKeyId = result.keyId
})

afterAll(async () => {
  await cleanupTestApiKey(apiKeyId)
})

describe('POST /v1/capsules', () => {
  it('creates a capsule with only summary', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ summary: 'Fixed the auth bug.' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.capsule_id).toMatch(/^cap_/)
    expect(body.summary).toBe('Fixed the auth bug.')
    expect(body.capsule_url).toContain('/capsule/')
  })

  it('creates a capsule with all fields', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Investigated auth bug.',
        decisions: ['Extended refresh to 7 days'],
        next_steps: ['Deploy to staging'],
        payload: { files: ['auth.ts'] },
        refs: { workflow_id: 'wf_123', receipt_ids: ['rct_abc'] },
        idempotency_key: 'test-full-capsule',
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.decisions).toEqual(['Extended refresh to 7 days'])
    expect(body.next_steps).toEqual(['Deploy to staging'])
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'test' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing summary', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('handles idempotency — same key returns same capsule', async () => {
    const payload = {
      summary: 'Idempotent test.',
      idempotency_key: 'idemp-test-1',
    }
    const res1 = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const res2 = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    expect(res1.status).toBe(201)
    expect(res2.status).toBe(200)
    const body1 = await res1.json()
    const body2 = await res2.json()
    expect(body1.capsule_id).toBe(body2.capsule_id)
  })

  it('returns 409 for idempotency conflict', async () => {
    await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Original.',
        idempotency_key: 'conflict-test',
      }),
    })
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Different summary.',
        idempotency_key: 'conflict-test',
      }),
    })
    expect(res.status).toBe(409)
  })
})

describe('GET /v1/capsules/:id', () => {
  it('fetches a capsule as JSON', async () => {
    const createRes = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Fetch test.',
        decisions: ['Chose option A'],
        idempotency_key: 'fetch-test-1',
      }),
    })
    const { capsule_id } = await createRes.json()

    const res = await app.request(`/v1/capsules/${capsule_id}`, {
      headers: { 'Accept': 'application/json' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.capsule_id).toBe(capsule_id)
    expect(body.summary).toBe('Fetch test.')
    expect(body.decisions).toEqual(['Chose option A'])
  })

  it('returns 404 for nonexistent capsule', async () => {
    const res = await app.request('/v1/capsules/cap_doesnotexist123456', {
      headers: { 'Accept': 'application/json' },
    })
    expect(res.status).toBe(404)
  })
})
```

**Step 3: Implement capsules.ts route (create)**

```typescript
// src/routes/capsules.ts
import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { capsules, apiKeys } from '../db/schema.js'
import { eq, and, sql } from 'drizzle-orm'
import { generateCapsuleId } from '../lib/ids.js'
import { validateCreateCapsule, isValidationError } from '../lib/validate.js'
import { errorResponse } from '../lib/errors.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'

const capsulesRouter = new Hono()

capsulesRouter.use('*', apiKeyAuth)
capsulesRouter.use('*', rateLimitByApiKey)

capsulesRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const validated = validateCreateCapsule(body)

  if (isValidationError(validated)) {
    return errorResponse(c, 400, validated.error, validated.message)
  }

  const apiKeyRecord = (c as any).get('apiKeyRecord') as { id: string }
  const db = getDb()

  // Idempotency check
  if (validated.idempotency_key) {
    const existing = await db
      .select()
      .from(capsules)
      .where(
        and(
          eq(capsules.apiKeyId, apiKeyRecord.id),
          eq(capsules.idempotencyKey, validated.idempotency_key)
        )
      )

    if (existing.length > 0) {
      const capsule = existing[0]

      // Detect conflict: same key but different content
      if (capsule.summary !== validated.summary || capsule.audience !== (validated.audience || null)) {
        return errorResponse(c, 409, 'idempotency_conflict', 'A capsule with this idempotency_key already exists with different content.')
      }

      const baseUrl = process.env.BASE_URL || 'https://contextcapsule.ai'
      return c.json({
        capsule_id: capsule.id,
        summary: capsule.summary,
        decisions: capsule.decisions || null,
        next_steps: capsule.nextSteps || null,
        capsule_url: `${baseUrl}/capsule/${capsule.id}`,
        created_at: capsule.createdAt.toISOString(),
        expires_at: capsule.expiresAt.toISOString(),
        idempotency_key: capsule.idempotencyKey,
        ...(capsule.audience ? { audience: capsule.audience } : {}),
      }, 200)
    }
  }

  const capsuleId = generateCapsuleId()
  const expiresIn = validated.expires_in || 86400
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  await db.insert(capsules).values({
    id: capsuleId,
    apiKeyId: apiKeyRecord.id,
    summary: validated.summary,
    decisions: validated.decisions || null,
    nextSteps: validated.next_steps || null,
    payload: validated.payload || null,
    refs: validated.refs || null,
    idempotencyKey: validated.idempotency_key || null,
    audience: validated.audience || null,
    expiresAt,
  })

  // Increment usage count
  await db.update(apiKeys)
    .set({ usageCount: sql`${apiKeys.usageCount} + 1` })
    .where(eq(apiKeys.id, apiKeyRecord.id))
    .catch(() => {})

  const baseUrl = process.env.BASE_URL || 'https://contextcapsule.ai'

  return c.json({
    capsule_id: capsuleId,
    summary: validated.summary,
    decisions: validated.decisions || null,
    next_steps: validated.next_steps || null,
    capsule_url: `${baseUrl}/capsule/${capsuleId}`,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    idempotency_key: validated.idempotency_key || null,
    ...(validated.audience ? { audience: validated.audience } : {}),
  }, 201)
})

export { capsulesRouter }
```

**Step 4: Implement fetch.ts route**

```typescript
// src/routes/fetch.ts
import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { capsules } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { renderCapsulePage } from '../views/capsule-page.js'
import { renderNotFoundPage } from '../views/not-found-page.js'
import { rateLimitByIp } from '../middleware/rate-limit.js'

const fetchRouter = new Hono()

fetchRouter.use('*', rateLimitByIp(120))

fetchRouter.get('/:capsuleId', async (c) => {
  const capsuleId = c.req.param('capsuleId')
  const db = getDb()

  const results = await db
    .select()
    .from(capsules)
    .where(eq(capsules.id, capsuleId))

  const capsule = results[0]

  if (!capsule || capsule.expiresAt < new Date()) {
    const wantsJson =
      c.req.header('Accept')?.includes('application/json') ||
      c.req.query('format') === 'json'

    if (wantsJson) {
      return c.json(
        { error: 'capsule_not_found', message: 'Capsule does not exist, has expired, or has been deleted.' },
        404
      )
    }
    return c.html(renderNotFoundPage(), 404)
  }

  const wantsJson =
    c.req.header('Accept')?.includes('application/json') ||
    c.req.query('format') === 'json'

  if (wantsJson) {
    return c.json({
      capsule_id: capsule.id,
      summary: capsule.summary,
      decisions: capsule.decisions,
      next_steps: capsule.nextSteps,
      payload: capsule.payload,
      refs: capsule.refs,
      created_at: capsule.createdAt.toISOString(),
      expires_at: capsule.expiresAt.toISOString(),
      ...(capsule.audience ? { audience: capsule.audience } : {}),
    })
  }

  return c.html(renderCapsulePage({
    id: capsule.id,
    summary: capsule.summary,
    decisions: capsule.decisions as string[] | null,
    nextSteps: capsule.nextSteps as string[] | null,
    payload: capsule.payload,
    refs: capsule.refs,
    audience: capsule.audience,
    createdAt: capsule.createdAt.toISOString(),
    expiresAt: capsule.expiresAt.toISOString(),
  }))
})

export { fetchRouter }
```

**Step 5: Implement auth.ts route**

```typescript
// src/routes/auth.ts
import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { apiKeys } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { generateApiKey, generateApiKeyId, getKeyPrefix } from '../lib/ids.js'
import { sha256 } from '../lib/hash.js'
import { errorResponse } from '../lib/errors.js'
import { rateLimitByIp } from '../middleware/rate-limit.js'

const authRouter = new Hono()

authRouter.use('*', rateLimitByIp(5))

authRouter.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || typeof body.email !== 'string' || !body.email.trim()) {
    return errorResponse(c, 400, 'validation_error', 'Missing required field: email')
  }

  const email = body.email.trim().toLowerCase()
  const source = typeof body.source === 'string' ? body.source : 'api'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse(c, 400, 'validation_error', 'Invalid email format.')
  }

  const db = getDb()

  const existing = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.ownerEmail, email))

  if (existing.length > 0) {
    return errorResponse(c, 409, 'email_exists', 'An API key already exists for this email. Contact support to rotate your key.')
  }

  const key = generateApiKey()
  const keyId = generateApiKeyId()

  await db.insert(apiKeys).values({
    id: keyId,
    keyPrefix: getKeyPrefix(key),
    keyHash: sha256(key),
    ownerEmail: email,
    tier: 'free',
    usageResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  // For now, always return key in response (add email delivery later)
  return c.json({
    api_key: key,
    tier: 'free',
    message: 'Save this key now. It cannot be retrieved later.',
  }, 201)
})

export { authRouter }
```

**Step 6: Implement cron.ts route**

```typescript
// src/routes/cron.ts
import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { capsules } from '../db/schema.js'
import { lt } from 'drizzle-orm'
import { errorResponse } from '../lib/errors.js'

const cronRouter = new Hono()

cronRouter.post('/cleanup', async (c) => {
  const authHeader = c.req.header('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse(c, 401, 'unauthorized', 'Invalid cron secret.')
  }

  const db = getDb()
  const now = new Date()

  const deleted = await db
    .delete(capsules)
    .where(lt(capsules.expiresAt, now))
    .returning({ id: capsules.id })

  return c.json({
    deleted_count: deleted.length,
    cleaned_at: now.toISOString(),
  })
})

export { cronRouter }
```

**Step 7: Run route tests**

Run: `npx vitest run tests/routes/capsules.test.ts`
Expected: ALL PASS (requires DATABASE_URL in .env)

**Step 8: Commit**

```bash
git add src/routes/ tests/
git commit -m "feat: API routes — create, fetch, auth, cleanup"
```

---

### Task 6: Views — Capsule Page & Not Found

**Files:**
- Create: `src/views/capsule-page.ts`
- Create: `src/views/not-found-page.ts`

**Step 1: Create capsule-page.ts (tractor-feed printout)**

This is the human-readable view — same tractor-feed printout from the landing page but rendering real capsule data. Use the same CSS from the landing page showcase section. Include OG tags when `audience === 'human'`.

The view function signature:

```typescript
// src/views/capsule-page.ts
import { FONT_FACE_CSS } from './font.js'

interface CapsuleViewData {
  id: string
  summary: string
  decisions: string[] | null
  nextSteps: string[] | null
  payload: unknown
  refs: unknown
  audience: string | null
  createdAt: string
  expiresAt: string
}

export function renderCapsulePage(data: CapsuleViewData): string {
  // Full HTML page with tractor-feed printout styling
  // Same green/white alternating rows, pin holes, torn edges
  // OG meta tags if audience === 'human'
  // Collapsible payload section
  // Link back to contextcapsule.ai
}
```

Implement the full HTML template matching the landing page printout aesthetic. Reuse the same CSS classes and colors.

**Step 2: Create not-found-page.ts**

```typescript
// src/views/not-found-page.ts
import { FONT_FACE_CSS } from './font.js'

export function renderNotFoundPage(): string {
  // Faded tractor-feed printout showing "Expired / Not Found"
  // Same aesthetic, muted colors
  // Message: "This capsule does not exist, has expired, or has been deleted."
  // Link back to contextcapsule.ai
}
```

**Step 3: Commit**

```bash
git add src/views/capsule-page.ts src/views/not-found-page.ts
git commit -m "feat: capsule view page (tractor-feed printout) and 404 page"
```

---

### Task 7: App Entry Point & Dev Server

**Files:**
- Create: `src/index.ts`
- Create: `src/dev.ts`

**Step 1: Create index.ts**

```typescript
// src/index.ts
import { Hono } from 'hono'
import { capsulesRouter } from './routes/capsules.js'
import { fetchRouter } from './routes/fetch.js'
import { authRouter } from './routes/auth.js'
import { cronRouter } from './routes/cron.js'
import { renderLandingPage } from './views/landing-page.js'
import { cors, requestId, bodyLimit, securityHeaders } from './middleware/security.js'
import { requestLogger } from './middleware/logger.js'

const app = new Hono()

// Global middleware
app.use('*', cors)
app.use('*', securityHeaders)
app.use('*', requestId)
app.use('*', bodyLimit(49_152)) // 48KB max body (32KB payload + overhead)
app.use('*', requestLogger)

// Global error handler
app.onError((err, c) => {
  const requestIdValue = (c as any).get('requestId') || null
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    error: err.message,
    request_id: requestIdValue,
    method: c.req.method,
    path: c.req.path,
  }))

  return c.json({
    error: 'internal_error',
    message: 'An unexpected error occurred. Please try again later.',
    request_id: requestIdValue,
  }, 500)
})

// Routes
app.get('/', (c) => c.html(renderLandingPage()))
app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/v1/capsules', capsulesRouter)
app.route('/v1/capsules', fetchRouter)
app.route('/capsule', fetchRouter)
app.route('/v1/auth', authRouter)
app.route('/cron', cronRouter)

// 404 fallback
app.notFound((c) => {
  return c.json({ error: 'not_found', message: 'Route not found.' }, 404)
})

export default app
```

**Step 2: Create dev.ts**

```typescript
// src/dev.ts
import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index.js'

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
```

**Step 3: Verify dev server starts**

Run: `npm run dev`
Expected: "Server running at http://localhost:3000"
Test: `curl http://localhost:3000/health` → `{"status":"ok"}`

**Step 4: Commit**

```bash
git add src/index.ts src/dev.ts
git commit -m "feat: app entry point and dev server"
```

---

### Task 8: Discovery Endpoints

**Files:**
- Create: `src/views/llms-txt.ts`
- Create: `src/views/llms-full-txt.ts`
- Create: `src/views/docs-page.ts`
- Create: `src/views/openapi.ts`
- Create: `src/views/mcp-json.ts`
- Modify: `src/index.ts` — add discovery routes

**Step 1: Create llms-txt.ts**

LLM-friendly summary of the Context Capsule API. Plain text, ~200 lines. Covers: what it does, endpoints, auth, rate limits, capsule schema.

**Step 2: Create llms-full-txt.ts**

Complete API reference in plain text. Covers all fields, constraints, examples, error codes.

**Step 3: Create docs-page.ts**

Single-page HTML API docs. Same style as ProofSlip docs page (Departure Mono, dark theme, green accents, method badges). Adapted for capsule endpoints.

**Step 4: Create openapi.ts**

OpenAPI 3.1 JSON spec for Context Capsule API.

**Step 5: Create mcp-json.ts**

MCP discovery manifest pointing to the future @contextcapsule/mcp-server package.

**Step 6: Add routes to index.ts**

Add: `/llms.txt`, `/llms-full.txt`, `/docs`, `/.well-known/openapi.json`, `/.well-known/mcp.json`, `/.well-known/agent.json`, `/robots.txt`, `/sitemap.xml`

**Step 7: Commit**

```bash
git add src/views/ src/index.ts
git commit -m "feat: discovery endpoints — llms.txt, docs, OpenAPI, MCP"
```

---

### Task 9: Neon Database Setup & First Deploy

**This is a manual/guided task — walk user through:**

1. Create Neon project at neon.tech
2. Copy DATABASE_URL to `.env`
3. Run: `npm run db:generate` — generate migration
4. Run: `npm run db:migrate` — apply migration
5. Run: `npm run db:seed -- user@email.com` — create first API key
6. Test locally: `npm run dev` then curl endpoints
7. Deploy to Vercel: `vercel --prod`
8. Set env vars in Vercel dashboard
9. Verify production health endpoint

---

### Task 10: Integration Tests — Agent Workflows

**Files:**
- Test: `tests/routes/agent-workflows.test.ts`

**Step 1: Write workflow tests**

```typescript
// tests/routes/agent-workflows.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../../src/index.js'
import { seedTestApiKey, cleanupTestApiKey } from '../helpers.js'

let apiKey: string
let apiKeyId: string

beforeAll(async () => {
  const result = await seedTestApiKey()
  apiKey = result.key
  apiKeyId = result.keyId
})

afterAll(async () => {
  await cleanupTestApiKey(apiKeyId)
})

describe('Agent Workflow: Session Handoff', () => {
  it('Agent A creates capsule, Agent B fetches and continues', async () => {
    // Agent A: create capsule with context
    const createRes = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Investigated auth bug. Root cause: JWT refresh expired.',
        decisions: ['Extended refresh to 7 days', 'Kept legacy endpoint'],
        next_steps: ['Deploy to staging', 'Run integration tests'],
        payload: { files_changed: ['src/auth/refresh.ts'] },
        refs: { workflow_id: 'debug-auth-42', agent_id: 'claude-code' },
      }),
    })
    expect(createRes.status).toBe(201)
    const { capsule_id } = await createRes.json()

    // Agent B: fetch capsule and verify context
    const fetchRes = await app.request(`/v1/capsules/${capsule_id}`, {
      headers: { 'Accept': 'application/json' },
    })
    expect(fetchRes.status).toBe(200)
    const capsule = await fetchRes.json()
    expect(capsule.summary).toContain('auth bug')
    expect(capsule.decisions).toHaveLength(2)
    expect(capsule.next_steps).toHaveLength(2)
    expect(capsule.payload.files_changed).toEqual(['src/auth/refresh.ts'])
  })
})

describe('Agent Workflow: Capsule Chaining', () => {
  it('creates a chain of capsules via parent_capsule_id', async () => {
    // Session 1
    const res1 = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Session 1: Found the bug.',
        next_steps: ['Fix the bug'],
      }),
    })
    const { capsule_id: cap1 } = await res1.json()

    // Session 2: references session 1
    const res2 = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Session 2: Fixed the bug.',
        decisions: ['Applied patch to auth.ts'],
        refs: { parent_capsule_id: cap1 },
      }),
    })
    expect(res2.status).toBe(201)
    const { capsule_id: cap2 } = await res2.json()

    // Verify chain
    const fetchRes = await app.request(`/v1/capsules/${cap2}`, {
      headers: { 'Accept': 'application/json' },
    })
    const capsule = await fetchRes.json()
    expect(capsule.refs.parent_capsule_id).toBe(cap1)
  })
})

describe('Agent Workflow: ProofSlip Integration', () => {
  it('capsule references ProofSlip receipt IDs', async () => {
    const res = await app.request('/v1/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Completed refund workflow.',
        decisions: ['Processed refund for customer #8812'],
        refs: {
          receipt_ids: ['rct_abc123', 'rct_def456'],
          workflow_id: 'refund-8812',
        },
      }),
    })
    expect(res.status).toBe(201)
    const { capsule_id } = await res.json()

    const fetchRes = await app.request(`/v1/capsules/${capsule_id}`, {
      headers: { 'Accept': 'application/json' },
    })
    const capsule = await fetchRes.json()
    expect(capsule.refs.receipt_ids).toEqual(['rct_abc123', 'rct_def456'])
  })
})
```

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add tests/
git commit -m "test: agent workflow integration tests"
```

---

## Task Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Project scaffolding | — |
| 2 | Shared libraries (lib/) | 1 |
| 3 | Database schema & utilities | 1, 2 |
| 4 | Middleware stack | 2 |
| 5 | Routes — create, fetch, auth, cron | 2, 3, 4 |
| 6 | Views — capsule page, 404 | 1 |
| 7 | App entry point & dev server | 5, 6 |
| 8 | Discovery endpoints | 7 |
| 9 | Neon setup & first deploy | 7 |
| 10 | Integration tests | 7, 9 |

**Parallelizable:** Tasks 2, 3, 4, 6 can all run in parallel after Task 1.
