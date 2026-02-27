import type {
  RevokeAssignmentInput,
  RevokeAssignmentResult,
  RuntimeContext
} from "../types/index.js";
import { revokeAssignment as mcpRevokeAssignment } from "../mcp/tools.js";

type McpEnvelope = {
  ok?: boolean;
  error?: unknown;
  message?: unknown;
  result?: unknown;
};

export async function revokeAssignmentHandler(
  ctx: RuntimeContext,
  input: RevokeAssignmentInput
): Promise<RevokeAssignmentResult> {
  try {
    const envelope = (await mcpRevokeAssignment(ctx, input)) as McpEnvelope | null;

    if (envelope?.ok === false) {
      return {
        ok: false,
        assignmentId: input.assignmentId,
        reason: String(envelope.error || "MCP_ERROR")
      };
    }

    return { ok: true, assignmentId: input.assignmentId };
  } catch {
    return { ok: false, assignmentId: input.assignmentId, reason: "MCP_ERROR" };
  }
}
