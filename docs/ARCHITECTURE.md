# Architecture

AI2X is structured as a deterministic tool layer with clear contract boundaries:

1) Contracts
- JSON Schemas in `src/contracts/` define RuntimeContext, NormalizedDisplay, ContentJob, and template payloads.
- AJV validators compile schemas at runtime via `src/contracts/schemaMap.ts`.

2) MCP Adapter
- `src/mcp/client.ts` is the single HTTP client using MCP_BASE_URL and x-user-token.
- `src/mcp/tools.ts` exposes tool wrappers (listDisplays/pushContent).
- `src/mcp/normalize.ts` normalizes listDisplays results into the public schema.

3) Governance
- `src/governance/policy.ts` classifies risk (LOW/MEDIUM/HIGH).
- `src/governance/sanitizer.ts` enforces public-safe-by-default and fallback behavior.

4) Handlers
- `src/handlers/listDisplays.ts` calls MCP and returns normalized displays.
- `src/handlers/resolveTarget.ts` selects a target display deterministically.
- `src/handlers/pushContent.ts` validates, governs, and calls MCP pushContent.

5) Tool Exports
- `src/index.ts` exports `list_displays` and `push_content` for OpenClaw.
