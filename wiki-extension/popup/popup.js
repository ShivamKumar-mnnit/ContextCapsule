'use strict'

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_WIKI_URL    = 'http://localhost:3001'
const DEFAULT_CAPSULE_URL = 'https://www.contextcapsule.ai'

let cfg = {
  wikiUrl:    DEFAULT_WIKI_URL,
  wikiKey:    '',
  capsuleUrl: DEFAULT_CAPSULE_URL,
  capsuleKey: '',
}

// Pages state
let allPages      = []
let filtered      = []
let pageOffset    = 0
const PAGE_SIZE   = 25
let selectionMode = false
let selectedIds   = new Set()

// Currently fetched capsule (for copy buttons)
let fetchedCapsule = null

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  cfg = await loadCfg()

  g('btn-settings').addEventListener('click',     () => chrome.runtime.openOptionsPage())
  g('btn-open-options').addEventListener('click', () => chrome.runtime.openOptionsPage())
  g('btn-back').addEventListener('click',         () => g('page-detail').classList.add('hidden'))

  if (!cfg.wikiKey && !cfg.capsuleKey) {
    show('screen-setup')
    return
  }

  show('screen-app')
  pingBoth()
  initTabs()
  initClip()
  initPages()
  initCreate()
  initFetch()
})

// ── Config ────────────────────────────────────────────────────────────────────

function loadCfg() {
  return new Promise(resolve =>
    chrome.storage.sync.get(['wikiUrl', 'wikiKey', 'capsuleUrl', 'capsuleKey'], d => resolve({
      wikiUrl:    d.wikiUrl    || DEFAULT_WIKI_URL,
      wikiKey:    d.wikiKey    || '',
      capsuleUrl: d.capsuleUrl || DEFAULT_CAPSULE_URL,
      capsuleKey: d.capsuleKey || '',
    }))
  )
}

// ── Ping both servers ─────────────────────────────────────────────────────────

async function pingBoth() {
  ping('wiki',    cfg.wikiUrl    + '/health',  'dot-wiki', 'lbl-wiki')
  ping('capsule', cfg.capsuleUrl + '/health',  'dot-cap',  'lbl-cap')
}

async function ping(name, url, dotId, lblId) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    g(dotId).className = res.ok ? 'dot on' : 'dot off'
    g(lblId).textContent = name
  } catch {
    g(dotId).className = 'dot off'
    g(lblId).textContent = name
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      document.querySelectorAll('.pane').forEach(p => p.classList.add('hidden'))
      btn.classList.add('active')
      const name = btn.dataset.tab
      g(`tab-${name}`).classList.remove('hidden')
      if (name === 'pages') loadPages()
    })
  })
}

// ── CLIP TAB ──────────────────────────────────────────────────────────────────

function initClip() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.title) g('clip-title').value = tab.title
  })

  g('clip-content').addEventListener('input', () => {
    g('clip-chars').textContent = g('clip-content').value.length.toLocaleString() + ' chars'
  })

  g('btn-grab').addEventListener('click', grabText)
  g('btn-add').addEventListener('click',  addToWiki)
}

async function grabText() {
  const btn = g('btn-grab')
  btn.textContent = '⟳ Grabbing…'
  btn.disabled = true

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab || /^(chrome|edge|about|file):\/\//.test(tab.url || '')) {
      toast('clip-toast', 'err', 'Cannot extract text from this page type.')
      return
    }

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractContent,
    })

    const { title, text } = result.result || {}
    if (title && !g('clip-title').value) g('clip-title').value = title
    if (text) {
      g('clip-content').value = text
      g('clip-chars').textContent = text.length.toLocaleString() + ' chars'
    } else {
      toast('clip-toast', 'err', 'No readable content found on this page.')
    }
  } catch (err) {
    toast('clip-toast', 'err', 'Extraction failed: ' + err.message)
  } finally {
    btn.textContent = '⚡ Grab text'
    btn.disabled = false
  }
}

