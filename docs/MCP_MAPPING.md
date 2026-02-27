# MCP Mapping

## Reference Summary
- MCP uses HTTP JSON endpoints. Core call: `POST /mcp/tools/call` with `{ tool, input }`.
- Response envelope: `{ ok, tool, result, ts }` with error form `{ ok:false, error, message, ts }`.
- listDisplays tool returns `{ count, devices[] }` and enriches device security fields.
- pushContent accepts `{ assignmentId, slot, op, templateId, payload }` and forwards to gateway.
- Template catalog includes document.v2, stack.v2, cards.v2, pdf.v2, image.v2, imageGallery.v1, imageList.v1,
  list.v2, kv.v2, ticker.v2, chart.v2, alert.v2, youtube.v2 (and more in MCP). AI2X allowlist follows
  the getCapabilities list provided by MCP.

Source: Reference/MCP_SERVICE_SPEC.md and Reference/MCP_TEMPLATE_DATA.md.

## MCP -> NormalizedDisplay
From `listDisplays` response devices[]:
- `assignmentId` -> `NormalizedDisplay.assignmentId`
- `deviceId` -> `NormalizedDisplay.displayId`
- `nickname` -> `NormalizedDisplay.nickname`
- `status` -> `NormalizedDisplay.status`
- Security fields (`trustTier`, `trustLevel`, `riskLevel`, `matchedRule`, `trustNote`, `ip`, `deviceMeta`, `connected`, `lastSeen`) -> `NormalizedDisplay.capabilities`

## MCP Tool Mapping
- listDisplays -> MCP tool `listDisplays`
- pushContent -> MCP tool `pushContent`

Note: MCP supports pushBoard and other tools, but AI2X MVP intentionally exposes only list/push.
