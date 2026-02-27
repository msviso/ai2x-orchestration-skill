#!/usr/bin/env bash
set -euo pipefail

export MCP_BASE_URL=""
export X_USER_TOKEN=""
export TENANT_ID=""
export USER_ID=""

ASSIGNMENT_ID=""

curl -s "$MCP_BASE_URL/tools/call" \
  -H "Content-Type: application/json" \
  -H "x-user-token: $X_USER_TOKEN" \
  -d '{
    "tool": "pushContent",
    "input": {
      "assignmentId": "'"$ASSIGNMENT_ID"'",
      "slot": "primary",
      "op": "REPLACE",
      "templateId": "document.v2",
      "payload": {
        "title": "AI2X Brief",
        "body": "This is a gateway-side example. Use ai2x.push_content for governed payloads."
      }
    }
  }'

echo ""
# Expected response envelope:
# { "ok": true, "tool": "pushContent", "result": { ... }, "ts": 1730000000000 }
