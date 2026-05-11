# Umbrella Brand Brief

## Status: Future Phase (after both products stabilize)

## Concept

A wrapper site that defines the **category**, not a corporate umbrella.

**Category:** Infrastructure for reliable agent workflows

**Two primitives:**
- **Context transfer** (ContextCapsule) — navigational
- **State verification** (ProofSlip) — evidential

## What the Site Does

1. **Defines the category** — "agent workflow infrastructure" as a thing
2. **Explains why both exist** — the navigational/evidential pairing
3. **Shows combined workflows** — chaining patterns, integration examples
4. **Links to each product** — clean handoff, not a funnel

## What the Site Does NOT Do

- Replace either product's landing page
- Become "the main product"
- Add a third product
- Require separate auth/accounts

## Possible Domain

TBD. Options to explore:
- Something short that implies infrastructure/primitives
- Not a mashup of the two product names

## Content Structure (rough)

```
/                   Hero: category definition + two-product matrix
/how-it-works       Chaining patterns with diagrams
/context-capsule    Product card -> links to contextcapsule.ai
/proofslip          Product card -> links to proofslip.ai
/docs               Combined API reference showing both products
/llms.txt           Combined discovery for agent consumption
```

## Design Language

Same foundation as both products:
- Dark theme (#0a0a0a), green accent (#16a34a), Departure Mono
- But the umbrella should feel slightly more "infrastructure" — less playful than either product individually
- Think: the serious parent of two distinctive children

## Prerequisites Before Building

- [ ] ContextCapsule V2 schema (memory/state/intent) shipped
- [ ] At least one working chaining demo (Pattern 1: Prove-Then-Continue)
- [ ] Both products stable in production
- [ ] Brand name chosen
- [ ] Domain acquired

## Open Questions

- Does the umbrella need its own API key system, or do users get keys per-product?
- Should the umbrella have a combined SDK (e.g., `@agentinfra/sdk` that wraps both)?
- Does the umbrella need its own MCP server that exposes both tools?
