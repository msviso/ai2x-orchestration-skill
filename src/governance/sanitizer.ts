import type { RuntimeContext } from "../types/index.js";
import { ALERT_TITLE, SUMMARY_TITLE, WORKSPACE_POINTER } from "../config/defaults.js";
import { validateTemplate } from "../contracts/schemaMap.js";
import { classifyRisk, RiskLevel } from "./policy.js";

export type GovernanceResult = {
  templateId: string;
  data: Record<string, unknown>;
  degraded: boolean;
  reason?: string;
};

const ALERT_LEVEL = "warning";

function buildAlert(reason?: string): GovernanceResult {
  return {
    templateId: "alert.v2",
    data: {
      title: ALERT_TITLE,
      message: WORKSPACE_POINTER,
      level: ALERT_LEVEL
    },
    degraded: true,
    reason
  };
}

function extractText(data: Record<string, unknown>) {
  const keys = ["content", "body", "message", "text", "title"];
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return JSON.stringify(data);
}

export function normalizeDocumentV2Data(
  data: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...data };
  const bodyValue = normalized.body;
  const contentValue = normalized.content;
  let bodyText =
    typeof bodyValue === "string" && bodyValue.trim() ? bodyValue : undefined;

  if (!bodyText && typeof contentValue === "string" && contentValue.trim()) {
    bodyText = contentValue;
  }

  if (!bodyText) {
    try {
      const json = JSON.stringify(data);
      if (typeof json === "string") bodyText = json;
    } catch {
      bodyText = String(bodyValue ?? contentValue ?? "");
    }
  }

  if (typeof bodyText !== "string") bodyText = "";
  normalized.body = bodyText;

  if (typeof normalized.content !== "string") {
    normalized.content = bodyText;
  }

  return normalized;
}

function summarizeData(data: Record<string, unknown>): GovernanceResult {
  const raw = extractText(data);
  const snippet = raw.slice(0, 240).trim();
  return {
    templateId: "document.v2",
    data: normalizeDocumentV2Data({
      title: SUMMARY_TITLE,
      content: `Summary: ${snippet}${raw.length > 240 ? "..." : ""}`
    }),
    degraded: true,
    reason: "MEDIUM_RISK_SUMMARY"
  };
}

export function applyGovernance(
  ctx: RuntimeContext,
  templateId: string,
  data: Record<string, unknown>
): GovernanceResult {
  const env = ctx.uiContext?.environment || "unknown";
  if (env === "private") {
    return { templateId, data, degraded: false };
  }

  const risk: RiskLevel = classifyRisk(data);
  if (risk === "HIGH") return buildAlert("HIGH_RISK_REDACTED");
  if (risk === "MEDIUM") return summarizeData(data);

  return { templateId, data, degraded: false };
}

export function applyValidationFallback(): GovernanceResult {
  return buildAlert("SCHEMA_INVALID");
}

type OrchestrateSanitizeOk = { ok: true; input: Record<string, unknown> };
type OrchestrateSanitizeErr = { ok: false; reason: string; errors?: unknown[] };

const ORCHESTRATE_TEMPLATE_ALLOWLIST = new Set([
  "document.v2",
  "stack.v2",
  "kv.v2",
  "list.v2",
  "cards.v2",
  "alert.v2",
  "chart.v2",
  "image.v2",
  "imageGallery.v1",
  "ticker.v2"
]);

