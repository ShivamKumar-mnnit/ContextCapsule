# Context Capsule — Browser Extension

Save any AI conversation as a portable capsule. Resume it in any other AI.

## Load in Chrome / Edge

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select this `extension/` folder
5. Pin the extension to your toolbar

## Setup

1. Click the extension icon
2. Open **Settings**
3. Paste your API key: `ak_84a02c713e0a29a813b5a6db30910bb03171ffae0c7a9f8903b761bcf9fadbb6`
4. Server URL: `http://localhost:3000` (default)
5. Ollama URL: `http://localhost:11434` (optional — enables auto-summary)

## Workflow

**Save context from a conversation:**
1. Open a conversation on ChatGPT / Claude / Gemini
2. Click the extension icon
3. Click **Extract from [Site] & Save**
4. If Ollama is running, it auto-generates summary + decisions + next steps
5. Copy the capsule ID or click **Copy for AI**

**Resume in another AI:**
1. Open a new chat in any AI
2. Click the extension icon → paste a capsule ID → **Load**
3. The context is injected into the chat input automatically
   (or copied to clipboard as a fallback)

**Manual entry:**
- Click "Fill in manually instead" to write your own summary, decisions, and next steps

## Supported sites

- ChatGPT (`chat.openai.com`, `chatgpt.com`)
- Claude (`claude.ai`)
- Gemini (`gemini.google.com`)
