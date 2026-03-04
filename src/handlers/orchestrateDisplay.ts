import type { NormalizedDisplay, RuntimeContext } from "../types/index.js";
import { orchestrateDisplay as callOrchestrate } from "../mcp/tools.js";
import { sanitizeOrchestrateDisplayInput } from "../governance/sanitizer.js";
import { listDisplaysHandler } from "./listDisplays.js";
import { applyEnvironmentToContext, strictestEnvironment } from "../utils/environment.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((v) => !!v);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function findDisplayByNickname(displays: NormalizedDisplay[], nickname: string) {
  const normalized = nickname.trim().toLowerCase();
  return displays.find((d) => d.nickname.trim().toLowerCase() === normalized);
}

function deriveEnvironmentForInput(
  ctx: RuntimeContext,
  displays: NormalizedDisplay[],
  rawInput: Record<string, unknown>
) {
  const ids = new Set<string>();
  const names = new Set<string>();

  collectStrings((rawInput as any).targetAssignmentIds).forEach((id) => ids.add(id));
  collectStrings((rawInput as any).targetAssignmentId).forEach((id) => ids.add(id));
  collectStrings((rawInput as any).targetNicknames).forEach((name) => names.add(name));
  collectStrings((rawInput as any).targetNickname).forEach((name) => names.add(name));

  const envs: Array<NormalizedDisplay["environment"]> = [];
  ids.forEach((id) => {
    const display = displays.find((d) => d.assignmentId === id);
    if (display?.environment) envs.push(display.environment);
  });

  if (!envs.length) {
    names.forEach((name) => {
      const display = findDisplayByNickname(displays, name);
      if (display?.environment) envs.push(display.environment);
    });
  }

  if (!envs.length && ctx.uiContext?.requestedDisplayNickname) {
    const display = findDisplayByNickname(displays, ctx.uiContext.requestedDisplayNickname);
    if (display?.environment) envs.push(display.environment);
  }

  if (!envs.length && displays.length === 1 && displays[0].environment) {
    envs.push(displays[0].environment);
  }

  return strictestEnvironment(envs);
}

export async function orchestrate_display(
  ctx: RuntimeContext,
  input: Record<string, unknown>
) {
  let displays: NormalizedDisplay[] = [];
  try {
    const listed = await listDisplaysHandler(ctx);
    displays = listed.displays || [];
  } catch {
    displays = [];
  }

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

      const envForStep = deriveEnvironmentForInput(ctx, displays, merged);
      const ctxForStep = applyEnvironmentToContext(ctx, envForStep);
      const sanitized = sanitizeOrchestrateDisplayInput(ctxForStep, merged);
      if (!sanitized.ok) {
        return {
          ok: false,
          reason: `SEQUENCE_STEP_${i}_INVALID:${sanitized.reason}`,
          errors: sanitized.errors
        };
      }

      const result = await callOrchestrate(ctxForStep, sanitized.input);
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
  const envForInput = deriveEnvironmentForInput(ctx, displays, input);
  const ctxForInput = applyEnvironmentToContext(ctx, envForInput);
  const sanitized = sanitizeOrchestrateDisplayInput(ctxForInput, input);
  if (!sanitized.ok) return sanitized;

  const result = await callOrchestrate(ctxForInput, sanitized.input);
  return { ok: true, tool: "orchestrateDisplay", result };
}
