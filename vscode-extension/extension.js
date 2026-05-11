'use strict';

const vscode = require('vscode');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── HTTP helper (works without fetch for older Node in VS Code) ──────────────

function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      { ...parsed, method: options.method || 'GET', headers: options.headers || {} },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try { resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => JSON.parse(data) }); }
          catch (e) { resolve({ ok: false, status: res.statusCode, json: () => ({}) }); }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('contextcapsule');
  return {
    apiKey:    cfg.get('apiKey', ''),
    serverUrl: cfg.get('serverUrl', 'http://localhost:3000'),
    ollamaUrl: cfg.get('ollamaUrl', 'http://localhost:11434'),
  };
}

async function ensureApiKey() {
  const { apiKey } = getConfig();
  if (apiKey) return apiKey;

  const entered = await vscode.window.showInputBox({
    prompt: 'Enter your Context Capsule API key (ak_...)',
    password: true,
    ignoreFocusOut: true,
  });
  if (!entered) return null;

  await vscode.workspace.getConfiguration('contextcapsule').update(
    'apiKey', entered, vscode.ConfigurationTarget.Global
  );
  return entered;
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

async function pickOllamaModel(ollamaUrl) {
  try {
    const res = await Promise.race([
      httpRequest(`${ollamaUrl}/api/tags`),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
    ]);
    if (!res.ok) return null;
    const data = res.json();
    const models = (data.models || []).map(m => m.name);
    const preferred = ['llama3.2', 'llama3', 'mistral', 'gemma', 'phi3', 'qwen'];
    for (const p of preferred) {
      const found = models.find(m => m.startsWith(p));
      if (found) return found;
    }
    return models[0] || null;
  } catch {
    return null;
  }
}

async function structureWithOllama(contextText, ollamaUrl) {
  const model = await pickOllamaModel(ollamaUrl);
  if (!model) throw new Error('Ollama not available');

  const prompt =
    `Analyze this coding context. Return ONLY valid JSON, no markdown:\n` +
    `{"summary":"one sentence what is happening","decisions":["decision1"],"next_steps":["step1"]}\n\n` +
    `Context:\n${contextText.slice(0, 3000)}`;

  const res = await httpRequest(
    `${ollamaUrl}/api/generate`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify({ model, prompt, stream: false })
  );

  if (!res.ok) throw new Error('Ollama request failed');
  const data = res.json();
  const match = data.response.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse Ollama response');
  return JSON.parse(match[0]);
}

// ─── Capsule API ──────────────────────────────────────────────────────────────

async function createCapsule(serverUrl, apiKey, body) {
  const res = await httpRequest(
    `${serverUrl}/v1/capsules`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
    JSON.stringify(body)
  );
  if (!res.ok) {
    const err = res.json();
    throw new Error(err.message || 'Failed to create capsule');
  }
  return res.json();
}

async function fetchCapsule(serverUrl, capsuleId) {
  const res = await httpRequest(`${serverUrl}/v1/capsules/${capsuleId}?format=json`);
  if (!res.ok) throw new Error('Capsule not found or expired');
  return res.json();
}

// ─── Context builders ─────────────────────────────────────────────────────────

function buildFileContext(editor, selectionOnly = false) {
  const doc = editor.document;
  const sel = editor.selection;
  const selectedText = doc.getText(sel);
  const content = selectionOnly && selectedText
    ? selectedText
    : doc.getText().slice(0, 4000);

  const fileName = path.basename(doc.fileName);
  const relPath = vscode.workspace.asRelativePath(doc.fileName);
  const workspace = vscode.workspace.name || 'unknown';
  const lang = doc.languageId;
  const lineCount = doc.lineCount;
  const cursorLine = sel.active.line + 1;

  let context = `File: ${relPath}\nWorkspace: ${workspace}\nLanguage: ${lang}\nLines: ${lineCount}\nCursor: line ${cursorLine}\n\n`;

  if (selectionOnly && selectedText) {
    context += `Selected code:\n\`\`\`${lang}\n${selectedText}\n\`\`\``;
  } else {
    context += `\`\`\`${lang}\n${content}\n\`\`\``;
  }

  return { context, fileName, relPath, workspace, lang };
}

async function buildWorkspaceContext() {
  const workspace = vscode.workspace.name || 'unknown';
  const folders = vscode.workspace.workspaceFolders?.map(f => f.name) || [];

  // Collect recently open tabs
  const openFiles = vscode.window.tabGroups.all
    .flatMap(g => g.tabs)
    .map(t => t.label)
    .slice(0, 10);

  // Active file info
  const editor = vscode.window.activeTextEditor;
  const activeFile = editor ? vscode.workspace.asRelativePath(editor.document.fileName) : null;

  let context = `Workspace: ${workspace}\nFolders: ${folders.join(', ')}\n`;
  if (activeFile) context += `Active file: ${activeFile}\n`;
  if (openFiles.length > 0) context += `Open files: ${openFiles.join(', ')}\n`;

  // Try to get git status
  try {
    const gitExt = vscode.extensions.getExtension('vscode.git');
    if (gitExt?.isActive) {
      const git = gitExt.exports.getAPI(1);
      const repo = git.repositories[0];
      if (repo) {
        const branch = repo.state.HEAD?.name;
        const changes = repo.state.workingTreeChanges.length + repo.state.indexChanges.length;
        const lastCommit = repo.state.HEAD?.commit?.slice(0, 7);
        if (branch) context += `\nGit branch: ${branch}`;
        if (lastCommit) context += `\nLast commit: ${lastCommit}`;
        if (changes > 0) context += `\nUncommitted changes: ${changes} files`;
      }
    }
  } catch { /* git extension not available */ }

  return { context, workspace };
}

// ─── Save commands ────────────────────────────────────────────────────────────

async function runSave(contextText, label) {
  const apiKey = await ensureApiKey();
  if (!apiKey) return;

  const { serverUrl, ollamaUrl } = getConfig();

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Context Capsule', cancellable: false },
    async progress => {
      progress.report({ message: 'Structuring with Ollama…' });

      let capsuleBody;
      try {
        capsuleBody = await structureWithOllama(contextText, ollamaUrl);
      } catch (_) {
        capsuleBody = {
          summary: `${label} — coding context snapshot`,
          decisions: [],
          next_steps: ['Continue from this context'],
          payload: { source: 'vscode', label },
        };
      }

      progress.report({ message: 'Saving capsule…' });

      let capsule;
      try {
        capsule = await createCapsule(serverUrl, apiKey, capsuleBody);
      } catch (err) {
        vscode.window.showErrorMessage(`Context Capsule: ${err.message}`);
        return;
      }

      const action = await vscode.window.showInformationMessage(
        `Capsule saved: ${capsule.capsule_id}`,
        'Copy ID',
        'Copy for AI',
        'Open in Browser'
      );

      if (action === 'Copy ID') {
        await vscode.env.clipboard.writeText(capsule.capsule_id);
        vscode.window.showInformationMessage('Capsule ID copied!');
      } else if (action === 'Copy for AI') {
        await vscode.env.clipboard.writeText(formatCapsuleForAI(capsule));
        vscode.window.showInformationMessage('Context copied — paste into any AI');
      } else if (action === 'Open in Browser') {
        vscode.env.openExternal(vscode.Uri.parse(`${serverUrl}/capsule/${capsule.capsule_id}`));
      }
    }
  );
}

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

