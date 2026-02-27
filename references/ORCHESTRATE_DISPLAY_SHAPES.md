# Orchestrate Display Input Shapes (MCP tool: orchestrateDisplay)

This skill exposes `ai2x_multi.orchestrate_display(ctx, input)`.
It calls MCP tool `orchestrateDisplay`.

## Common fields
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "..."
}
```

`mode`:
- `preview` (plan only)
- `dryrun` (resolve targets only)
- `execute` (deliver)

## document.v2 (top-level title + body)
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "document.v2",
  "title": "Title",
  "body": "Full text here"
}
```

## image.v2 (payload)
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "image.v2",
  "payload": {
    "url": "https://.../image.jpg",
    "title": "Optional"
  }
}
```

## alert.v2 (payload)
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "alert.v2",
  "payload": {
    "title": "Notice",
    "message": "...",
    "level": "info"
  }
}
```

## list.v2 (payload.items)
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "list.v2",
  "payload": {
    "title": "Next Steps",
    "items": ["Ship v2", "Review logs"]
  }
}
```

## kv.v2 (payload.items key/value)
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "kv.v2",
  "payload": {
    "title": "Metrics",
    "items": [
      { "key": "Queue", "value": "3" }
    ]
  }
}
```

## ticker.v2 (payload.text)
```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "ticker.v2",
  "payload": {
    "text": "System status: normal"
  }
}
```

## stack.v2 (top-level title + blocks)
Blocks are kind-based. Supported kinds are MCP-controlled (commonly: `document`, `kv`, `list`).

```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "templateId": "stack.v2",
  "title": "Stack",
  "blocks": [
    { "kind": "document", "title": "Intro", "body": "Hello" },
    { "kind": "kv", "title": "KPIs", "items": [ { "key": "a", "value": "1" } ] },
    { "kind": "list", "title": "Next", "rows": ["A","B"] }
  ]
}
```

## Rotation / 換範本間隔（sequence + intervalSeconds）
Use this when you want to swap templates every N seconds.

Important: **Rotation is implemented by this skill** (it will call MCP `orchestrateDisplay` once per step). Do not send `sequence` directly to MCP.

```json
{
  "mode": "execute",
  "targetAssignmentIds": ["as_..."],
  "intervalSeconds": 3,
  "sequence": [
    { "templateId": "alert.v2", "payload": { "title": "A", "message": "first" } },
    { "templateId": "cards.v2", "payload": { "title": "B", "items": [ {"title":"t","description":"d"} ] } },
    { "templateId": "image.v2", "payload": { "url": "https://.../x.jpg" } }
  ]
}
```

### document.v2 inside sequence
You may write either of these forms; the skill will normalize to MCP's expected shape:

```json
{ "templateId": "document.v2", "title": "T", "body": "Hello" }
```

or

```json
{ "templateId": "document.v2", "payload": { "title": "T", "body": "Hello" } }
```

## transitionMs / 轉場動畫（可選）
If renderer supports it, you can add `transitionSeconds`/`transitionMs` to control animation duration.

## pdf.v2
Not supported by orchestrateDisplay on MCP. Use `ai2x.push_content`.
