#!/usr/bin/env bash
set -euo pipefail

export MCP_BASE_URL=""
export X_USER_TOKEN=""
export TENANT_ID=""
export USER_ID=""

curl -s "$MCP_BASE_URL/tools/call" \
  -H "Content-Type: application/json" \
  -H "x-user-token: $X_USER_TOKEN" \
  -d '{
    "tool": "listDisplays",
    "input": {}
  }'

echo ""
# Expected response envelope:
# { "ok": true, "tool": "listDisplays", "result": { "count": 1, "devices": [ ... ] }, "ts": 1730000000000 }
