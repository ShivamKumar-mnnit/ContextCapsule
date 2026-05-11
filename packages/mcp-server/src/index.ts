import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ContextCapsuleClient } from './client.js'
import { resolveConfig } from './config.js'
import { registerCreateCapsuleTool } from './tools/create-capsule.js'
import { registerFetchCapsuleTool } from './tools/fetch-capsule.js'
import { registerSignupTool } from './tools/signup.js'

export function createServer(options?: { apiKey?: string; baseUrl?: string }) {
  const config = resolveConfig(options)
  const client = new ContextCapsuleClient(config.baseUrl, config.apiKey)

  const server = new McpServer({
    name: 'contextcapsule',
    version: '0.1.0',
  })

  registerCreateCapsuleTool(server, client)
  registerFetchCapsuleTool(server, client)
  registerSignupTool(server, client)

  return server
}

// When run directly — start stdio transport
const server = createServer()
const transport = new StdioServerTransport()
await server.connect(transport)
