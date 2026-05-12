import { eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { pages, crossRefs, sources, opsLog, wikis } from '../db/schema.js'
import { generatePageId, generateSourceId, generateCrossRefId, generateLogId, slugify } from './ids.js'

export type PageInput = {
  title: string
  type: string
  content: string
  parentTitle?: string
  crossRefTitles?: string[]
  metadata?: Record<string, unknown>
}

export type PageRow = {
  id: string
  title: string
  type: string
  content: string
}

export async function getAllPages(wikiId: string): Promise<PageRow[]> {
  const db = getDb()
  return db
    .select({ id: pages.id, title: pages.title, type: pages.type, content: pages.content })
    .from(pages)
    .where(eq(pages.wikiId, wikiId))
}

export async function getWikiTitle(wikiId: string): Promise<string> {
  const db = getDb()
  const rows = await db.select({ title: wikis.title }).from(wikis).where(eq(wikis.id, wikiId))
  return rows[0]?.title ?? 'My Wiki'
}

export async function createPagesBatch(params: {
  wikiId: string
  newPages: PageInput[]
  sourceId?: string
}): Promise<string[]> {
  const db = getDb()
  const titleToId = new Map<string, string>()

  // Load existing pages for cross-ref resolution
  const existing = await db
    .select({ id: pages.id, title: pages.title })
    .from(pages)
    .where(eq(pages.wikiId, params.wikiId))
  for (const p of existing) titleToId.set(p.title.toLowerCase(), p.id)

  const createdIds: string[] = []

  // Pass 1: create all pages
  for (const np of params.newPages) {
    const id = generatePageId()
    const baseSlug = slugify(np.title)

    const conflict = await db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.wikiId, params.wikiId))
    const slugsInUse = new Set(conflict.map((r: any) => r.slug))
    const slug = slugsInUse.has(baseSlug) ? `${baseSlug}-${id.slice(-6)}` : baseSlug

    await db.insert(pages).values({
      id,
      wikiId: params.wikiId,
      title: np.title,
      slug,
      content: np.content,
      type: np.type,
      metadata: np.metadata ?? {},
    })

    titleToId.set(np.title.toLowerCase(), id)
    createdIds.push(id)
  }

  // Pass 2: set parent_id and cross-refs
  for (let i = 0; i < params.newPages.length; i++) {
    const np = params.newPages[i]
    const id = createdIds[i]

    if (np.parentTitle) {
      const parentId = titleToId.get(np.parentTitle.toLowerCase())
      if (parentId) {
        await db.update(pages).set({ parentId }).where(eq(pages.id, id))
      }
    }

    for (const refTitle of np.crossRefTitles ?? []) {
      const toId = titleToId.get(refTitle.toLowerCase())
      if (!toId || toId === id) continue
      await db.insert(crossRefs).values({
        id: generateCrossRefId(),
        fromPageId: id,
        toPageId: toId,
        label: 'related',
      }).onConflictDoNothing()
    }
  }

  await appendLog(params.wikiId, 'ingest', `Created ${createdIds.length} page(s)`, {
    sourceId: params.sourceId,
    pageIds: createdIds,
  })

  return createdIds
}

export async function storeSource(params: {
  wikiId: string
  title: string
  content: string
  type: string
  url?: string
}): Promise<string> {
  const db = getDb()
  const id = generateSourceId()
  await db.insert(sources).values({
    id,
    wikiId: params.wikiId,
    title: params.title,
    content: params.content,
    type: params.type,
    url: params.url,
    pageIds: [],
  })
  return id
}

export async function linkSourceToPages(sourceId: string, pageIds: string[]): Promise<void> {
  const db = getDb()
  await db.update(sources).set({ pageIds }).where(eq(sources.id, sourceId))
}

export async function getWikiIndex(wikiId: string) {
  const db = getDb()
  const allPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      type: pages.type,
      parentId: pages.parentId,
      slug: pages.slug,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(eq(pages.wikiId, wikiId))

  const byType: Record<string, typeof allPages> = {}
  for (const p of allPages) {
    if (!byType[p.type]) byType[p.type] = []
    byType[p.type].push(p)
  }

  return { total: allPages.length, byType, pages: allPages }
}

export async function buildCapsuleContext(params: {
  wikiId: string
  pageIds?: string[]
  maxChars?: number
}): Promise<{ text: string; pageCount: number; truncated: boolean }> {
  const db = getDb()
  let query = db.select().from(pages).where(eq(pages.wikiId, params.wikiId))
  const allPages = await query

  const selected = params.pageIds?.length
    ? allPages.filter((p) => params.pageIds!.includes(p.id))
    : allPages

  const maxChars = params.maxChars ?? 32_000
  const parts: string[] = []
  let total = 0
  let truncated = false

  for (const p of selected) {
    const block = `## ${p.title} [${p.type}]\n${p.content}`
    if (total + block.length > maxChars) {
      truncated = true
      break
    }
    parts.push(block)
    total += block.length
  }

  return { text: parts.join('\n\n---\n\n'), pageCount: parts.length, truncated }
}

async function appendLog(
  wikiId: string,
  type: string,
  summary: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  const db = getDb()
  await db.insert(opsLog).values({
    id: generateLogId(),
    wikiId,
    type,
    summary: `[${type}] ${summary}`,
    detail,
  })
}
