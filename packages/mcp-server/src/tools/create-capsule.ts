import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { ContextCapsuleClient } from '../client.js'

export function registerCreateCapsuleTool(
  server: McpServer,
  client: ContextCapsuleClient,
) {
  server.tool(
    'create_capsule',
    'Create a Context Capsule to hand off execution context between agents or sessions. ' +
      'Include a summary of what happened, key decisions made, and what should happen next. ' +
      'Capsules are structured, compressed, ephemeral context packets. ' +
      'Returns a capsule_id and capsule_url. Capsules expire after 7 days by default.',
    {
      summary: z
        .string()
        .max(500)
        .describe('Human-readable summary of the current context (max 500 chars)'),
      decisions: z
        .array(z.string().max(500))
        .max(20)
        .optional()
        .describe('Key decisions made (max 20 items, 500 chars each)'),
      next_steps: z
        .array(z.string().max(500))
        .max(20)
        .optional()
        .describe('What should happen next (max 20 items, 500 chars each)'),
      payload: z
        .record(z.unknown())
        .optional()
        .describe('Optional structured JSON data (max 32KB)'),
      refs: z
        .record(z.string())
        .optional()
        .describe('Optional workflow references (workflow_id, agent_id, session_id, etc.)'),
      expires_in: z
        .number()
        .min(60)
        .max(604800)
        .optional()
        .describe('TTL in seconds (60-604800, default 604800 = 7 days)'),
      idempotency_key: z
        .string()
        .optional()
        .describe('Prevents duplicate capsules if you retry the same request'),
      audience: z
        .literal('human')
        .optional()
        .describe('Set to "human" to enrich the view page with social cards'),
    },
    async (params) => {
      if (!client.hasApiKey()) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: 'No API key configured. Set the CONTEXTCAPSULE_API_KEY environment variable, or use the signup tool to get a free key.',
            },
          ],
        }
      }
      const result = await client.createCapsule(params)
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
