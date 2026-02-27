import { validateSchemaById, validateTemplate } from "../contracts/schemaMap.js";
import type {
  ClaimDisplayInput,
  ContentJob,
  RenewAssignmentInput,
  RevokeAssignmentInput,
  RuntimeContext
} from "../types/index.js";

export function validateCtx(ctx: RuntimeContext) {
  const result = validateSchemaById("ctx", ctx);
  return { ok: result.ok, errors: result.errors };
}

export function validateJob(job: ContentJob) {
  const base = validateSchemaById("contentJob", job);
  if (!base.ok) return { ok: false, errors: base.errors };

  const templateCheck = validateTemplate(job.templateId, job.data);
  if (!templateCheck.ok) {
    return { ok: false, errors: templateCheck.errors };
  }

  return { ok: true, errors: [] as unknown[] };
}

export function validateClaimDisplayInput(input: ClaimDisplayInput) {
  const result = validateSchemaById("claimDisplayInput", input);
  return { ok: result.ok, errors: result.errors };
}

export function validateRevokeAssignmentInput(input: RevokeAssignmentInput) {
  const result = validateSchemaById("revokeAssignmentInput", input);
  return { ok: result.ok, errors: result.errors };
}

export function validateRenewAssignmentInput(input: RenewAssignmentInput) {
  const result = validateSchemaById("renewAssignmentInput", input);
  return { ok: result.ok, errors: result.errors };
}
