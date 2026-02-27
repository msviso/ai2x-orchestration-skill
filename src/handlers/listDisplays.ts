import type { RuntimeContext, ListDisplaysResult } from "../types/index.js";
import { listDisplays as mcpListDisplays } from "../mcp/tools.js";
import { normalizeDisplays } from "../mcp/normalize.js";

type McpEnvelope = {
  ok?: boolean;
  error?: unknown;
  message?: unknown;
  result?: unknown;
};

export async function listDisplaysHandler(ctx: RuntimeContext): Promise<ListDisplaysResult> {
  try {
    const envelope = (await mcpListDisplays(ctx)) as McpEnvelope | null;

    if (envelope?.ok === false) {
      return { ok: false, displays: [], reason: String(envelope.error || "MCP_ERROR") };
    }

    const displays = normalizeDisplays(envelope);
    if (!displays.length) {
      return { ok: true, displays: [], reason: "NO_DISPLAYS" };
    }

    return { ok: true, displays };
  } catch (error) {
    return { ok: false, displays: [], reason: "MCP_ERROR" };
  }
}
