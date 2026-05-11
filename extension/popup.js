'use strict';

const DEFAULTS = {
  serverUrl: 'http://localhost:3000',
  ollamaUrl: 'http://localhost:11434',
};

// ─── Functions injected into the page context via executeScript ───────────────

function extractConversationFromPage() {
  const url = window.location.href;
  const messages = [];

  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
    document.querySelectorAll('[data-message-author-role]').forEach(el => {
      const role = el.getAttribute('data-message-author-role');
      const content = (
        el.querySelector('.whitespace-pre-wrap') ||
        el.querySelector('[class*="prose"]') ||
        el.querySelector('.markdown')
      )?.textContent?.trim();
      if (content) messages.push({ role: role === 'user' ? 'user' : 'assistant', content: content.slice(0, 2000) });
    });
  } else if (url.includes('claude.ai')) {
    const turns = document.querySelectorAll('[data-testid="human-turn"], [data-testid="ai-turn"]');
    if (turns.length > 0) {
      turns.forEach(el => {
        const isUser = el.getAttribute('data-testid') === 'human-turn';
        messages.push({ role: isUser ? 'user' : 'assistant', content: el.textContent.trim().slice(0, 2000) });
      });
    } else {
      // fallback selectors
      document.querySelectorAll('.human-turn, .assistant-turn').forEach(el => {
        const isUser = el.classList.contains('human-turn');
        messages.push({ role: isUser ? 'user' : 'assistant', content: el.textContent.trim().slice(0, 2000) });
      });
    }
  } else if (url.includes('gemini.google.com')) {
    document.querySelectorAll('user-query, model-response').forEach(el => {
      const isUser = el.tagName.toLowerCase() === 'user-query';
      messages.push({ role: isUser ? 'user' : 'assistant', content: el.textContent.trim().slice(0, 2000) });
    });
  }

  return messages;
}

function injectContextToInput(text) {
  const url = window.location.href;
  let input = null;

  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
    input = document.querySelector('#prompt-textarea');
  } else if (url.includes('claude.ai')) {
    input = document.querySelector('.ProseMirror[contenteditable="true"]') ||
            document.querySelector('[contenteditable="true"]');
  } else if (url.includes('gemini.google.com')) {
    input = document.querySelector('.ql-editor[contenteditable]') ||
            document.querySelector('[contenteditable="true"]');
  }

  if (!input) return false;

  if (input.tagName === 'TEXTAREA') {
    const proto = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    proto.set.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  } else if (input.isContentEditable) {
    input.focus();
    const sel = window.getSelection();
    sel.selectAllChildren(input);
    sel.collapseToEnd();
    document.execCommand('selectAll');
    document.execCommand('insertText', false, text);
  }

  return true;
}

// ─── Ollama helpers ───────────────────────────────────────────────────────────

