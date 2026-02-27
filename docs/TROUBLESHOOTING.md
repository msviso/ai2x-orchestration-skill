# Troubleshooting

## NO_DISPLAYS
- MCP returned zero devices for the current user token.
- Ensure the display is claimed and visible to the user scope.

## MCP Unreachable
- Check that `MCP_BASE_URL` is set and includes `/mcp`.
- Verify the MCP service is running and reachable from this environment.

## Schema Validation Failed
- Payload did not match the template schema. AI2X degrades to `alert.v2`.
- Fix the payload structure or validate locally via tests.

## Validation Errors
- `RuntimeContext` and `ContentJob` are schema-validated in tests.
- Confirm `requestId`, `ownerScope`, and `userToken` are present.

## Assumptions
- `document.v2` uses `{ title, content }` per skill contract; MCP references also use `{ body }`.
  If your MCP runtime expects `body`, adjust upstream or translate before calling `push_content`.
- `MCP_BASE_URL` should point to the MCP root (example: `https://host/mcp`).
