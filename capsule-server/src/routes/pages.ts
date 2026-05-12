import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { pages, crossRefs } from '../db/schema.js'
import { generatePageId, generateCrossRefId, slugify } from '../lib/ids.js'
import { errorResponse } from '../lib/errors.js'
import { isValidPageType, isValidCrossRefLabel } from '../lib/validate.js'
import { createPagesBatch, linkSourceToPages } from '../lib/wiki-ops.js'
import { apiKeyAuth } from '../middleware/api-key-auth.js'
import { rateLimitByApiKey } from '../middleware/rate-limit.js'

const pagesRouter = new Hono()

pagesRouter.use('*', apiKeyAuth)
pagesRouter.use('*', rateLimitByApiKey)

function getWikiId(c: any): string | null {
  return (c.get('apiKeyRecord') as { wikiId: string | null }).wikiId
}

// List all pages — flat or tree
pagesRouter.get('/', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const format = c.req.query('format') ?? 'flat'
  const db = getDb()

  const allPages = await db
    .select()
    .from(pages)
    .where(eq(pages.wikiId, wikiId))

  if (format === 'tree') {
    // Build adjacency-list tree
    const map = new Map(allPages.map((p) => [p.id, { ...p, children: [] as any[] }]))
    const roots: any[] = []
    for (const p of allPages) {
      if (p.parentId && map.has(p.parentId)) {
        map.get(p.parentId)!.children.push(map.get(p.id))
      } else {
        roots.push(map.get(p.id))
      }
    }
    return c.json({ pages: roots, total: allPages.length })
  }

  return c.json({ pages: allPages, total: allPages.length })
})

// Get single page with its cross-refs
pagesRouter.get('/:id', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const db = getDb()
  const page = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, c.req.param('id')), eq(pages.wikiId, wikiId)))

  if (!page.length) return errorResponse(c, 404, 'not_found', 'Page not found.')

  const refs = await db
    .select()
    .from(crossRefs)
    .where(eq(crossRefs.fromPageId, page[0].id))

  const backRefs = await db
    .select()
    .from(crossRefs)
    .where(eq(crossRefs.toPageId, page[0].id))

  return c.json({ page: page[0], cross_refs: refs, back_refs: backRefs })
})

// Create page manually
pagesRouter.post('/', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return errorResponse(c, 400, 'validation_error', 'Missing required field: title')
  }

  const type = body.type ?? 'concept'
  if (!isValidPageType(type)) {
    return errorResponse(c, 400, 'validation_error', `Invalid type. Must be one of: concept, entity, source-summary, synthesis, query-result, overview`)
  }

  const db = getDb()
  const id = generatePageId()
  const slug = slugify(body.title.trim())

  const existing = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.wikiId, wikiId), eq(pages.slug, slug)))

  const finalSlug = existing.length > 0 ? `${slug}-${id.slice(-6)}` : slug

  const newPage = await db.insert(pages).values({
    id,
    wikiId,
    parentId: typeof body.parent_id === 'string' ? body.parent_id : null,
    title: body.title.trim(),
    slug: finalSlug,
    content: typeof body.content === 'string' ? body.content : '',
    type,
    metadata: body.metadata ?? {},
  }).returning()

  return c.json({ page: newPage[0] }, 201)
})

// Update page
pagesRouter.put('/:id', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const db = getDb()
  const existing = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, c.req.param('id')), eq(pages.wikiId, wikiId)))

  if (!existing.length) return errorResponse(c, 404, 'not_found', 'Page not found.')

  const body = await c.req.json().catch(() => null)
  if (!body) return errorResponse(c, 400, 'validation_error', 'Invalid JSON body.')

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (typeof body.content === 'string') updates.content = body.content
  if (typeof body.parent_id === 'string' || body.parent_id === null) updates.parentId = body.parent_id
  if (typeof body.type === 'string' && isValidPageType(body.type)) updates.type = body.type
  if (body.metadata !== undefined) updates.metadata = body.metadata

  const updated = await db
    .update(pages)
    .set(updates)
    .where(eq(pages.id, c.req.param('id')))
    .returning()

  return c.json({ page: updated[0] })
})

// Delete page
pagesRouter.delete('/:id', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const db = getDb()
  const existing = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, c.req.param('id')), eq(pages.wikiId, wikiId)))

  if (!existing.length) return errorResponse(c, 404, 'not_found', 'Page not found.')

  // Remove cross-refs involving this page
  await db.delete(crossRefs).where(eq(crossRefs.fromPageId, c.req.param('id')))
  await db.delete(crossRefs).where(eq(crossRefs.toPageId, c.req.param('id')))
  await db.delete(pages).where(eq(pages.id, c.req.param('id')))

  return c.body(null, 204)
})