async function addToWiki() {
  const title   = g('clip-title').value.trim()
  const content = g('clip-content').value.trim()
  const type    = g('clip-type').value

  if (!title)   { toast('clip-toast', 'err', 'Title is required.');           return }
  if (!content) { toast('clip-toast', 'err', 'Content is empty. Grab or paste text first.'); return }
  if (!cfg.wikiKey) { toast('clip-toast', 'err', 'Wiki API key not set. Open Settings.'); return }

  const btn = g('btn-add')
  setBtn(btn, 'Adding…', true)
  clearToast('clip-toast')

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    const srcRes = await wikiApi('POST', '/v1/wiki/sources', {
      title, content, type: 'url', url: tab?.url,
    })
    if (!srcRes.ok) throw new Error(srcRes.message)

    const batchRes = await wikiApi('POST', '/v1/wiki/pages/batch', {
      source_id: srcRes.data.source_id,
      pages: [{ title, type, content }],
    })
    if (!batchRes.ok) throw new Error(batchRes.message)

    const n = batchRes.data.count
    toast('clip-toast', 'ok', `✓ Added — ${n} page${n !== 1 ? 's' : ''} saved to wiki`)

    g('clip-content').value = ''
    g('clip-chars').textContent = '0 chars'
    g('clip-title').value = ''
    chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
      if (t?.title) g('clip-title').value = t.title
    })
  } catch (err) {
    toast('clip-toast', 'err', err.message)
  } finally {
    setBtn(btn, 'Add to Wiki', false)
  }
}

// ── PAGES TAB ─────────────────────────────────────────────────────────────────

function initPages() {
  // Export panel toggle
  g('export-toggle').addEventListener('click', () => {
    const panel = g('export-panel')
    const open  = !panel.classList.contains('hidden')
    panel.classList.toggle('hidden', open)
    g('export-icon').textContent = open ? '▼' : '▲'
  })

  g('btn-export').addEventListener('click', exportWiki)
  g('btn-copy-exp').addEventListener('click',    () => copyText(g('exp-output').value,          'btn-copy-exp'))
  g('btn-copy-exp-id').addEventListener('click', () => copyText(g('exp-cap-id').textContent,    'btn-copy-exp-id'))
  g('btn-exp-copy-url').addEventListener('click',() => copyText(
    `${cfg.capsuleUrl}/capsule/${g('exp-cap-id').textContent}`, 'btn-exp-copy-url'
  ))
  g('btn-exp-open-fetch').addEventListener('click', () => {
    const capId = g('exp-cap-id').textContent
    if (!capId) return
    // Switch to Fetch tab and auto-load
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.pane').forEach(p => p.classList.add('hidden'))
    document.querySelector('[data-tab="fetch"]').classList.add('active')
    g('tab-fetch').classList.remove('hidden')
    g('fetch-id').value = capId
    fetchCapsule()
  })

  // Selection
  g('btn-sel-toggle').addEventListener('click', toggleSelectMode)
  g('btn-sel-all').addEventListener('click', selectAll)
  g('btn-sel-clear').addEventListener('click', clearSelection)
}

function toggleSelectMode() {
  selectionMode = !selectionMode
  const btn = g('btn-sel-toggle')
  btn.textContent = selectionMode ? '✕ Cancel' : '☑ Select'
  g('btn-sel-all').classList.toggle('hidden', !selectionMode)
  g('btn-sel-clear').classList.toggle('hidden', !selectionMode)
  if (!selectionMode) { selectedIds.clear(); g('sel-count').classList.add('hidden') }
  renderPages()
  updateExportBtn()
}

function selectAll() {
  filtered.slice(0, pageOffset + PAGE_SIZE).forEach(p => selectedIds.add(p.id))
  renderPages()
  updateSelCount()
  updateExportBtn()
}

function clearSelection() {
  selectedIds.clear()
  renderPages()
  updateSelCount()
  updateExportBtn()
}

function updateSelCount() {
  const n  = selectedIds.size
  const el = g('sel-count')
  if (selectionMode && n > 0) { el.textContent = `${n} selected`; el.classList.remove('hidden') }
  else el.classList.add('hidden')
}

function updateExportBtn() {
  g('btn-export').textContent =
    selectionMode && selectedIds.size > 0 ? `Export ${selectedIds.size} selected` : 'Generate'
}

async function loadPages(reset = true) {
  if (reset) {
    pageOffset = 0; allPages = []; filtered = []
    g('pages-list').innerHTML  = ''
    g('pages-list').classList.add('hidden')
    g('pages-empty').classList.add('hidden')
    g('pages-loading').classList.remove('hidden')
    g('btn-more').classList.add('hidden')
  }

  const res = await wikiApi('GET', '/v1/wiki/pages')
  g('pages-loading').classList.add('hidden')
  if (!res.ok) return

  allPages = res.data.pages || []
  filtered = [...allPages]

  const search = g('pages-search')
  search.oninput = () => {
    const q = search.value.toLowerCase()
    filtered   = q ? allPages.filter(p => p.title.toLowerCase().includes(q) || p.type.includes(q)) : [...allPages]
    pageOffset = 0
    renderPages()
  }

  renderPages()
}

