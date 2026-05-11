export interface CreateCapsuleInput {
  summary: string
  decisions?: string[]
  next_steps?: string[]
  payload?: Record<string, unknown>
  refs?: Record<string, string>
  expires_in?: number
  idempotency_key?: string
  audience?: string
}

export interface ValidationError {
  field: string
  message: string
}

export function isValidationError(value: unknown): value is ValidationError[] {
  return Array.isArray(value) && value.length > 0 && 'field' in value[0] && 'message' in value[0]
}

export function validateCreateCapsule(
  body: unknown
): CreateCapsuleInput | ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    return [{ field: 'body', message: 'Request body must be a JSON object' }]
  }

  const input = body as Record<string, unknown>

  // summary: required string, max 500 chars
  if (!input.summary || typeof input.summary !== 'string') {
    errors.push({ field: 'summary', message: 'summary is required and must be a string' })
  } else if (input.summary.length > 500) {
    errors.push({ field: 'summary', message: 'summary must be at most 500 characters' })
  }

  // decisions: optional string array, max 20 items, 500 chars each
  if (input.decisions !== undefined) {
    if (!Array.isArray(input.decisions)) {
      errors.push({ field: 'decisions', message: 'decisions must be an array of strings' })
    } else {
      if (input.decisions.length > 20) {
        errors.push({ field: 'decisions', message: 'decisions must have at most 20 items' })
      }
      for (let i = 0; i < input.decisions.length; i++) {
        if (typeof input.decisions[i] !== 'string') {
          errors.push({ field: `decisions[${i}]`, message: 'each decision must be a string' })
        } else if (input.decisions[i].length > 500) {
          errors.push({ field: `decisions[${i}]`, message: 'each decision must be at most 500 characters' })
        }
      }
    }
  }

  // next_steps: optional string array, max 20 items, 500 chars each
  if (input.next_steps !== undefined) {
    if (!Array.isArray(input.next_steps)) {
      errors.push({ field: 'next_steps', message: 'next_steps must be an array of strings' })
    } else {
      if (input.next_steps.length > 20) {
        errors.push({ field: 'next_steps', message: 'next_steps must have at most 20 items' })
      }
      for (let i = 0; i < input.next_steps.length; i++) {
        if (typeof input.next_steps[i] !== 'string') {
          errors.push({ field: `next_steps[${i}]`, message: 'each next_step must be a string' })
        } else if (input.next_steps[i].length > 500) {
          errors.push({ field: `next_steps[${i}]`, message: 'each next_step must be at most 500 characters' })
        }
      }
    }
  }

  // payload: optional JSON object, max 32KB
  if (input.payload !== undefined) {
    if (typeof input.payload !== 'object' || input.payload === null || Array.isArray(input.payload)) {
      errors.push({ field: 'payload', message: 'payload must be a JSON object' })
    } else {
      const payloadSize = new TextEncoder().encode(JSON.stringify(input.payload)).byteLength
      if (payloadSize > 32 * 1024) {
        errors.push({ field: 'payload', message: 'payload must be at most 32KB' })
      }
    }
  }

  // refs: optional object
  if (input.refs !== undefined) {
    if (typeof input.refs !== 'object' || input.refs === null || Array.isArray(input.refs)) {
      errors.push({ field: 'refs', message: 'refs must be a JSON object' })
    }
  }

  // expires_in: optional number, 60-604800
  if (input.expires_in !== undefined) {
    if (typeof input.expires_in !== 'number') {
      errors.push({ field: 'expires_in', message: 'expires_in must be a number' })
    } else if (input.expires_in < 60 || input.expires_in > 604800) {
      errors.push({ field: 'expires_in', message: 'expires_in must be between 60 and 604800 seconds' })
    }
  }

  // idempotency_key: optional string
  if (input.idempotency_key !== undefined) {
    if (typeof input.idempotency_key !== 'string') {
      errors.push({ field: 'idempotency_key', message: 'idempotency_key must be a string' })
    }
  }

  // audience: optional, must be "human" if provided
  if (input.audience !== undefined) {
    if (input.audience !== 'human') {
      errors.push({ field: 'audience', message: 'audience must be "human" if provided' })
    }
  }

  if (errors.length > 0) {
    return errors
  }

  return {
    summary: input.summary as string,
    decisions: input.decisions as string[] | undefined,
    next_steps: input.next_steps as string[] | undefined,
    payload: input.payload as Record<string, unknown> | undefined,
    refs: input.refs as Record<string, string> | undefined,
    expires_in: input.expires_in as number | undefined,
    idempotency_key: input.idempotency_key as string | undefined,
    audience: input.audience as string | undefined,
  }
}
