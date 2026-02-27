import type { RuntimeContext } from "../types/index.js";
import { orchestrateDisplay as callOrchestrate } from "../mcp/tools.js";
import { sanitizeOrchestrateDisplayInput } from "../governance/sanitizer.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function orchestrate_display(
  ctx: RuntimeContext,
  input: Record<string, unknown>
) {
  // If caller passes a sequence, treat this as a template-rotation plan.
  const seq = (input as any).sequence;
  const intervalMsRaw = (input as any).intervalMs;
  const intervalSecondsRaw = (input as any).intervalSeconds;

  let intervalMs: number | undefined;
  if (typeof intervalMsRaw === "number" && Number.isFinite(intervalMsRaw)) {
    intervalMs = Math.round(intervalMsRaw);
  }
  if (
    intervalMs === undefined &&
    typeof intervalSecondsRaw === "number" &&
    Number.isFinite(intervalSecondsRaw)
  ) {
    intervalMs = Math.round(intervalSecondsRaw * 1000);
  }
  if (intervalMs !== undefined) {
    if (intervalMs < 0) intervalMs = 0;
    if (intervalMs > 600000) intervalMs = 600000;
  }

  if (Array.isArray(seq) && seq.length) {
    const max = Math.min(seq.length, 20);
    const results: any[] = [];

    for (let i = 0; i < max; i++) {
      const step = seq[i];
      const merged: Record<string, unknown> = { ...input, ...(step || {}) };

      // Sequence steps may use payload-style for document.v2 (e.g. {payload:{title,body}}).
      // Normalize to orchestrateDisplay's expected top-level {title, body} to avoid MCP errors.
      if (String((merged as any).templateId || "") === "document.v2") {
        const payload = (merged as any).payload;
        if (!((merged as any).title) && payload && typeof payload === "object" && typeof payload.title === "string") {
          (merged as any).title = payload.title;
        }
        if (!((merged as any).body) && payload && typeof payload === "object") {
          if (typeof payload.body === "string") (merged as any).body = payload.body;
          else if (typeof payload.content === "string") (merged as any).body = payload.content;
        }
      }
      // prevent recursion / passing the whole sequence down to MCP
      delete (merged as any).sequence;
      delete (merged as any).intervalMs;
      delete (merged as any).intervalSeconds;

      const sanitized = sanitizeOrchestrateDisplayInput(ctx, merged);
      if (!sanitized.ok) {
        return {
          ok: false,
          reason: `SEQUENCE_STEP_${i}_INVALID:${sanitized.reason}`,
          errors: sanitized.errors
        };
      }

      const result = await callOrchestrate(ctx, sanitized.input);
      const ok = !!(result as any)?.ok;
      const delivered = (result as any)?.delivered;
      results.push({ index: i, templateId: String((step as any)?.templateId || ""), ok, delivered, result });

      if (!ok) {
        return {
          ok: false,
          reason: `SEQUENCE_STEP_${i}_MCP_ERROR`,
          result,
          results
        };
      }

      if (intervalMs && i < max - 1) {
        await sleep(intervalMs);
      }
    }

    return { ok: true, tool: "orchestrateDisplay", sequence: true, results };
  }

  // Single push
  const sanitized = sanitizeOrchestrateDisplayInput(ctx, input);
  if (!sanitized.ok) return sanitized;

  const result = await callOrchestrate(ctx, sanitized.input);
  return { ok: true, tool: "orchestrateDisplay", result };
}
