# Chaining Patterns: ContextCapsule + ProofSlip

## The Pairing

| Product | Role | Question it answers |
|---------|------|-------------------|
| **ContextCapsule** | Navigational | "What's the situation and what should happen next?" |
| **ProofSlip** | Evidential | "What actually happened, and can you verify it?" |

One helps agents stay on course. One helps agents avoid false assumptions.

---

## Pattern 1: Prove-Then-Continue

An agent completes a step, creates a ProofSlip receipt as proof, then creates a ContextCapsule referencing that receipt for the next agent.

```
Agent A: does work
  -> POST proofslip.ai/v1/receipts  (rct_abc)
  -> POST contextcapsule.ai/v1/capsules
      refs.receipt_ids: ["rct_abc"]
      intent.goal: "Continue with step 2"

Agent B: receives capsule
  -> GET contextcapsule.ai/v1/capsules/cap_xyz
  -> GET proofslip.ai/v1/receipts/rct_abc  (verify step 1 happened)
  -> proceeds with step 2
```

**Why it matters:** Agent B doesn't trust Agent A's claim — it verifies via ProofSlip before continuing. The capsule carries the navigation; the receipt carries the proof.

---

## Pattern 2: Capsule Chain (Breadcrumbs)

Each step in a workflow creates a new capsule referencing the previous one. Each capsule is a snapshot of execution context at that moment.

```
Step 1: cap_001 (parent: null)
  memory: ["Customer requested refund"]
  state: { refund_requested: true }
  intent: { goal: "Get manager approval" }

Step 2: cap_002 (parent: cap_001)
  memory: ["Customer requested refund", "Manager approved"]
  state: { refund_approved: true, amount: 45 }
  intent: { goal: "Process refund" }

Step 3: cap_003 (parent: cap_002)
  memory: ["Refund processed for $45"]
  state: { refund_processed: true }
  intent: { goal: "Send confirmation email" }
```

**Why it matters:** Each capsule is self-contained — you don't need to fetch the chain. But the chain exists for auditability. Combine with ProofSlip: attach `receipt_ids` at each step to prove the transition happened.

---

## Pattern 3: Fork-and-Join

A workflow splits into parallel branches, each with its own capsule. A coordinator agent joins them.

```
Coordinator creates:
  cap_main -> intent: "Evaluate customer for premium upgrade"

Fork:
  Agent A gets cap_main -> creates cap_usage (usage analysis)
  Agent B gets cap_main -> creates cap_billing (billing check)

Join:
  Agent C fetches cap_usage + cap_billing
  -> creates cap_decision
      memory: key_facts from both branches
      state: merged state
      intent: { goal: "Make upgrade decision" }
      refs: { parent_capsule_id: cap_main }
```

---

## Pattern 4: Capsule + Receipt as Gate

Use a ProofSlip receipt as a gate condition. The capsule's intent says "do X", but only if a specific receipt exists and has the right status.

```json
{
  "intent": {
    "goal": "Deploy to production",
    "next_step": "run_deploy_script",
    "guardrails": [
      "GATE: verify rct_tests_pass exists with status 'success' before proceeding",
      "Do not deploy if any test receipt shows failure"
    ]
  },
  "refs": {
    "receipt_ids": ["rct_tests_pass"]
  }
}
```

**Why it matters:** Guardrails become verifiable, not just advisory. The agent can check the receipt to confirm the condition is met.

---

## Pattern 5: Human-in-the-Loop Handoff

Agent creates a capsule with `audience: "human"`. Human reviews via browser (tractor-feed view), then a subsequent agent continues from the same capsule.

```
Agent: creates cap_review
  audience: "human"
  summary: "3 anomalies detected in billing data"
  state: { anomalies: [...], requires_approval: true }
  intent: { goal: "Get human approval to correct billing", guardrails: ["Do not auto-correct without approval"] }
```

Human shares capsule URL, reviews in browser, signals approval (creates receipt or new capsule).

Next agent: fetches cap_review, checks for approval receipt, proceeds or waits.

**Why it matters:** Capsules become the hand-off point between agent and human workflows. The tractor-feed view is designed for exactly this — human-readable at a glance.

---

## Pattern 6: Error Recovery

When an agent fails, it creates a capsule capturing what went wrong and what was attempted, so the retry agent (or human) has full context.

```json
{
  "summary": "Payment processing failed after 3 retries",
  "memory": {
    "key_facts": [
      "Customer submitted order #4521 at 10:15 UTC",
      "Payment gateway returned 503 three times",
      "Order is held, not cancelled"
    ]
  },
  "state": {
    "order_id": "4521",
    "payment_attempts": 3,
    "last_error": "gateway_unavailable",
    "order_status": "held"
  },
  "intent": {
    "goal": "Complete payment or escalate to support",
    "next_step": "retry_payment_with_backup_gateway",
    "guardrails": [
      "Do not cancel the order",
      "Do not retry more than 2 additional times",
      "Escalate to human support after 5 total failures"
    ]
  },
  "refs": {
    "receipt_ids": ["rct_attempt_1", "rct_attempt_2", "rct_attempt_3"]
  }
}
```

---

## Anti-Patterns

### Don't use capsules as event logs
Capsules are snapshots, not streams. If you need "everything that happened," that's a log system. Capsules carry "everything you need to know right now."

### Don't skip ProofSlip for trust-sensitive steps
If an agent says "I deployed successfully" in a capsule's memory, that's a claim. If it references `rct_deploy_success`, that's a proof. Use both.

### Don't chain capsules for every micro-step
Chain at decision boundaries, not function calls.

### Don't put secrets in capsules
Capsules are fetchable without auth (by design, for portability). Never put API keys, tokens, PII, or credentials in capsule fields.

---

## Implementation Priority

1. **Prove-Then-Continue** (Pattern 1) — core story, ship first
2. **Capsule Chain** (Pattern 2) — already supported via `refs.parent_capsule_id`
3. **Gate pattern** (Pattern 4) — natural extension of guardrails
4. **Human-in-the-Loop** (Pattern 5) — partially supported via `audience`
5. **Fork-and-Join** (Pattern 3) — needs multi-capsule fetch, lower priority
6. **Error Recovery** (Pattern 6) — works today with V2 schema, just needs docs