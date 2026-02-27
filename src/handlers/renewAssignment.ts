import type {
  RenewAssignmentInput,
  RenewAssignmentResult,
  RuntimeContext
} from "../types/index.js";
import { renewAssignment as mcpRenewAssignment } from "../mcp/tools.js";

type McpEnvelope = {
  ok?: boolean;
  error?: unknown;
  message?: unknown;
  result?: unknown;
};

function pickResult(envelope: McpEnvelope | null): Record<string, unknown> {
  if (!envelope) return {};
  if (typeof envelope.ok === "boolean" && envelope.result) {
    return envelope.result as Record<string, unknown>;
  }
  if (envelope.result) return envelope.result as Record<string, unknown>;
  return envelope as Record<string, unknown>;
}

export async function renewAssignmentHandler(
  ctx: RuntimeContext,
  input: RenewAssignmentInput
): Promise<RenewAssignmentResult> {
  try {
    const envelope = (await mcpRenewAssignment(ctx, input)) as McpEnvelope | null;

    if (envelope?.ok === false) {
      return {
        ok: false,
        assignmentId: input.assignmentId,
        reason: String(envelope.error || "MCP_ERROR")
      };
    }

    const result = pickResult(envelope);
    const leaseUntil =
      typeof result.leaseUntil === "string"
        ? result.leaseUntil
        : typeof result.leaseExpiresAt === "string"
          ? result.leaseExpiresAt
          : undefined;

    return {
      ok: true,
      assignmentId: input.assignmentId,
      leaseUntil
    };
  } catch {
    return { ok: false, assignmentId: input.assignmentId, reason: "MCP_ERROR" };
  }
}
