import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { wikis } from '../db/schema.js'
import { errorResponse } from '../lib/errors.js'
import { buildCapsuleContext, getWikiTitle } from '../lib/wiki-ops.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'
import { generateLogId } from '../lib/ids.js'
import { opsLog } from '../db/schema.js'

const operationsRouter = new Hono()

operationsRouter.use('*', apiKeyAuth)
operationsRouter.use('*', rateLimitByApiKey)

function getWikiId(c: any): string | null {
  return (c.get('apiKeyRecord') as { wikiId: string | null }).wikiId
}

/**
 * POST /v1/wiki/capsule
 *
 * Compresses selected wiki pages into a shareable context capsule.
 * The capsule text is a flat markdown document — ready to paste into
 * an agent's context window or share with another agent via ContextCapsule.
 *
 * Body (all optional):
 *   page_ids    string[]  — specific pages to include (default: all)
 *   max_chars   number    — character budget (default: 32000)
 *   label       string    — human label for what this capsule is about
 */
operationsRouter.post('/capsule', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const body = await c.req.json().catch(() => ({}))
  const pageIds = Array.isArray(body.page_ids) ? body.page_ids : undefined
  const maxChars = typeof body.max_chars === 'number' ? body.max_chars : 32_000
  const label = typeof body.label === 'string' ? body.label : undefined

  const wikiTitle = await getWikiTitle(wikiId)

  const { text, pageCount, truncated } = await buildCapsuleContext({ wikiId, pageIds, maxChars })

  if (pageCount === 0) {
    return errorResponse(c, 422, 'empty_wiki', 'No pages found. Ingest some sources first.')
  }

  const header = [
    `# Wiki Context Capsule`,
    `**Wiki:** ${wikiTitle}`,
    label ? `**Topic:** ${label}` : null,
    `**Pages included:** ${pageCount}`,
    `**Generated:** ${new Date().toISOString()}`,
    truncated ? `*Note: output was truncated at ${maxChars} chars*` : null,
  ].filter(Boolean).join('\n')

  const capsuleText = `${header}\n\n---\n\n${text}`

  // Log the export
  const db = getDb()
  await db.insert(opsLog).values({
    id: generateLogId(),
    wikiId,
    type: 'capsule',
    summary: `[capsule] Exported ${pageCount} page(s)${label ? ` — ${label}` : ''}`,
    detail: { pageCount, truncated, maxChars, label: label ?? null },
  })

  return c.json({
    capsule_text: capsuleText,
    page_count: pageCount,
    char_count: capsuleText.length,
    truncated,
    wiki_title: wikiTitle,
  })
})

export { operationsRouter }
