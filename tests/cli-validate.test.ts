import { describe, expect, it } from "vitest";
import {
  validateClaimDisplayInput,
  validateCtx,
  validateJob,
  validateRenewAssignmentInput,
  validateRevokeAssignmentInput
} from "../src/cli/validate.js";
import type { ContentJob, RuntimeContext } from "../src/types/index.js";

describe("cli validate", () => {
  it("accepts valid ctx and job", () => {
    const ctx: RuntimeContext = {
      requestId: "req-1",
      ownerScope: { tenantId: "t-1", userId: "u-1" },
      userToken: "token-1",
      uiContext: { environment: "public" }
    };

    const job: ContentJob = {
      target: { nickname: "Lobby-1" },
      slot: "primary",
      op: "REPLACE",
      templateId: "document.v2",
      data: { title: "Hi", content: "Hello" }
    };

    const ctxResult = validateCtx(ctx);
    const jobResult = validateJob(job);

    expect(ctxResult.ok).toBe(true);
    expect(jobResult.ok).toBe(true);
  });

  it("accepts valid lifecycle inputs", () => {
    const claim = validateClaimDisplayInput({ pairCode: "PAIR-123", nickname: "Lobby" });
    const revoke = validateRevokeAssignmentInput({ assignmentId: "as-1" });
    const renew = validateRenewAssignmentInput({ assignmentId: "as-1" });

    expect(claim.ok).toBe(true);
    expect(revoke.ok).toBe(true);
    expect(renew.ok).toBe(true);
  });
});