function renderPages() {
  const list = g('pages-list')
  list.innerHTML = ''

  if (!filtered.length) {
    g('pages-empty').classList.remove('hidden')
    list.classList.add('hidden')
    g('btn-more').classList.add('hidden')
    return
  }

  g('pages-empty').classList.add('hidden')
  list.classList.remove('hidden')

  for (const page of filtered.slice(0, pageOffset + PAGE_SIZE)) {
    const el = document.createElement('div')
    el.className = 'page-item'

    // Checkbox (selection mode only)
    if (selectionMode) {
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.className = 'page-check'
      cb.checked = selectedIds.has(page.id)
      cb.addEventListener('change', () => {
        if (cb.checked) selectedIds.add(page.id)
        else selectedIds.delete(page.id)
        updateSelCount()
        updateExportBtn()
      })
      // Stop click from bubbling so checkbox handles its own toggle
      cb.addEventListener('click', e => e.stopPropagation())
      el.appendChild(cb)
    }

    // Page body
    const body = document.createElement('div')
    body.className = 'page-item-body'
    body.innerHTML =
      `<div class="page-title">${esc(page.title)}</div>` +
      `<div class="page-meta">` +
        `<span class="badge ${badgeCls(page.type)}">${esc(page.type)}</span>` +
        `<span class="page-date">${reltime(page.updatedAt || page.createdAt)}</span>` +
      `</div>`

    if (selectionMode) {
      // In selection mode clicking the row toggles the checkbox
      body.addEventListener('click', () => {
        if (selectedIds.has(page.id)) selectedIds.delete(page.id)
        else selectedIds.add(page.id)
        updateSelCount()
        updateExportBtn()
        renderPages()
      })
    } else {
      body.addEventListener('click', () => openPageDetail(page))
    }

    el.appendChild(body)
    list.appendChild(el)
  }

  const hasMore = filtered.length > pageOffset + PAGE_SIZE
  g('btn-more').classList.toggle('hidden', !hasMore)
  g('btn-more').onclick = () => { pageOffset += PAGE_SIZE; renderPages() }
}

async function openPageDetail(page) {
  const res  = await wikiApi('GET', `/v1/wiki/pages/${page.id}`)
  const full = res.ok ? res.data.page : page

  const badge = g('detail-badge')
  badge.className   = `badge ${badgeCls(full.type)}`
  badge.textContent = full.type
  g('detail-title').textContent = full.title
  g('detail-body').textContent  = full.content || '(empty)'
  g('page-detail').classList.remove('hidden')
}

async function exportWiki() {
  const btn   = g('btn-export')
  const label = g('exp-label').value.trim()
  setBtn(btn, 'Generating…', true)
  g('exp-result').classList.add('hidden')
  g('exp-cap-section').classList.add('hidden')
  clearToast('export-toast')

  // Step 1: get wiki context text from capsule-server
  const wikiRes = await wikiApi('POST', '/v1/wiki/capsule', {
    label:     label || undefined,
    max_chars: parseInt(g('exp-max').value, 10) || 32_000,
    page_ids:  selectionMode && selectedIds.size > 0 ? [...selectedIds] : undefined,
  })

  if (!wikiRes.ok) {
    setBtn(btn, 'Generate & Create Capsule', false)
    toast('export-toast', 'err', wikiRes.message || 'Failed to generate context')
    return
  }

  const { capsule_text, page_count, char_count, truncated, wiki_title } = wikiRes.data
  g('exp-output').value = capsule_text
  g('exp-meta').textContent =
    `${page_count} pages · ${char_count.toLocaleString()} chars${truncated ? ' · truncated' : ''}`
  g('exp-result').classList.remove('hidden')

  // Step 2: create a real capsule on contextcapsule.ai so it gets a shareable ID
  if (cfg.capsuleKey) {
    setBtn(btn, 'Creating capsule…', true)
    const summary = label
      ? `${label} — ${wiki_title} (${page_count} pages)`
      : `${wiki_title} — wiki context export (${page_count} pages)`

    const capRes = await capsuleApi('POST', '/v1/capsules', {
      summary,
      audience:   'human',
      expires_in: 604800, // 7 days
      payload: {
        wiki_title,
        page_count,
        truncated,
        context: capsule_text,
      },
    })

    if (capRes.ok) {
      const capId = capRes.data.id || capRes.data.capsule_id || ''
      g('exp-cap-id').textContent = capId
      g('exp-cap-section').classList.remove('hidden')
    } else {
      toast('export-toast', 'info', `Context copied — capsule creation failed: ${capRes.message}`)
    }
  }

  setBtn(btn, 'Generate & Create Capsule', false)
}