/**
 * POST /v1/wiki/pages/batch
 *
 * Create multiple pages at once — the primary way an Ollama agent (or any client)
 * pushes processed content after reading a source.
 *
 * Body: {
 *   pages: [{ title, type?, content, parent_title?, cross_ref_titles?, metadata? }],
 *   source_id?: string   -- link these pages back to their source
 * }
 */
pagesRouter.post('/batch', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const body = await c.req.json().catch(() => null)
  if (!body || !Array.isArray(body.pages) || body.pages.length === 0) {
    return errorResponse(c, 400, 'validation_error', 'Missing required field: pages (non-empty array)')
  }

  if (body.pages.length > 50) {
    return errorResponse(c, 400, 'validation_error', 'Maximum 50 pages per batch.')
  }

  for (const p of body.pages) {
    if (typeof p.title !== 'string' || !p.title.trim()) {
      return errorResponse(c, 400, 'validation_error', 'Each page must have a non-empty title.')
    }
    if (p.type && !isValidPageType(p.type)) {
      return errorResponse(c, 400, 'validation_error', `Invalid page type: ${p.type}`)
    }
  }

  const newPages = body.pages.map((p: any) => ({
    title: p.title.trim(),
    type: p.type ?? 'concept',
    content: typeof p.content === 'string' ? p.content : '',
    parentTitle: typeof p.parent_title === 'string' ? p.parent_title : undefined,
    crossRefTitles: Array.isArray(p.cross_ref_titles) ? p.cross_ref_titles : undefined,
    metadata: p.metadata ?? {},
  }))

  const sourceId = typeof body.source_id === 'string' ? body.source_id : undefined

  const createdIds = await createPagesBatch({ wikiId, newPages, sourceId })

  if (sourceId) {
    await linkSourceToPages(sourceId, createdIds)
  }

  return c.json({ created_page_ids: createdIds, count: createdIds.length }, 201)
})

// Cross-ref management
pagesRouter.post('/cross-refs', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.from_page_id !== 'string' || typeof body.to_page_id !== 'string') {
    return errorResponse(c, 400, 'validation_error', 'Missing required fields: from_page_id, to_page_id')
  }

  const label = body.label ?? 'related'
  if (!isValidCrossRefLabel(label)) {
    return errorResponse(c, 400, 'validation_error', 'Invalid label. Must be: related, contradicts, supports, extends')
  }

  const db = getDb()

  // Verify both pages belong to this wiki
  const fromPage = await db.select({ id: pages.id }).from(pages)
    .where(and(eq(pages.id, body.from_page_id), eq(pages.wikiId, wikiId)))
  const toPage = await db.select({ id: pages.id }).from(pages)
    .where(and(eq(pages.id, body.to_page_id), eq(pages.wikiId, wikiId)))

  if (!fromPage.length) return errorResponse(c, 404, 'not_found', 'from_page_id not found in this wiki.')
  if (!toPage.length) return errorResponse(c, 404, 'not_found', 'to_page_id not found in this wiki.')
  if (body.from_page_id === body.to_page_id) {
    return errorResponse(c, 400, 'validation_error', 'A page cannot reference itself.')
  }

  const id = generateCrossRefId()
  await db.insert(crossRefs).values({
    id,
    fromPageId: body.from_page_id,
    toPageId: body.to_page_id,
    label,
  }).onConflictDoNothing()

  return c.json({ id, from_page_id: body.from_page_id, to_page_id: body.to_page_id, label }, 201)
})

pagesRouter.delete('/cross-refs/:id', async (c) => {
  const wikiId = getWikiId(c)
  if (!wikiId) return errorResponse(c, 404, 'not_found', 'No wiki associated with this API key.')

  const db = getDb()
  // Join through pages to verify ownership
  const ref = await db.select().from(crossRefs).where(eq(crossRefs.id, c.req.param('id')))
  if (!ref.length) return errorResponse(c, 404, 'not_found', 'Cross-ref not found.')

  const ownerCheck = await db.select({ id: pages.id }).from(pages)
    .where(and(eq(pages.id, ref[0].fromPageId), eq(pages.wikiId, wikiId)))
  if (!ownerCheck.length) return errorResponse(c, 403, 'forbidden', 'Cross-ref does not belong to your wiki.')

  await db.delete(crossRefs).where(eq(crossRefs.id, c.req.param('id')))
  return c.body(null, 204)
})

export { pagesRouter }
