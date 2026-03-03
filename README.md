# AI2X Multi-Display Skill (ai2x)

## Audience & Scope Notice
This README is for internal & beta users. It documents the AI2X skill behavior and usage. For end‑users, refer to **SKILL.md**. This repository contains the canonical implementation and examples.

## Version & Release Status
Current branch is **v0.x** (Private / Closed Beta). APIs, schemas, and examples may change without notice until **v1.0**. Canonical schemas and examples live in this repo.

## Private Beta Notice
This skill is beta software. API behavior and schema details may change. There is no SLA for beta releases.

## Copyright & Ownership
© Microsense Vision Co., Ltd. This repository contains the official AI2X skill implementation and reference materials.
AI2X is a deterministic, schema-governed skill package that exposes OpenClaw tools for display discovery, content delivery, and lifecycle management:
- `list_displays` for display discovery
- `help` for onboarding guidance, pairing steps, and support details
- `orchestrateDisplay` for normalized planning + delivery (preferred)
- `push_content` for safe, policy-aware content delivery
- `claim_display` for pairing a display
- `renew_assignment` for lease renewals
- `revoke_assignment` for unpairing

## Lease & Renew Policy (Runtime-Owned)
Assignments are lease-based. If a lease expires, pushes may fail until renewed or re-claimed.
- Renew using `ai2x.renew_assignment` with `assignmentId` (optional `leaseMs`).
- Re-claim using `ai2x.claim_display` with a fresh pair code (optional `leaseMs`).
- If `leaseMs` is omitted, the MCP service determines the lease duration.
If a lease expires, the assignment may be revoked by the service; continued use requires renewal or re-claim.
- The skill does not run background keepalive tasks; the caller owns scheduling.

Recommended defaults for caller keepalive logic:
- `renewIntervalSeconds`: 60
- `minRenewIntervalSeconds`: 60
- `idleStopSeconds`: 180
- `maxSessionDurationSeconds`: 7200
- `retryOnExpired`: renew once, retry push once

## Media URL Direct-Asset Rule (No Redirects)
When using any media-related template, provide a direct asset URL. Redirect-based URLs are forbidden.

Applies to:
- image.v2
- pdf.v2
- imageGallery.v1 (images[].url)
- imageList.v1 (images[].url)
- cards.v2 (items[].imageUrl)
- stack.v2 (blocks[].imageUrl)