async function pickOllamaModel(ollamaUrl) {
  const res = await fetch(`${ollamaUrl}/api/tags`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const models = (data.models || []).map(m => m.name);
  if (models.length === 0) return null;

  const preferred = ['llama3.2', 'llama3', 'mistral', 'gemma', 'phi3', 'qwen'];
  for (const p of preferred) {
    const found = models.find(m => m.startsWith(p));
    if (found) return found;
  }
  return models[0];
}

async function structureWithOllama(messages, ollamaUrl) {
  const model = await pickOllamaModel(ollamaUrl);
  if (!model) throw new Error('Ollama not available');

  const conversationText = messages
    .slice(-20)
    .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`)
    .join('\n\n');

  const prompt =
    `Analyze this AI conversation. Return ONLY valid JSON with no markdown fences:\n` +
    `{"summary":"one sentence summary","decisions":["decision1"],"next_steps":["step1"]}\n\n` +
    `Conversation:\n${conversationText}`;

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error('Ollama generation failed');

  const data = await res.json();
  const match = data.response.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse Ollama response');
  return JSON.parse(match[0]);
}

// ─── Capsule API ──────────────────────────────────────────────────────────────

async function createCapsule(serverUrl, apiKey, body) {
  const res = await fetch(`${serverUrl}/v1/capsules`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Failed to create capsule');
  }
  return res.json();
}

async function fetchCapsule(serverUrl, capsuleId) {
  const res = await fetch(`${serverUrl}/v1/capsules/${capsuleId}?format=json`);
  if (!res.ok) throw new Error('Capsule not found or expired');
  return res.json();
}

// ─── Format capsule for pasting into an AI chat ───────────────────────────────

function formatCapsuleForAI(capsule) {
  let text = `[CONTEXT CAPSULE — ${capsule.capsule_id}]\n\nSUMMARY: ${capsule.summary}`;
  if (Array.isArray(capsule.decisions) && capsule.decisions.length > 0) {
    text += `\n\nDECISIONS MADE:\n${capsule.decisions.map(d => `• ${d}`).join('\n')}`;
  }
  if (Array.isArray(capsule.next_steps) && capsule.next_steps.length > 0) {
    text += `\n\nNEXT STEPS:\n${capsule.next_steps.map(s => `• ${s}`).join('\n')}`;
  }
  text += '\n\nPlease continue from this context.';
  return text;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function showStatus(msg, type = 'info') {
  const el = $('status-msg');
  el.textContent = msg;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
  if (type !== 'loading') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
}

function showResult(capsule) {
  $('capsule-id').textContent = capsule.capsule_id;
  $('capsule-summary-preview').textContent = capsule.summary;
  $('result').classList.remove('hidden');
  $('status-msg').classList.add('hidden');
  return capsule;
}

function getSiteName(url = '') {
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return 'ChatGPT';
  if (url.includes('claude.ai')) return 'Claude';
  if (url.includes('gemini.google.com')) return 'Gemini';
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let currentTab = null;
let currentCapsule = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const saved = await chrome.storage.local.get(['apiKey', 'serverUrl', 'ollamaUrl']);
  $('api-key').value    = saved.apiKey    || '';
  $('server-url').value = saved.serverUrl || DEFAULTS.serverUrl;
  $('ollama-url').value = saved.ollamaUrl || DEFAULTS.ollamaUrl;

  // Detect current tab
  [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const siteName = getSiteName(currentTab?.url);

  if (siteName) {
    $('site-badge').textContent = `${siteName} detected`;
    $('site-badge').classList.add('detected');
    $('extract-btn').disabled = false;
    $('extract-btn').textContent = `Extract from ${siteName} & Save`;
  } else {
    $('site-badge').textContent = 'Open ChatGPT, Claude, or Gemini to auto-extract';
  }

  // Toggle manual form
  $('manual-toggle').addEventListener('click', () => {
    $('manual-form').classList.toggle('hidden');
  });

  // Save settings
  $('save-settings-btn').addEventListener('click', async () => {
    await chrome.storage.local.set({
      apiKey:    $('api-key').value.trim(),
      serverUrl: $('server-url').value.trim(),
      ollamaUrl: $('ollama-url').value.trim(),
    });
    showStatus('Settings saved', 'success');
  });

  // ── Extract & save from page ──────────────────────────────────────────────
  $('extract-btn').addEventListener('click', async () => {
    const apiKey    = $('api-key').value.trim();
    const serverUrl = $('server-url').value.trim();
    const ollamaUrl = $('ollama-url').value.trim();

    if (!apiKey) {
      $('settings-panel').open = true;
      showStatus('Set your API key in Settings first', 'error');
      return;
    }

    showStatus('Extracting conversation…', 'loading');

    let messages;
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: extractConversationFromPage,
      });
      messages = result;
    } catch (err) {
      showStatus(`Could not read page: ${err.message}`, 'error');
      return;
    }

    if (!messages || messages.length === 0) {
      showStatus('No conversation found on this page', 'error');
      return;
    }

    showStatus(`Found ${messages.length} messages — structuring with Ollama…`, 'loading');

    let capsuleBody;
    try {
      capsuleBody = await structureWithOllama(messages, ollamaUrl);
    } catch (_) {
      // Fallback: use last exchange as context
      const lastUser = messages.filter(m => m.role === 'user').at(-1);
      const lastAI   = messages.filter(m => m.role === 'assistant').at(-1);
      capsuleBody = {
        summary:    lastUser?.content?.slice(0, 200) || 'Conversation context',
        decisions:  [],
        next_steps: [lastAI?.content?.slice(0, 200) || 'Continue conversation'],
        payload:    { message_count: messages.length, site: siteName },
      };
    }

    showStatus('Saving capsule…', 'loading');

    try {
      const capsule = await createCapsule(serverUrl, apiKey, capsuleBody);
      currentCapsule = capsule;
      showResult(capsule);
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error');
    }
  });

  // ── Save manual capsule ───────────────────────────────────────────────────
  $('save-manual-btn').addEventListener('click', async () => {
    const apiKey    = $('api-key').value.trim();
    const serverUrl = $('server-url').value.trim();
    const summary   = $('summary').value.trim();

    if (!apiKey) {
      $('settings-panel').open = true;
      showStatus('Set your API key in Settings first', 'error');
      return;
    }
    if (!summary) {
      showStatus('Summary is required', 'error');
      return;
    }

    const decisions  = $('decisions').value.split('\n').map(l => l.trim()).filter(Boolean);
    const next_steps = $('next-steps').value.split('\n').map(l => l.trim()).filter(Boolean);

    showStatus('Saving capsule…', 'loading');

    try {
      const capsule = await createCapsule(serverUrl, apiKey, { summary, decisions, next_steps });
      currentCapsule = capsule;
      showResult(capsule);
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error');
    }
  });

  // ── Copy capsule ID ───────────────────────────────────────────────────────
  $('copy-id-btn').addEventListener('click', async () => {
    if (!currentCapsule) return;
    await navigator.clipboard.writeText(currentCapsule.capsule_id);
    showStatus('Capsule ID copied!', 'success');
  });

  // ── Copy formatted context for pasting into any AI ────────────────────────
  $('copy-context-btn').addEventListener('click', async () => {
    if (!currentCapsule) return;
    await navigator.clipboard.writeText(formatCapsuleForAI(currentCapsule));
    showStatus('Context copied — paste into any AI chat', 'success');
  });

  // ── Load capsule and inject / copy ───────────────────────────────────────
  $('load-btn').addEventListener('click', async () => {
    const raw       = $('capsule-input').value.trim();
    const serverUrl = $('server-url').value.trim();

    if (!raw) {
      showStatus('Enter a capsule ID or URL', 'error');
      return;
    }

    // Accept full URL or bare ID
    const capsuleId = raw.startsWith('cap_') ? raw : raw.split('/').filter(Boolean).at(-1);

    showStatus('Loading capsule…', 'loading');

    let capsule;
    try {
      capsule = await fetchCapsule(serverUrl, capsuleId);
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error');
      return;
    }

    const contextText = formatCapsuleForAI(capsule);

    // Try to inject directly into the chat input
    if (siteName && currentTab) {
      try {
        const [{ result: injected }] = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: injectContextToInput,
          args: [contextText],
        });

        if (injected) {
          showStatus('Context injected into chat input!', 'success');
          return;
        }
      } catch (_) { /* fall through to clipboard */ }
    }

    // Fallback: clipboard
    await navigator.clipboard.writeText(contextText);
    showStatus('Copied to clipboard — paste into any AI', 'success');
  });
});
