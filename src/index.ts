import type {
  ClaimDisplayInput,
  ClaimDisplayResult,
  ContentJob,
  HelpResult,
  ListDisplaysResult,
  PushContentResult,
  RenewAssignmentInput,
  RenewAssignmentResult,
  RevokeAssignmentInput,
  RevokeAssignmentResult,
  RuntimeContext
} from "./types/index.js";
import { claimDisplayHandler } from "./handlers/claimDisplay.js";
import { helpHandler } from "./handlers/help.js";
import { listDisplaysHandler } from "./handlers/listDisplays.js";
import { pushContentHandler } from "./handlers/pushContent.js";
import { renewAssignmentHandler } from "./handlers/renewAssignment.js";
import { revokeAssignmentHandler } from "./handlers/revokeAssignment.js";
import { orchestrate_display as orchestrateDisplayHandler } from "./handlers/orchestrateDisplay.js";

export async function list_displays(ctx: RuntimeContext): Promise<ListDisplaysResult> {
  return listDisplaysHandler(ctx);
}

export async function help(ctx: RuntimeContext): Promise<HelpResult> {
  return helpHandler(ctx);
}

// Preferred: normalized planning + delivery via MCP orchestrateDisplay
export async function orchestrate_display(
  ctx: RuntimeContext,
  input: Record<string, unknown>
): Promise<any> {
  return orchestrateDisplayHandler(ctx, input);
}

export async function push_content(
  ctx: RuntimeContext,
  job: ContentJob
): Promise<PushContentResult> {
  return pushContentHandler(ctx, job);
}

export async function claim_display(
  ctx: RuntimeContext,
  input: ClaimDisplayInput
): Promise<ClaimDisplayResult> {
  return claimDisplayHandler(ctx, input);
}

export async function revoke_assignment(
  ctx: RuntimeContext,
  input: RevokeAssignmentInput
): Promise<RevokeAssignmentResult> {
  return revokeAssignmentHandler(ctx, input);
}

export async function renew_assignment(
  ctx: RuntimeContext,
  input: RenewAssignmentInput
): Promise<RenewAssignmentResult> {
  return renewAssignmentHandler(ctx, input);
}