Direct asset URL requirements
- Returns HTTP 200 directly (no 301/302/307/308 redirects).
- Returns media bytes, not HTML.
- Images: Content-Type image/*.
- PDFs: Content-Type application/pdf.
- Final CDN/file URL (not a generator, landing page, preview, or share link).

Forbidden patterns (never use)
- Redirect generators (e.g., https://picsum.photos/1200/700).
- Random image endpoints.
- https://source.unsplash.com/... (redirect-based).
- Share/preview/viewer links (Google Drive view, Dropbox share, Notion pages).
- Any URL that responds with HTML instead of media bytes.
- Any URL that requires redirects to reach the asset.

If a compliant direct URL is not available, do not use a media template.

## Onboarding + Support
To start or refresh pairing, open ai2x.link on the target display. The page shows a pair code and QR that can be scanned or entered from the controller device using the AI2X skill. If pairing fails or expires, refresh ai2x.link to generate a new pair code.

Landing/Login: ai2x.link  
Vendor: Microsense Vision Co., Ltd.  
Support: allan@msviso.com  
Reference: www.msviso.com

Microsense Vision positions the display as a presentation surface, not a private inbox. This skill keeps full details in Microsense Vision AI Workspace and pushes only governed summaries to screens.

## Demo Video
https://youtu.be/veV3vu8Kfys

## Quick Start
```bash
git clone https://github.com/msviso/ai2x-orchestration-skill.git
cd ai2x-orchestration-skill
pnpm install
pnpm test
```

## Direct Download (prebuilt)
We provide a ready-to-use release archive. Download the latest `ai2x-skill-release.tgz` from GitHub Releases and extract it.

```bash
tar -xzf ai2x-skill-release.tgz
```

See `docs/OPENCLAW_USER_CASES.md` for OpenClaw usage examples.

## orchestrateDisplay Quick Start (Preferred)
~~~json
{
  "tool": "orchestrateDisplay",
  "input": {
    "targetAssignmentIds": ["as_123"],
    "mode": "execute",
    "templateId": "document.v2",
    "title": "Daily Update",
    "body": "Hello from AI2X",
    "sensitivity": "medium"
  }
}
~~~

Supported templates (orchestrateDisplay)
- document.v2
- stack.v2
- kv.v2
- list.v2
- cards.v2
- alert.v2
- chart.v2
- image.v2
- imageGallery.v1
- ticker.v2

Input shape by template (orchestrateDisplay)
- payload required for: alert.v2, cards.v2, chart.v2, image.v2, imageGallery.v1, kv.v2, list.v2, ticker.v2.
- document.v2 uses top-level fields: title + body (payload.content is not used).
- stack.v2 uses top-level title + blocks[] (kind-based blocks; not templateId/data blocks).

### Run examples
```bash
bash examples/curl/listDisplays.sh
bash examples/curl/pushDocument.sh
```

## Examples
Claim display (5 minutes):
```bash
node dist/bin/ai2x.js claim-display --ctx examples/ctx.sample.json --pairCode 123456 --leaseMs 300000
```

Push YouTube (FULL URL only):
```bash
node dist/bin/ai2x.js push-content --ctx examples/ctx.sample.json --job examples/job.youtube.json
```

Renew assignment (10 minutes target). Reminder: renew before expiry.
```bash
node dist/bin/ai2x.js renew-assignment --ctx examples/ctx.sample.json --assignmentId as_... --leaseMs 600000
```

## CLI
After build, the `ai2x` CLI is available via `dist/bin/ai2x.js`.

```bash
pnpm build
node dist/bin/ai2x.js get-capabilities
node dist/bin/ai2x.js validate --ctx examples/ctx.sample.json
node dist/bin/ai2x.js list-displays --ctx examples/ctx.sample.json
node dist/bin/ai2x.js push-content --ctx examples/ctx.sample.json --job examples/job.sample.json
node dist/bin/ai2x.js claim-display --ctx examples/ctx.sample.json --pairCode PAIR_CODE_HERE
node dist/bin/ai2x.js renew-assignment --ctx examples/ctx.sample.json --assignmentId as_123...
node dist/bin/ai2x.js revoke-assignment --ctx examples/ctx.sample.json --assignmentId as_123...
```

Notes:
- `ctx.userToken` is required for list/push but should never be printed.
- `MCP_BASE_URL` must be set for list/push (example: md-mcp-97542939.aixlab.cc/mcp).

### Init ctx (interactive)
`ai2x init` prompts for tenant/user/token and writes `ctx.json` with safe permissions.
Default paths:
- Linux/macOS: `~/.config/ai2x/ctx.json`
- Windows: `%APPDATA%\ai2x\ctx.json`

```bash
node dist/bin/ai2x.js init
node dist/bin/ai2x.js init --ctx ./ctx.json --tenantId t_123 --userId u_456
node dist/bin/ai2x.js init --overwrite
```

## Demo / Usage (Lifecycle Tools)
```bash
# Claim a display
node dist/bin/ai2x.js claim-display --ctx examples/ctx.sample.json --pairCode PAIR_CODE_HERE --leaseMs 300000

# Renew a lease
node dist/bin/ai2x.js renew-assignment --ctx examples/ctx.sample.json --assignmentId as_123... --leaseMs 300000

# Revoke an assignment
node dist/bin/ai2x.js revoke-assignment --ctx examples/ctx.sample.json --assignmentId as_123...
```

Use placeholders when testing:
- `pairCode`: `PAIR_CODE_HERE`
- `assignmentId`: `as_123...`
- `MCP_BASE_URL`: `mcp.example.com`

## CTX Setup (Write & Storage)
`ctx.json` holds tenant/user/token and is **required** for list/push/orchestrate calls.

### Option A — Interactive (recommended)
```bash
node dist/bin/ai2x.js init
# or specify a path
node dist/bin/ai2x.js init --ctx ./ctx.json
```

### Option B — Manual write
Create a file and **never** commit real tokens:
```json
{
  "tenantId": "t_123",
  "userId": "u_456",
  "userToken": "<TOKEN>",
  "mcpBaseUrl": "https://md-mcp-xxxx.aixlab.cc/mcp"
}
```

Default paths:
- Linux/macOS: `~/.config/ai2x/ctx.json`
- Windows: `%APPDATA%\ai2x\ctx.json`

Permissions:
- Linux/macOS: `chmod 600 ~/.config/ai2x/ctx.json`
- Windows: keep in user profile only

## Environment Variables
- `MCP_BASE_URL` (required): MCP base URL including `/mcp` path (example: md-mcp.example.com/mcp).

## Supported Templates
Allowlisted templates for `push_content`:
- document.v2
- stack.v2
- cards.v2
- pdf.v2
- image.v2
- imageGallery.v1
- imageList.v1
- list.v2
- kv.v2
- ticker.v2
- chart.v2
- alert.v2
- youtube.v2

## Supported templates quick notes
- imageGallery.v1 is NOT a carousel template; data.layout allows only "grid" or "list".
- cards.v2 uses data.items (array), not data.cards.
- imageGallery.v1 layout only grid/list; images[].url must be direct (no redirects); avoid https://picsum.photos/... and https://source.unsplash.com/....
- Prefer orchestrateDisplay by default; use push_content only for legacy/manual override.

Minimal imageGallery.v1 example (grid):
~~~json
{
  "target": { "assignmentId": "as_1234567890" },
  "slot": "primary",
  "op": "REPLACE",
  "templateId": "imageGallery.v1",
  "data": {
    "layout": "grid",
    "images": [
      {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg",
        "title": "Fronalpstock"
      }
    ]
  }
}
~~~

Minimal cards.v2 example:
~~~json
{
  "target": { "assignmentId": "as_1234567890" },
  "slot": "primary",
  "op": "REPLACE",
  "templateId": "cards.v2",
  "data": {
    "title": "Daily Highlights",
    "items": [
      { "title": "Key Update", "description": "Short summary text.", "meta": "Update 10:00" }
    ]
  }
}
~~~

## When to use push_content
push_content is a legacy/manual override path for fully custom board payloads that must not be normalized. For standardized rendering, preview, or stack.v2, use orchestrateDisplay.

## Governance Overview (Public-Safe-By-Default)
- Public/shared/unknown environments receive sanitized content.
- High-risk content becomes an `alert.v2` pointer to Microsense Vision AI Workspace.
- Medium-risk content is summarized into a short `document.v2`.
- Private environments pass through validated payloads without modification.

## License
Private Beta — Internal/Evaluation use only. No redistribution.

© Microsense Vision Co., Ltd.


