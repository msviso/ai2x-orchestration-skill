# OpenClaw User Cases — AI2X Skill

This guide shows how OpenClaw users can implement AI2X workflows end‑to‑end.

## 1) Setup (once)

```bash
# install OpenClaw
npm install -g openclaw

# add skill
openclaw skill add ai2x-skill
```

Create `ctx.json` (never commit tokens):
```json
{
  "tenantId": "t_123",
  "userId": "u_456",
  "userToken": "<TOKEN>",
  "mcpBaseUrl": "https://md-mcp-xxxx.aixlab.cc/mcp"
}
```

## 2) Pair a display (claim)
```bash
openclaw run ai2x.claim_display --pairCode 123456 --ctx ./ctx.json --leaseMs 300000
```

## 3) Push structured content (orchestrateDisplay)
```bash
openclaw run ai2x.orchestrate_display --input '{
  "targetAssignmentIds": ["as_123"],
  "mode": "execute",
  "templateId": "document.v2",
  "title": "Daily Update",
  "body": "Hello from AI2X",
  "sensitivity": "medium"
}'
```

## 4) Renew / Revoke
```bash
openclaw run ai2x.renew_assignment --assignmentId as_123 --leaseMs 300000
openclaw run ai2x.revoke_assignment --assignmentId as_123
```

## 5) Use cases

### Meeting summary to wall display
- Claim display
- Push `document.v2` summary
- Revoke after 5–10 minutes

### KPI dashboard to panel
- Push `cards.v2` or `kv.v2`
- Renew lease every 60s

### Alert to public kiosk
- Use `alert.v2` with `sensitivity=high`

---

**Notes**
- Prefer `ai2x.orchestrate_display` for governed output.
- Use `ai2x.push_content` only for legacy/manual overrides.
