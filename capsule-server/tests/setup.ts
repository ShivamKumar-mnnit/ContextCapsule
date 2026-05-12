import { vi } from 'vitest'

// Stub DB and LLM calls so unit tests don't hit the network
vi.mock('../src/db/client.js', () => ({
  getDb: vi.fn(() => ({})),
}))

vi.mock('../src/lib/llm.js', () => ({
  ingestSource: vi.fn(),
  queryWiki: vi.fn(),
  lintWiki: vi.fn(),
}))
