# Context Capsule — VS Code / Cursor Extension

Save your coding context as a portable capsule. Resume in any AI.

Works in **VS Code**, **Cursor**, and any VS Code fork.

## Load in VS Code / Cursor

**Method A — Developer mode (no install needed):**
1. Open VS Code / Cursor
2. `File → Open Folder` → select the `vscode-extension/` folder
3. Press `F5` → "Run Extension" → opens a new Extension Development window
4. The extension is active in that window

**Method B — Copy to extensions folder (permanent):**
1. Copy the `vscode-extension/` folder to:
   - Windows: `%USERPROFILE%\.vscode\extensions\context-capsule-1.0.0\`
   - Mac/Linux: `~/.vscode/extensions/context-capsule-1.0.0/`
   - Cursor on Windows: `%USERPROFILE%\.cursor\extensions\context-capsule-1.0.0\`
2. Restart VS Code / Cursor

## Setup

Open Settings (`Ctrl+,`) → search "Context Capsule":
- **API Key:** `ak_84a02c713e0a29a813b5a6db30910bb03171ffae0c7a9f8903b761bcf9fadbb6`
- **Server URL:** `http://localhost:3000`
- **Ollama URL:** `http://localhost:11434` (optional)

Or the extension will prompt for your API key on first use.

## Commands (Command Palette — Ctrl+Shift+P)

| Command | What it does |
|---------|-------------|
| `Context Capsule: Save Current File as Capsule` | Captures current file + metadata |
| `Context Capsule: Save Selection as Capsule` | Captures highlighted code only |
| `Context Capsule: Save Workspace Context as Capsule` | Captures workspace + git state + active file |
| `Context Capsule: Load Capsule` | Load a capsule by ID and inject/copy context |

## Other entry points

- **Right-click** any file/selection in the editor → Context Capsule options
- **Status bar** `$(database) Capsule` button (bottom-right) → saves workspace context

## What gets captured

- File name, relative path, language, line count, cursor position
- File content or selected code (up to 4000 chars)
- Workspace name, open tabs
- Git branch, last commit, uncommitted change count (if git extension active)
- Ollama auto-generates: summary, decisions, next steps

## IntelliJ / JetBrains

Not yet supported as a native plugin. Workaround: use the browser extension
on any AI chat, or copy context manually and create a capsule via the API.
