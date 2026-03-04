import type { ContentJob, PushContentResult, RuntimeContext } from "../types/index.js";
import { TEMPLATE_ALLOWLIST } from "../config/defaults.js";
import { validateTemplate } from "../contracts/schemaMap.js";
import {
  applyGovernance,
  applyValidationFallback,
  normalizeDocumentV2Data
} from "../governance/sanitizer.js";
import { listDisplaysHandler } from "./listDisplays.js";
import { resolveTarget } from "./resolveTarget.js";
import { pushContent as mcpPushContent } from "../mcp/tools.js";
import { applyEnvironmentToContext } from "../utils/environment.js";

type McpEnvelope = {
  ok?: boolean;
  error?: unknown;
  message?: unknown;
  result?: unknown;
};

export async function pushContentHandler(
  ctx: RuntimeContext,
  job: ContentJob
): Promise<PushContentResult> {
  const allowlist = new Set(TEMPLATE_ALLOWLIST);
  if (!allowlist.has(job.templateId)) {
    return { ok: false, reason: "TEMPLATE_NOT_ALLOWED" };
  }

  const displayResult = await listDisplaysHandler(ctx);
  const displays = displayResult.displays || [];

  const target = resolveTarget(ctx, job, displays);
  if (!target?.assignmentId) {
    return { ok: false, reason: "NO_DISPLAYS" };
  }

  const ctxForTarget = applyEnvironmentToContext(ctx, target.environment);

  const validation = validateTemplate(job.templateId, job.data);
  let governed = validation.ok
    ? applyGovernance(ctxForTarget, job.templateId, job.data)
    : applyValidationFallback();

  if (!validation.ok) {
    governed.reason = "SCHEMA_INVALID";
  }

  const payload =
    governed.templateId === "document.v2"
      ? normalizeDocumentV2Data(governed.data)
      : governed.data;

  const response = (await mcpPushContent(ctxForTarget, {
    assignmentId: target.assignmentId,
    slot: job.slot,
    op: job.op,
    templateId: governed.templateId,
    payload
  })) as McpEnvelope | null;

  if (response?.ok === false) {
    return {
      ok: false,
      degraded: governed.degraded,
      reason: String(response.error || "MCP_ERROR"),
      target: { assignmentId: target.assignmentId, nickname: target.nickname, slot: job.slot }
    };
  }

  return {
    ok: true,
    pushed: response,
    degraded: governed.degraded,
    reason: governed.reason,
    target: { assignmentId: target.assignmentId, nickname: target.nickname, slot: job.slot }
  };
}
