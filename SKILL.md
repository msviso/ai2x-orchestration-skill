---
name: ai2x
description: AI2X multi-display orchestration + governed content push via MCP for multi-agent use. Provides deterministic tools for pairing (claim_display), renewing leases, listing displays, and pushing content. Use when an agent needs to show alerts/cards/images/charts/stack/document on AI2X displays, and must follow governance + schema.
---

## Quick rules (must follow)
- Never reveal or log `ctx.userToken`.
- Display metadata (`environment`, `defaultEnvironment`, `environmentHint`, etc.) now overrides `ctx.uiContext.environment` automatically per target — keep assignments.json and registry entries accurate.
- Displays are public/untrusted by default → prefer `orchestrate_display` (governed) over `push_content`.
- Pair codes are one-time/short-lived. If claim fails: refresh `https://AI2X.link` on the display to get a new code.
- Renew is NOT automatic. Call `renew_assignment` while the user is still viewing the screen.

## Context (MCP) Setup
This skill reads MCP settings from `ctx.json` (after `init`). Once `ctx.json` exists, agents **should not ask** for token again.

**Init (recommended):**
```bash
node dist/bin/ai2x.js init --ctx ./ctx.json
```

**Environment variable (optional):**
```bash
export AI2X_CTX_PATH=/path/to/ctx.json
```

**Required fields in ctx.json:**
- `mcpBaseUrl` (example: `https://md-mcp-97542939.aixlab.cc/mcp`)
- `userToken`
- `tenantId` / `userId`

## Tools (this skill copy is namespaced)
- `ai2x.claim_display(ctx, {pairCode, nickname?})`
- `ai2x.renew_assignment(ctx, {assignmentId, leaseMs?})`
- `ai2x.revoke_assignment(ctx, {assignmentId})`
- `ai2x.list_displays(ctx)`
- `ai2x.orchestrate_display(ctx, input)` **preferred**
- `ai2x.push_content(ctx, job)` legacy/escape hatch (for pdf.v2, youtube.v2, raw board-like pushes)

## Interaction plan (multi-agent)
When coordinating across agents, keep a single shared “display session” state:
- `pairCode` (fresh)
- `assignmentId` (current)
- `leaseUntil` (if returned)
- `lastPushedTemplateId`

Suggested chat flow:
1) Ask user for pair code.
2) `claim_display` → store `assignmentId`.
3) Use `orchestrate_display` for normal templates.
4) If user says “I’m still watching” → `renew_assignment`.

## Template routing (important)
- `orchestrate_display` supports (and expects correct input shapes).
- If user asks for **「換範本的間隔時間」** (rotation interval): pass a `sequence` + `intervalSeconds` to a single `orchestrate_display` call.
  - document.v2 → top-level `title` + `body` (NOT payload)
  - stack.v2 → top-level `title` + `blocks[]` (kind-based)
  - most others → `payload`
- `pdf.v2` is not supported by orchestrateDisplay on MCP → use `push_content`.

## References
- See `references/ORCHESTRATE_DISPLAY_SHAPES.md` for exact input shapes and copy-paste examples.
- See `references/MULTI_AGENT_PLAYBOOK.md` for coordination patterns and failure handling.

## ✅ Demo asset sources (avoid hallucinated URLs)
When showing images, use verified direct URLs (raw media), not AI-generated or redirect links.
Recommended source:
- https://github.com/ServiceStack/images/tree/master/hero
Raw URL format:
- https://raw.githubusercontent.com/ServiceStack/images/master/hero/<filename>.jpg

See examples:
- examples/image.v2.servicestack.json
- examples/imageGallery.v1.servicestack.json
- examples/youtube.v2.demo.json
