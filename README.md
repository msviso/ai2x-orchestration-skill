# AI2X Multi-Display Skill (ai2x)

## Audience & Scope Notice
本 README 專給內部與 Beta 伴侶使用，聚焦 AI2X skill 的行為、schema 與操作守則。若需要面向終端使用者的說明，請改看 **SKILL.md**。此 repository 為唯一的 canonical 實作與範例來源。

## Version & Release Status
目前維持 **v0.x**（Private / Closed Beta）。在 **v1.0** 之前，API、schema 與範例都可能隨時調整；請以此 repo 為準並定期更新。

## Private Beta Notice
AI2X skill 仍屬 beta 軟體，尚未提供 SLA。所有界面／範本皆可能更動，請勿將此版本用於需長期穩定支援的環境。

## Copyright & Ownership
© Microsense Vision Co., Ltd. 此 repo 為官方授權的 AI2X skill 來源，內容僅供授權對象於測試或合作場景使用。
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

## Access & Token Request
AI2X skill 需搭配 MCP access token。請在執行前透過以下任一管道提出申請或續期：
- Email：allan@msviso.com / contact@ai2xlab.com

申請郵件建議包含：
1. 主體資訊：公司名稱＋統編；若為個人請註明「個人使用」。
2. 聯絡方式：至少一種（Email、Telegram、WhatsApp、X、LinkedIn 皆可）。
3. 使用情境：預計操作的裝置/顯示器數量、場域與核心 use case（demo、內部看板、活動播報⋯）。
4. 技術窗口：若有協作工程師或代理人，請附姓名與聯絡方式方便授權與追蹤。

核可後會提供 token 配額與 MCP 設定說明。如需加急或企業部署，記得在信中註記時程需求。

## Quick Start
```bash
pnpm install
pnpm test
```

### Full Usage Guide
想看逐範本範例與中文教學，請參考 [docs/USAGE_GUIDE.md](docs/USAGE_GUIDE.md)。

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

### Reference demo clips (YouTube)
快速驗證 `youtube.v2` 時，可直接改用以下公開影片 URL：
- AI2X Concept Demo — https://youtu.be/veV3vu8Kfys
- Explain about the AI2X — https://youtu.be/oXdx0CCrN-s
- hTC Vive Glasses showcase — https://youtu.be/OWeaUTQ5JJ0?si=b2lFhRnobTZeQtBW

這些片段方便在展示或驗證流程中快速替換。

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

> 範例圖片可直接引用 [ServiceStack Hero image collection](https://github.com/ServiceStack/images/tree/master/hero) 中的靜態素材（均為直接資產 URL，符合「No Redirect」規則），方便快速測試 image.v2 或 imageGallery.v1。

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
    "title": "Weather Highlights",
    "items": [
      { "title": "Now", "description": "Cloudy 15℃", "meta": "Humidity 88% | ENE 15km/h" }
    ]
  }
}
~~~

### Rich template payloads（list.v2 / kv.v2 / cards.v2）

#### list.v2 — Field Ops Runbook
- 檔案：[`examples/orchestrateDisplay.list.v2.execute.json`](examples/orchestrateDisplay.list.v2.execute.json)
- 場景：支援一線工程團隊在 Day 0/Day 1 快速過目所有任務，混合 label/desc 與純文字備忘。
~~~json
{
  "tool": "orchestrateDisplay",
  "input": {
    "targetAssignmentIds": ["as_123"],
    "mode": "execute",
    "templateId": "list.v2",
    "payload": {
      "title": "AI2X Field Ops — Day 0 / Day 1 Runbook",
      "items": [
        {
          "label": "08:00 工程進場",
          "desc": "兩組技師到 3F/7F 會議室，接電後回報 Slack #ops-live"
        },
        {
          "label": "09:10 網路巡檢",
          "desc": "測試主線/備援 5G 連線，記錄 jitter 與 failover 結果"
        },
        {
          "label": "10:45 媒體預載",
          "desc": "orchestrateDisplay 預載最新 hero loop 與 keynote deck，確認 checksum"
        },
        "聯絡鏈：Weichien → Shelby → 外包工程（佳欣）",
        {
          "label": "13:30 試播彩排",
          "desc": "與主持人同步拆解 script，三個 slot 各跑一次"
        },
        {
          "label": "15:00 場外傳輸",
          "desc": "開啟北投備援點，確認 cross-site push < 3s"
        },
        {
          "label": "17:20 Day 0 Wrap",
          "desc": "收斂異常與備援需求，寫入 Ops doc"
        },
        {
          "label": "07:40 Day 1 健康檢查",
          "desc": "檢查 overnight log、lease 剩餘時間與 ticker 更新"
        }
      ]
    }
  }
}
~~~