// ── CREATE CAPSULE TAB ────────────────────────────────────────────────────────

function initCreate() {
  // Advanced panel toggle
  g('adv-toggle').addEventListener('click', () => {
    const open = !g('adv-panel').classList.contains('hidden')
    g('adv-panel').classList.toggle('hidden', open)
    g('adv-toggle').textContent = open ? '▶ Advanced' : '▼ Advanced'
  })

  g('btn-create').addEventListener('click', createCapsule)

  g('btn-copy-id').addEventListener('click',  () => copyText(g('cr-id').textContent,   'btn-copy-id'))
  g('btn-copy-url').addEventListener('click', () => copyText(g('cr-url').textContent,  'btn-copy-url'))
  g('btn-open-cap').addEventListener('click', () => {
    const url = g('cr-url').getAttribute('href')
    if (url) chrome.tabs.create({ url })
  })
}

async function createCapsule() {
  const summary = g('cr-summary').value.trim()
  if (!summary) { toast('create-toast', 'err', 'Summary is required.'); return }
  if (!cfg.capsuleKey) { toast('create-toast', 'err', 'Capsule API key not set. Open Settings.'); return }

  const btn = g('btn-create')
  setBtn(btn, 'Creating…', true)
  clearToast('create-toast')
  g('cr-result').classList.add('hidden')

  // Parse line-delimited arrays
  const decisions  = lines(g('cr-decisions').value)
  const next_steps = lines(g('cr-nextsteps').value)
  const expires_in = parseInt(g('cr-expires').value, 10) * 3600 // hours → seconds
  const audience   = g('cr-audience').value
  const idem       = g('cr-idem').value.trim() || undefined

  // Parse payload JSON if provided
  let payload
  const rawPayload = g('cr-payload').value.trim()
  if (rawPayload) {
    try { payload = JSON.parse(rawPayload) }
    catch { toast('create-toast', 'err', 'Payload is not valid JSON.'); setBtn(btn, 'Create Capsule', false); return }
  }

  const body = { summary, audience, expires_in }
  if (decisions.length)  body.decisions   = decisions
  if (next_steps.length) body.next_steps  = next_steps
  if (payload)           body.payload     = payload
  if (idem)              body.idempotency_key = idem

  const res = await capsuleApi('POST', '/v1/capsules', body)
  setBtn(btn, 'Create Capsule', false)

  if (!res.ok) {
    toast('create-toast', 'err', res.message || 'Failed to create capsule')
    return
  }

  const cap = res.data
  const capId  = cap.id || cap.capsule_id || ''
  const capUrl = `${cfg.capsuleUrl}/capsule/${capId}`

  g('cr-id').textContent = capId
  g('cr-url').textContent   = capUrl
  g('cr-url').setAttribute('href', capUrl)
  g('cr-result').classList.remove('hidden')

  toast('create-toast', 'ok', '✓ Capsule created')
}

// ── FETCH CAPSULE TAB ─────────────────────────────────────────────────────────

function initFetch() {
  g('btn-fetch').addEventListener('click', fetchCapsule)
  g('fetch-id').addEventListener('keydown', e => { if (e.key === 'Enter') fetchCapsule() })

  g('btn-f-copy-id').addEventListener('click',         () => fetchedCapsule && copyText(fetchedCapsule.id, 'btn-f-copy-id'))
  g('btn-f-copy-id-inline').addEventListener('click',  () => fetchedCapsule && copyText(fetchedCapsule.id, 'btn-f-copy-id-inline'))
  g('btn-f-copy-url').addEventListener('click', () => fetchedCapsule && copyText(`${cfg.capsuleUrl}/capsule/${fetchedCapsule.id}`, 'btn-f-copy-url'))
  g('btn-f-open').addEventListener('click', () => {
    if (fetchedCapsule) chrome.tabs.create({ url: `${cfg.capsuleUrl}/capsule/${fetchedCapsule.id}` })
  })
  g('btn-f-copy-context').addEventListener('click', () => copyText(g('f-context').value, 'btn-f-copy-context'))
  g('btn-f-inject').addEventListener('click', injectToLlm)
}