export function sanitizeOrchestrateDisplayInput(
  ctx: RuntimeContext,
  input: Record<string, unknown>
): OrchestrateSanitizeOk | OrchestrateSanitizeErr {
  const templateId = String(input.templateId || "").trim();
  if (!templateId) return { ok: false, reason: "MISSING_TEMPLATE" };
  if (!ORCHESTRATE_TEMPLATE_ALLOWLIST.has(templateId)) {
    return { ok: false, reason: `TEMPLATE_NOT_ALLOWED:${templateId}` };
  }

  const mode = String(input.mode || "execute").trim();
  const targetAssignmentIds = Array.isArray(input.targetAssignmentIds)
    ? input.targetAssignmentIds.filter((x) => typeof x === "string" && x.trim())
    : [];
  const targetNicknames = Array.isArray(input.targetNicknames)
    ? input.targetNicknames.filter((x) => typeof x === "string" && x.trim())
    : [];

  // transitionMs = template change animation duration (renderer-controlled)
  const transitionMsRaw = (input as any).transitionMs;
  const transitionSecondsRaw = (input as any).transitionSeconds;
  let transitionMs: number | undefined;
  if (typeof transitionMsRaw === "number" && Number.isFinite(transitionMsRaw)) transitionMs = Math.round(transitionMsRaw);
  if (transitionMs === undefined && typeof transitionSecondsRaw === "number" && Number.isFinite(transitionSecondsRaw)) transitionMs = Math.round(transitionSecondsRaw * 1000);
  if (transitionMs !== undefined) {
    if (transitionMs < 0) transitionMs = 0;
    if (transitionMs > 10000) transitionMs = 10000;
  }

  const base: Record<string, unknown> = {
    templateId,
    mode: mode || "execute",
    ...(targetAssignmentIds.length ? { targetAssignmentIds } : {}),
    ...(targetNicknames.length ? { targetNicknames } : {}),
    ...(transitionMs !== undefined ? { transitionMs } : {})
  };

  // Per spec:
  // - document.v2 uses top-level title + body
  // - stack.v2 uses top-level title + blocks (NOTE: does NOT match our pushContent stack.v2 schema)
  // - others use payload

  function validateOrchestratePayload(id: string, data: unknown) {
    if (id === "stack.v2") return { ok: true, errors: [] as unknown[] };
    const r = validateTemplate(id, data);
    return r;
  }
  if (templateId === "document.v2") {
    const title = typeof input.title === "string" ? input.title : undefined;
    const body =
      typeof input.body === "string"
        ? input.body
        : typeof (input.payload as any)?.body === "string"
          ? (input.payload as any).body
          : typeof (input.payload as any)?.content === "string"
            ? (input.payload as any).content
            : undefined;

    if (!body || !String(body).trim()) return { ok: false, reason: "MISSING_BODY" };

    // Apply governance on the display-visible body.
    const governed = applyGovernance(ctx, templateId, { title: title || "", body: String(body) });
    if (governed.degraded) {
      // orchestrateDisplay supports delivering document; for degraded content we fall back to alert/document summary.
      if (governed.templateId === "alert.v2") {
        const chk = validateOrchestratePayload("alert.v2", governed.data);
        if (!chk.ok) return { ok: false, reason: "SCHEMA_INVALID", errors: chk.errors };
        return {
          ok: true,
          input: {
            ...base,
            templateId: "alert.v2",
            payload: governed.data
          }
        };
      }
      const normalizedDoc = {
        title: String((governed.data as any).title || "Content Summary"),
        body: String((governed.data as any).body || (governed.data as any).content || "")
      };
      const chk = validateOrchestratePayload("document.v2", normalizedDoc);
      if (!chk.ok) return { ok: false, reason: "SCHEMA_INVALID", errors: chk.errors };
      return {
        ok: true,
        input: {
          ...base,
          templateId: "document.v2",
          title: normalizedDoc.title,
          body: normalizedDoc.body
        }
      };
    }

    const normalizedDoc = { title: title || "", body: String(body) };
    const chk = validateOrchestratePayload("document.v2", normalizedDoc);
    if (!chk.ok) return { ok: false, reason: "SCHEMA_INVALID", errors: chk.errors };

    return {
      ok: true,
      input: {
        ...base,
        title: normalizedDoc.title,
        body: normalizedDoc.body
      }
    };
  }

  if (templateId === "stack.v2") {
    const title = typeof input.title === "string" ? input.title : "";
    const blocks = Array.isArray(input.blocks) ? input.blocks : (input.payload as any)?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return { ok: false, reason: "MISSING_BLOCKS" };
    }

    return {
      ok: true,
      input: {
        ...base,
        title,
        blocks
      }
    };
  }

  const payload = (input.payload && typeof input.payload === "object" ? input.payload : undefined) as
    | Record<string, unknown>
    | undefined;
  if (!payload) return { ok: false, reason: "MISSING_PAYLOAD" };

  // Normalize a few common "almost right" payload shapes to reduce silent failures.
  if (templateId === "kv.v2" && Array.isArray((payload as any).items)) {
    (payload as any).items = (payload as any).items.map((it: any) => {
      if (it && typeof it === "object") {
        if (it.key !== undefined && it.value !== undefined) return it;
        if (it.k !== undefined && it.v !== undefined) return { key: String(it.k), value: String(it.v) };
      }
      return it;
    });
  }

  if (templateId === "list.v2") {
    if ((payload as any).items === undefined && Array.isArray((payload as any).rows)) {
      (payload as any).items = (payload as any).rows;
      delete (payload as any).rows;
    }
    if (Array.isArray((payload as any).items)) {
      (payload as any).items = (payload as any).items.map((it: any) => {
        if (typeof it === "string") return it;
        if (it && typeof it === "object" && typeof it.text === "string") return it.text;
        return it;
      });
    }
  }

  if (templateId === "ticker.v2") {
    if ((payload as any).text === undefined && Array.isArray((payload as any).items)) {
      const first = (payload as any).items[0];
      if (typeof first === "string") (payload as any).text = first;
      else if (first && typeof first === "object" && typeof first.text === "string") (payload as any).text = first.text;
    }
    delete (payload as any).items;
  }

  const governed = applyGovernance(ctx, templateId, payload);
  if (governed.degraded) {
    // degrade to alert/doc summary via orchestrateDisplay-compatible inputs
    if (governed.templateId === "alert.v2") {
      const chk = validateOrchestratePayload("alert.v2", governed.data);
      if (!chk.ok) return { ok: false, reason: "SCHEMA_INVALID", errors: chk.errors };
      return { ok: true, input: { ...base, templateId: "alert.v2", payload: governed.data } };
    }
    const normalizedDoc = {
      title: String((governed.data as any).title || "Content Summary"),
      body: String((governed.data as any).body || (governed.data as any).content || "")
    };
    const chk = validateOrchestratePayload("document.v2", normalizedDoc);
    if (!chk.ok) return { ok: false, reason: "SCHEMA_INVALID", errors: chk.errors };
    return {
      ok: true,
      input: {
        ...base,
        templateId: "document.v2",
        title: normalizedDoc.title,
        body: normalizedDoc.body
      }
    };
  }

  // Validate against template schema where applicable.
  const chk = validateOrchestratePayload(templateId, governed.data);
  if (!chk.ok) return { ok: false, reason: "SCHEMA_INVALID", errors: chk.errors };

  return { ok: true, input: { ...base, payload: governed.data } };
}
