# Security

## Token Handling
- `x-user-token` is required and never logged.
- The token is only used as an HTTP header when calling MCP.

## SSRF Prevention
- The skill uses `MCP_BASE_URL` from environment only.
- No user-supplied URLs are accepted as MCP endpoints.

## Public Display Policy
- Displays are treated as public/shared by default.
- High-risk content is replaced with an `alert.v2` pointer to Microsense Vision AI Workspace.
- Medium-risk content is summarized before display.

## Secrets
- No secrets are committed. Use `.env.example` as a template.