async function fetchCapsule() {
  const rawId = g('fetch-id').value.trim()
  if (!rawId) { toast('fetch-toast', 'err', 'Enter a capsule ID.'); return }

  // Accept full URL or bare ID
  const id = rawId.includes('/') ? rawId.split('/').pop() : rawId

  const btn = g('btn-fetch')
  setBtn(btn, '…', true)
  clearToast('fetch-toast')
  g('fetched-card').classList.add('hidden')
  g('fetch-spinner').classList.remove('hidden')

  const res = await capsuleApi('GET', `/v1/capsules/${encodeURIComponent(id)}?format=json`)
  g('fetch-spinner').classList.add('hidden')
  setBtn(btn, 'Fetch', false)

  if (!res.ok) {
    toast('fetch-toast', 'err', res.message || 'Capsule not found')
    return
  }

  const cap = res.data
  fetchedCapsule = cap

  // Capsule ID — shown prominently for sharing
  g('f-id').textContent = cap.id || cap.capsule_id || id

  // Summary
  g('f-summary').textContent = cap.summary || '—'

  // Decisions
  const decs = cap.decisions || []
  const decsSec = g('f-decisions-sec')
  if (decs.length) {
    g('f-decisions').innerHTML = decs.map(d => `<li>${esc(d)}</li>`).join('')
    decsSec.classList.remove('hidden')
  } else {
    decsSec.classList.add('hidden')
  }

  // Next steps
  const steps = cap.next_steps || []
  const stepsSec = g('f-nextsteps-sec')
  if (steps.length) {
    g('f-nextsteps').innerHTML = steps.map(s => `<li>${esc(s)}</li>`).join('')
    stepsSec.classList.remove('hidden')
  } else {
    stepsSec.classList.add('hidden')
  }

  // Expiry
  const expEl = g('f-expires')
  if (cap.expires_at) {
    const ms   = new Date(cap.expires_at).getTime() - Date.now()
    const days = ms / 86_400_000
    if (ms < 0) {
      expEl.innerHTML = `<span class="expiry-gone">Expired</span>`
    } else if (days < 1) {
      expEl.innerHTML = `<span class="expiry-soon">Expires in ${Math.round(ms / 3_600_000)}h</span>`
    } else {
      expEl.innerHTML = `<span class="expiry-ok">Expires in ${Math.round(days)}d</span>`
    }
  } else {
    expEl.textContent = '—'
  }

  // Wiki context from payload (set when capsule was created via wiki export)
  const context = cap.payload?.context || cap.payload?.wiki_context || ''
  const ctxSec  = g('f-context-sec')
  if (context) {
    g('f-context').value       = context
    g('f-context-meta').textContent =
      `${cap.payload?.wiki_title || ''} · ${context.length.toLocaleString()} chars`
    ctxSec.classList.remove('hidden')
  } else {
    ctxSec.classList.add('hidden')
  }

  g('fetched-card').classList.remove('hidden')
}

// ── API clients ───────────────────────────────────────────────────────────────

async function wikiApi(method, path, body) {
  return request(cfg.wikiUrl, cfg.wikiKey, method, path, body)
}

async function capsuleApi(method, path, body) {
  return request(cfg.capsuleUrl, cfg.capsuleKey, method, path, body)
}

async function request(baseUrl, apiKey, method, path, body) {
  try {
    const headers = { Accept: 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    if (body)   headers['Content-Type']  = 'application/json'

    const res  = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, message: data.message || `HTTP ${res.status}`, error: data.error }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: err.message || 'Network error', error: 'network_error' }
  }
}

// ── Inject context into LLM tab ───────────────────────────────────────────────