// ─── Extension activation ─────────────────────────────────────────────────────

let statusBarItem;

function activate(context) {
  // Status bar button
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(database) Capsule';
  statusBarItem.tooltip = 'Save context as a Context Capsule';
  statusBarItem.command = 'contextcapsule.saveWorkspace';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Command: save current file
  context.subscriptions.push(
    vscode.commands.registerCommand('contextcapsule.saveFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Context Capsule: No active editor');
        return;
      }
      const { context: ctx, relPath } = buildFileContext(editor, false);
      await runSave(ctx, relPath);
    })
  );

  // Command: save selection
  context.subscriptions.push(
    vscode.commands.registerCommand('contextcapsule.saveSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Context Capsule: No active editor');
        return;
      }
      if (editor.selection.isEmpty) {
        vscode.window.showWarningMessage('Context Capsule: No text selected');
        return;
      }
      const { context: ctx, relPath } = buildFileContext(editor, true);
      await runSave(ctx, `selection in ${relPath}`);
    })
  );

  // Command: save full workspace context
  context.subscriptions.push(
    vscode.commands.registerCommand('contextcapsule.saveWorkspace', async () => {
      const { context: ctx, workspace } = await buildWorkspaceContext();
      // Also append active file if open
      const editor = vscode.window.activeTextEditor;
      let fullCtx = ctx;
      if (editor) {
        const { context: fileCtx } = buildFileContext(editor, false);
        fullCtx += `\n\n--- Active File ---\n${fileCtx}`;
      }
      await runSave(fullCtx, `workspace: ${workspace}`);
    })
  );

  // Command: load capsule
  context.subscriptions.push(
    vscode.commands.registerCommand('contextcapsule.loadCapsule', async () => {
      const { serverUrl } = getConfig();

      const input = await vscode.window.showInputBox({
        prompt: 'Enter capsule ID or URL',
        placeHolder: 'cap_...',
        ignoreFocusOut: true,
      });
      if (!input) return;

      const capsuleId = input.startsWith('cap_') ? input : input.split('/').filter(Boolean).at(-1);

      let capsule;
      try {
        capsule = await fetchCapsule(serverUrl, capsuleId);
      } catch (err) {
        vscode.window.showErrorMessage(`Context Capsule: ${err.message}`);
        return;
      }

      const formatted = formatCapsuleForAI(capsule);

      const action = await vscode.window.showInformationMessage(
        `Capsule: ${capsule.summary.slice(0, 80)}`,
        'Copy for AI',
        'Insert at Cursor',
        'Open in Browser'
      );

      if (action === 'Copy for AI') {
        await vscode.env.clipboard.writeText(formatted);
        vscode.window.showInformationMessage('Context copied — paste into any AI');
      } else if (action === 'Insert at Cursor') {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit(eb => eb.insert(editor.selection.active, `\n/* ${formatted} */\n`));
        } else {
          await vscode.env.clipboard.writeText(formatted);
          vscode.window.showInformationMessage('No active editor — copied to clipboard instead');
        }
      } else if (action === 'Open in Browser') {
        vscode.env.openExternal(vscode.Uri.parse(`${serverUrl}/capsule/${capsuleId}`));
      }
    })
  );
}

function deactivate() {
  statusBarItem?.dispose();
}

module.exports = { activate, deactivate };