#### kv.v2 — Operations Snapshot
- 檔案：[`examples/orchestrateDisplay.kv.v2.execute.json`](examples/orchestrateDisplay.kv.v2.execute.json)
- 場景：一次整理 7 組營運指標，突出區間與責任人。
~~~json
{
  "tool": "orchestrateDisplay",
  "input": {
    "targetAssignmentIds": ["as_123"],
    "mode": "execute",
    "templateId": "kv.v2",
    "payload": {
      "title": "Operations Snapshot — 2025/02/05 18:00",
      "items": [
        { "key": "Displays Online", "value": "18 / 18 (100%)" },
        { "key": "Content Push (24h)", "value": "74 ops | 0 failed" },
        { "key": "Avg Render Latency", "value": "240 ms (p95 410 ms)" },
        { "key": "Viewer Residency", "value": "7m42s (↑18% w/w)" },
        { "key": "Auto-Renew", "value": "每 60 分鐘 | 下次 19:05" },
        { "key": "Next Maintenance", "value": "02/07 09:00-11:00" },
        { "key": "On-call", "value": "Shelby (Teams / ext. 8821)" }
      ]
    }
  }
}
~~~

#### cards.v2 — Showcase Highlights
- 檔案：[`examples/orchestrateDisplay.cards.v2.execute.json`](examples/orchestrateDisplay.cards.v2.execute.json)
- 場景：多場域展示牆，搭配描述、場地需求與圖片，適合 demo 內容牆。
~~~json
{
  "tool": "orchestrateDisplay",
  "input": {
    "targetAssignmentIds": ["as_123"],
    "mode": "execute",
    "templateId": "cards.v2",
    "payload": {
      "title": "AI2X Showcase Highlights — Q1 Circuit",
      "items": [
        {
          "title": "零售分析島",
          "description": "三面窄邊框同步播放客流熱區、即時轉換率與補貨建議，支援現場 IoT sensor 串流。",
          "meta": "展區：台北世貿 A12 | 120V / 10A",
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Monterosso_from_the_hill.JPG"
        },
        {
          "title": "製造產線控台",
          "description": "stack.v2 內建告警、SPC 趨勢與換線倒數，並提供語音指令／badge scan 雙重確認。",
          "meta": "客戶：金屬加工廠 | SLA < 2 分鐘",
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/6/69/Sunrise_over_the_Annapurna_massif_near_Poon_Hill%2C_Nepal.jpg"
        },
        {
          "title": "跨區指揮中心",
          "description": "雙 86 吋螢幕播放活動 KPI、票務漏斗與現場攝影即時剪輯，搭配 ticker 提醒進場節奏。",
          "meta": "場域：南港展覽館二館 | 08:00-20:00 值班",
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/0/06/Hallstatt_300.jpg"
        },
        {
          "title": "智慧工地儀表",
          "description": "cards + chart 交錯顯示能耗、設備稼動率與 ESG 指標，可提醒維修人員打卡。",
          "meta": "區域：桃園新廠 | OTA 累積 1.2TB",
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Moraine_Lake_17092005.jpg"
        }
      ]
    }
  }
}
~~~

### Weather CSV sample for chart.v2
- 檔案：[`examples/weather_timeseries.csv`](examples/weather_timeseries.csv)
- 內容：2025/02/05 06:00-20:00（UTC+8）逐時氣溫、相對溼度、露點與降雨量，利於雙軸折線或柱狀示範。
- 用途：demo `chart.v2` 時，可直接讀取 CSV（timestamp, temperature_c, humidity_pct, dew_point_c, precip_mm）。

~~~json
{
  "tool": "orchestrateDisplay",
  "input": {
    "targetAssignmentIds": ["as_123"],
    "mode": "execute",
    "templateId": "chart.v2",
    "payload": {
      "type": "line",
      "title": "Xindian Weather Trend",
      "x": {
        "labels": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"]
      },
      "series": [
        { "name": "Temperature °C", "data": [16.8, 17.3, 18.2, 19.6, 21.1, 22.4] },
        { "name": "Humidity %", "data": [78, 76, 73, 69, 64, 60], "axis": "right" }
      ]
    }
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

### Display environment metadata (auto override)
- `list_displays` now surfaces governance hints (environment/defaultEnvironment/environmentHint/environmentTag/deploymentEnvironment/locationEnvironment). When present on the device record (root) or nested under `assignmentMeta`, `deviceMeta`, `metadata`, or `capabilities`, the skill overrides `ctx.uiContext.environment` before schema validation and governance.
- `push_content` applies the resolved display's environment, while `orchestrate_display` (single calls and sequences) picks the strictest target environment (ordering: private > shared > public > unknown). Mixed targets therefore degrade to the least-trusted scope.
- When no metadata is provided, the ctx.json value remains in effect, so there are no silent upgrades to private scopes without an explicit declaration.

## License
Private Beta — Internal/Evaluation use only. No redistribution.

© Microsense Vision Co., Ltd.