async function injectToLlm() {
  if (!fetchedCapsule) return

  const context = fetchedCapsule.payload?.context
    || fetchedCapsule.payload?.wiki_context
    || fetchedCapsule.summary
    || ''

  if (!context) {
    toast('fetch-toast', 'err', 'No context to inject.')
    return
  }

  const btn = g('btn-f-inject')
  setBtn(btn, 'Injecting…', true)

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab) throw new Error('No active tab found.')

    const url = tab.url || ''

    // Detect which LLM and pick the right selector
    const selector = llmInputSelector(url)
    if (!selector) {
      // Fallback: copy to clipboard and tell the user
      await navigator.clipboard.writeText(context)
      toast('fetch-toast', 'ok', '📋 Copied to clipboard — paste into your LLM (Ctrl+V)')
      return
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectText,
      args: [selector, context],
    })

    toast('fetch-toast', 'ok', '✓ Context loaded into LLM input')
  } catch (err) {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(context)
      toast('fetch-toast', 'info', '📋 Copied to clipboard — paste into your LLM (Ctrl+V)')
    } catch {
      toast('fetch-toast', 'err', err.message)
    }
  } finally {
    setBtn(btn, '⚡ Load to current LLM tab', false)
  }
}

function llmInputSelector(url) {
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com'))
    return '#prompt-textarea, [data-id="root"] [contenteditable="true"]'
  if (url.includes('claude.ai'))
    return '.ProseMirror[contenteditable="true"], [data-testid="composer-input"]'
  if (url.includes('gemini.google.com'))
    return '.ql-editor[contenteditable="true"], rich-textarea .ql-editor'
  if (url.includes('perplexity.ai'))
    return 'textarea[placeholder]'
  if (url.includes('mistral.ai') || url.includes('le-chat'))
    return 'textarea'
  // Generic fallback — try common patterns
  return 'textarea, [contenteditable="true"][role="textbox"], [contenteditable="true"].ProseMirror'
}

// Runs in page context — injects text into the LLM input
function injectText(selector, text) {
  const el = document.querySelector(selector)
  if (!el) return false

  el.focus()

  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    // Native input — use execCommand so React/Vue picks up the change
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, text)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      el.value = text
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  } else if (el.contentEditable === 'true') {
    // ContentEditable (Claude, Gemini, etc.)
    el.focus()
    document.execCommand('selectAll', false)
    document.execCommand('insertText', false, text)
    // Fallback if execCommand is disabled
    if (!el.textContent.includes(text.slice(0, 20))) {
      el.textContent = text
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }))
    }
  }

  return true
}

// ── Content extraction (injected into page) ───────────────────────────────────

function extractContent() {
  const SELECTORS = [
    'article', 'main', '[role="main"]',
    '.post-content', '.article-content', '.entry-content',
    '#content', '.content', '.prose',
  ]
  function clean(t) {
    return t.replace(/\n{3,}/g, '\n\n').replace(/ {3,}/g, ' ').trim().slice(0, 50_000)
  }
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel)
    if (el && el.innerText.trim().length > 300) {
      return { title: document.title, text: clean(el.innerText) }
    }
  }
  const blocks = Array.from(document.querySelectorAll('div, section'))
    .filter(el => el.innerText.trim().length > 300)
    .sort((a, b) => b.innerText.length - a.innerText.length)
  const src = blocks[0] || document.body
  return { title: document.title, text: clean(src.innerText) }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function g(id)      { return document.getElementById(id) }
function show(sid)  { g('screen-setup').classList.add('hidden'); g('screen-app').classList.add('hidden'); g(sid).classList.remove('hidden') }
function toast(id, type, msg) { const el = g(id); el.className = `toast toast-${type}`; el.textContent = msg; el.classList.remove('hidden') }
function clearToast(id)       { g(id).classList.add('hidden') }
function setBtn(btn, label, disabled) { btn.textContent = label; btn.disabled = disabled }

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function lines(str) {
  return str.split('\n').map(l => l.trim()).filter(Boolean)
}

function copyText(text, btnId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = g(btnId)
    const orig = btn.textContent
    btn.textContent = '✓ Copied'
    setTimeout(() => { btn.textContent = orig }, 2000)
  })
}

function badgeCls(type) {
  const m = { concept:'b-concept', entity:'b-entity', 'source-summary':'b-source-summary', synthesis:'b-synthesis', 'query-result':'b-query-result', overview:'b-overview' }
  return m[type] || 'b-concept'
}

function reltime(iso) {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso)) / 60_000)
  if (d < 1)  return 'just now'
  if (d < 60) return `${d}m ago`
  const h = Math.floor(d / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
