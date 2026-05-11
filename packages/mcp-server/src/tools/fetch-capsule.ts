import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { ContextCapsuleClient } from '../client.js'

export function registerFetchCapsuleTool(
  server: McpServer,
  client: ContextCapsuleClient,
) {
  server.tool(
    'fetch_capsule',
    'Fetch a Context Capsule to resume work from where another agent left off. ' +
      'Returns the full capsule data: summary, decisions, next_steps, payload, and refs. ' +
      'Use this to pick up execution context from a previous session or agent. ' +
      'No API key required.',
    {
      capsule_id: z
        .string()
        .describe('The capsule ID to fetch (starts with cap_)'),
    },
    async ({ capsule_id }) => {
      const result = await client.fetchCapsule(capsule_id)
      if (!result.ok) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error (${result.status}): ${result.message}` }],
        }
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }],
      }
    },
  )
}
