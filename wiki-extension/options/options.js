'use strict'

const DEFAULT_WIKI_URL    = 'http://localhost:3001'
const DEFAULT_CAPSULE_URL = 'https://www.contextcapsule.ai'

document.addEventListener('DOMContentLoaded', () => {
  // Load saved values
  chrome.storage.sync.get(['wikiUrl', 'wikiKey', 'capsuleUrl', 'capsuleKey'], d => {
    g('wiki-url').value = d.wikiUrl    || DEFAULT_WIKI_URL
    g('wiki-key').value = d.wikiKey    || ''
    g('cap-url').value  = d.capsuleUrl || DEFAULT_CAPSULE_URL
    g('cap-key').value  = d.capsuleKey || ''
  })

  g('btn-save-wiki').addEventListener('click', saveWiki)
  g('btn-test-wiki').addEventListener('click', testWiki)
  g('btn-save-cap').addEventListener('click',  saveCapsule)
  g('btn-test-cap').addEventListener('click',  testCapsule)
  g('btn-get-key').addEventListener('click',   getApiKey)
})

// ── Get API key by email ──────────────────────────────────────────────────────

async function getApiKey() {
  const email = g('cap-email').value.trim()
  const url   = g('cap-url').value.trim().replace(/\/$/, '') || DEFAULT_CAPSULE_URL

  if (!email) { toast('get-key-toast', 'err', 'Enter your email address.'); return }

  const btn = g('btn-get-key')
  setBtn(btn, '…', true)

  try {
    const res  = await fetch(`${url}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, source: 'web' }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Failed (${res.status})`)
    toast('get-key-toast', 'ok', `✓ API key sent to ${email} — check your inbox.`)
  } catch (err) {
    toast('get-key-toast', 'err', err.message)
  } finally {
    setBtn(btn, 'Send Key', false)
  }
}

// ── Wiki server ───────────────────────────────────────────────────────────────

async function saveWiki() {
  const url = g('wiki-url').value.trim().replace(/\/$/, '')
  const key = g('wiki-key').value.trim()

  if (!url) { toast('wiki-toast', 'err', 'Server URL is required.'); return }
  if (!key) { toast('wiki-toast', 'err', 'API key is required.');    return }
  if (!key.startsWith('ak_')) { toast('wiki-toast', 'err', 'API key must start with ak_'); return }

  chrome.storage.sync.set({ wikiUrl: url, wikiKey: key }, () => {
    toast('wiki-toast', 'ok', '✓ Wiki settings saved.')
  })
}

async function testWiki() {
  const url = g('wiki-url').value.trim().replace(/\/$/, '')
  const key = g('wiki-key').value.trim()
  if (!url || !key) { toast('wiki-toast', 'err', 'Fill in both fields.'); return }

  const btn = g('btn-test-wiki')
  setBtn(btn, '…', true)

  try {
    const health = await fetch(`${url}/health`).catch(() => null)
    if (!health?.ok) throw new Error(`Server unreachable at ${url}`)

    const res  = await fetch(`${url}/v1/wiki`, { headers: authHeaders(key) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Auth failed (${res.status})`)

    const w = data.wiki
    toast('wiki-toast', 'ok', `✓ Connected to "${w.title}" — ${w.page_count} pages`)
    showTable('wiki-table', 'wiki-info', [
      ['Wiki',    w.title         || '—'],
      ['ID',      w.id            || '—'],
      ['Pages',   w.page_count   ?? 0],
      ['Sources', w.source_count ?? 0],
      ['Created', fmtDate(w.createdAt)],
    ])
  } catch (err) {
    toast('wiki-toast', 'err', err.message)
    g('wiki-info').classList.add('hidden')
  } finally {
    setBtn(btn, 'Test', false)
  }
}

// ── Capsule server ────────────────────────────────────────────────────────────

async function saveCapsule() {
  const url = g('cap-url').value.trim().replace(/\/$/, '')
  const key = g('cap-key').value.trim()

  if (!url) { toast('cap-toast', 'err', 'Server URL is required.'); return }
  if (!key) { toast('cap-toast', 'err', 'API key is required.');    return }
  if (!key.startsWith('ak_')) { toast('cap-toast', 'err', 'API key must start with ak_'); return }

  chrome.storage.sync.set({ capsuleUrl: url, capsuleKey: key }, () => {
    toast('cap-toast', 'ok', '✓ Capsule settings saved.')
  })
}

async function testCapsule() {
  const url = g('cap-url').value.trim().replace(/\/$/, '')
  const key = g('cap-key').value.trim()
  if (!url || !key) { toast('cap-toast', 'err', 'Fill in both fields.'); return }

  const btn = g('btn-test-cap')
  setBtn(btn, '…', true)

  try {
    const health = await fetch(`${url}/health`).catch(() => null)
    if (!health?.ok) throw new Error(`Server unreachable at ${url}`)

    // Try creating a test capsule (dry-run: idempotency key prevents duplicates)
    const res  = await fetch(`${url}/v1/capsules`, {
      method: 'POST',
      headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: 'Wiki Clipper settings test',
        audience: 'human',
        expires_in: 60,
        idempotency_key: 'wiki-clipper-settings-test-v1',
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Auth failed (${res.status})`)

    const cap = data
    toast('cap-toast', 'ok', `✓ Connected — test capsule: ${cap.id || cap.capsule_id}`)
    showTable('cap-table', 'cap-info', [
      ['Status',  'Connected'],
      ['Capsule', cap.id || cap.capsule_id || '—'],
      ['Server',  url],
    ])
  } catch (err) {
    toast('cap-toast', 'err', err.message)
    g('cap-info').classList.add('hidden')
  } finally {
    setBtn(btn, 'Test', false)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function g(id) { return document.getElementById(id) }

function toast(id, type, msg) {
  const el = g(id)
  el.className = `toast toast-${type}`
  el.textContent = msg
  el.classList.remove('hidden')
}

function setBtn(btn, label, disabled) {
  btn.textContent = label
  btn.disabled    = disabled
}

function authHeaders(key) {
  return { Authorization: `Bearer ${key}`, Accept: 'application/json' }
}

function showTable(tableId, cardId, rows) {
  g(tableId).innerHTML = rows.map(([k, v]) =>
    `<div class="info-row">` +
      `<span class="info-key">${esc(k)}</span>` +
      `<span class="info-val" title="${esc(String(v))}">${esc(String(v))}</span>` +
    `</div>`
  ).join('')
  g(cardId).classList.remove('hidden')
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
