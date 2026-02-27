import type { RuntimeContext } from "../types/index.js";
import { callTool } from "./client.js";

export async function listDisplays(ctx: RuntimeContext) {
  return callTool("listDisplays", {}, ctx);
}

export async function pushContent(
  ctx: RuntimeContext,
  input: {
    assignmentId?: string;
    displayId?: string;
    slot?: string;
    op?: string;
    viewId?: string;
    kind?: string;
    templateId: string;
    payload: Record<string, unknown>;
  }
) {
  return callTool("pushContent", input, ctx);
}

export async function claimDisplay(
  ctx: RuntimeContext,
  input: { pairCode: string; nickname?: string; leaseMs?: number }
) {
  return callTool("claimDisplay", input, ctx);
}

export async function renewAssignment(
  ctx: RuntimeContext,
  input: { assignmentId: string; leaseMs?: number }
) {
  return callTool("renewAssignment", input, ctx);
}

export async function revokeAssignment(ctx: RuntimeContext, input: { assignmentId: string }) {
  return callTool("revokeAssignment", input, ctx);
}

export async function orchestrateDisplay(
  ctx: RuntimeContext,
  input: Record<string, unknown>
) {
  return callTool("orchestrateDisplay", input, ctx);
}
