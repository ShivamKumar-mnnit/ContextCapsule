export function getOpenApiSpec(): object {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Context Capsule API',
      description: 'Portable context for agent workflows. Create structured, compressed, ephemeral handoff packets.',
      version: '1.0.0',
      contact: { url: 'https://www.contextcapsule.ai' },
    },
    servers: [{ url: 'https://www.contextcapsule.ai', description: 'Production' }],
    paths: {
      '/v1/auth/signup': {
        post: {
          operationId: 'signup',
          summary: 'Get a free API key',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'API key created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      api_key: { type: 'string', description: 'API key with ak_ prefix' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '409': { $ref: '#/components/responses/EmailExists' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/v1/capsules': {
        post: {
          operationId: 'createCapsule',
          summary: 'Create a context capsule',
          tags: ['Capsules'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCapsuleRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Capsule created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateCapsuleResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '409': { $ref: '#/components/responses/IdempotencyConflict' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/v1/capsules/{id}': {
        get: {
          operationId: 'getCapsule',
          summary: 'Fetch a capsule by ID',
          tags: ['Capsules'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Capsule ID (cap_ prefix)',
            },
          ],
          responses: {
            '200': {
              description: 'Capsule found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Capsule' },
                },
              },
            },
            '404': { $ref: '#/components/responses/CapsuleNotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/capsule/{id}': {
        get: {
          operationId: 'getCapsuleShort',
          summary: 'Fetch a capsule by ID (short URL)',
          tags: ['Capsules'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Capsule ID (cap_ prefix)',
            },
          ],
          responses: {
            '200': {
              description: 'Capsule found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Capsule' },
                },
              },
            },
            '404': { $ref: '#/components/responses/CapsuleNotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/cron/cleanup': {
        post: {
          operationId: 'cronCleanup',
          summary: 'Cleanup expired capsules (hourly cron)',
          tags: ['Cron'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Cleanup completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      deleted: { type: 'integer', description: 'Number of expired capsules deleted' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/health': {
        get: {
          operationId: 'healthCheck',
          summary: 'Health check',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'API key with ak_ prefix',
        },
      },
      schemas: {
        Refs: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string' },
            agent_id: { type: 'string' },
            session_id: { type: 'string' },
            parent_capsule_id: { type: 'string' },
            receipt_ids: { type: 'array', items: { type: 'string' } },
          },
        },
        CreateCapsuleRequest: {
          type: 'object',
          required: ['summary'],
          properties: {
            summary: { type: 'string', maxLength: 500, description: 'Brief summary of the context' },
            decisions: { type: 'array', items: { type: 'string' }, description: 'Key decisions made' },
            next_steps: { type: 'array', items: { type: 'string' }, description: 'Recommended next steps' },
            payload: { type: 'object', description: 'Arbitrary JSON payload (max 32KB)' },
            refs: { $ref: '#/components/schemas/Refs' },
            expires_in: {
              type: 'integer',
              minimum: 60,
              maximum: 604800,
              default: 86400,
              description: 'TTL in seconds',
            },
            idempotency_key: { type: 'string', description: 'Client deduplication key' },
            audience: { type: 'string', description: 'Intended consumer hint' },
          },
        },
        CreateCapsuleResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Capsule ID with cap_ prefix' },
            short_url: { type: 'string', format: 'uri' },
            expires_at: { type: 'string', format: 'date-time' },
            request_id: { type: 'string' },
          },
        },
        Capsule: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            summary: { type: 'string' },
            decisions: { type: 'array', items: { type: 'string' } },
            next_steps: { type: 'array', items: { type: 'string' } },
            payload: { type: 'object' },
            refs: { $ref: '#/components/schemas/Refs' },
            audience: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            expires_at: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            request_id: { type: 'string' },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'validation_error', message: 'Summary is required.', request_id: 'req_...' },
            },
          },
        },
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'unauthorized', message: 'Missing or invalid API key.', request_id: 'req_...' },
            },
          },
        },
        CapsuleNotFound: {
          description: 'Capsule not found or expired',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'capsule_not_found', message: 'Capsule not found or expired.', request_id: 'req_...' },
            },
          },
        },
        IdempotencyConflict: {
          description: 'Idempotency key conflict',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'idempotency_conflict', message: 'Idempotency key used with different body.', request_id: 'req_...' },
            },
          },
        },
        EmailExists: {
          description: 'Email already registered',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'email_exists', message: 'An account with this email already exists.', request_id: 'req_...' },
            },
          },
        },
        RateLimited: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error: 'rate_limited', message: 'Too many requests. Try again later.', request_id: 'req_...' },
            },
          },
        },
      },
    },
  }
}
