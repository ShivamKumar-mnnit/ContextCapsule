import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { ContextCapsuleClient } from '../client.js'

export function registerSignupTool(
  server: McpServer,
  client: ContextCapsuleClient,
) {
  server.tool(
    'signup',
    'Get a free Context Capsule API key. Returns the key directly — save it immediately, it cannot be retrieved later. ' +
      'Only needed once. After signup, configure the key as CONTEXTCAPSULE_API_KEY environment variable to use create_capsule. ' +
      'Free tier: 500 capsules per month.',
    {
      email: z.string().describe('Your email address'),
    },
    async ({ email }) => {
      const result = await client.signup(email)
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
