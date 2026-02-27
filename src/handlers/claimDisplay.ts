import type {
  ClaimDisplayInput,
  ClaimDisplayResult,
  RuntimeContext
} from "../types/index.js";
import { claimDisplay as mcpClaimDisplay } from "../mcp/tools.js";
import { normalizeDisplay } from "../mcp/normalize.js";
import { parsePairingFromScan } from "../pairing/parse.js";

type McpEnvelope = {
  ok?: boolean;
  error?: unknown;
  message?: unknown;
  result?: unknown;
};

function shouldParsePairingInput(value: string): boolean {
  if (value.includes("\n") || value.includes("\r")) return true;
  const trimmed = value.trim();
  if (trimmed.startsWith("AI2X-PAIR")) return true;
  if (/(^|\s)code=/.test(trimmed)) return true;
  return false;
}

function pairingError(result: ReturnType<typeof parsePairingFromScan>): ClaimDisplayResult {
  if (result.reason === "UNSUPPORTED_VERSION") {
    return {
      ok: false,
      reason: "UNSUPPORTED_VERSION",
      details: "Unsupported QR version. Update the AI2X skill or visit ai2x.link/install."
    };
  }

  if (result.reason === "EXPIRED") {
    return {
      ok: false,
      reason: "EXPIRED",
      details: "This pairing code has expired. Refresh the display pairing page to get a new code."
    };
  }

  return {
    ok: false,
    reason: "PAIRING_PARSE_ERROR",
    details:
      "QR scan not recognized. Ensure the QR contains a line starting with \"AI2X-PAIR v=1\" or open ai2x.link."
  };
}

function pickResult(envelope: McpEnvelope | null): Record<string, unknown> {
  if (!envelope) return {};
  if (typeof envelope.ok === "boolean" && envelope.result) {
    return envelope.result as Record<string, unknown>;
  }
  if (envelope.result) return envelope.result as Record<string, unknown>;
  return envelope as Record<string, unknown>;
}

export async function claimDisplayHandler(
  ctx: RuntimeContext,
  input: ClaimDisplayInput
): Promise<ClaimDisplayResult> {
  try {
    let pairCode = input.pairCode;
    if (shouldParsePairingInput(pairCode)) {
      const parsed = parsePairingFromScan(pairCode);
      if (!parsed.ok || !parsed.code) {
        return pairingError(parsed);
      }
      pairCode = parsed.code;
    }

    const envelope = (await mcpClaimDisplay(ctx, {
      pairCode,
      nickname: input.nickname,
      leaseMs: input.leaseMs
    })) as McpEnvelope | null;

    if (envelope?.ok === false) {
      return {
        ok: false,
        reason: String(envelope.error || "MCP_ERROR"),
        details: typeof envelope.message === "string" ? envelope.message : undefined
      };
    }

    const result = pickResult(envelope);
    const assignmentId =
      typeof result.assignmentId === "string" ? result.assignmentId : undefined;

    if (!assignmentId) {
      return { ok: false, reason: "MCP_RESPONSE_INVALID" };
    }

    const nickname =
      typeof result.nickname === "string" ? result.nickname : undefined;

    const displayCandidate =
      typeof result.display === "object" && result.display
        ? (result.display as Record<string, unknown>)
        : undefined;
    const deviceCandidate =
      typeof result.device === "object" && result.device
        ? (result.device as Record<string, unknown>)
        : undefined;
    const fallbackCandidate =
      typeof result === "object" && result ? (result as Record<string, unknown>) : undefined;
    const candidate = displayCandidate || deviceCandidate || fallbackCandidate;
    const display = candidate ? normalizeDisplay(candidate) : null;

    return {
      ok: true,
      assignmentId,
      nickname: nickname || display?.nickname,
      display: display || undefined
    };
  } catch {
    return { ok: false, reason: "MCP_ERROR" };
  }
}
