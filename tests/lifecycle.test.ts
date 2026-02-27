import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimDisplayHandler } from "../src/handlers/claimDisplay.js";
import { renewAssignmentHandler } from "../src/handlers/renewAssignment.js";
import { revokeAssignmentHandler } from "../src/handlers/revokeAssignment.js";
import * as mcpTools from "../src/mcp/tools.js";
import type { RuntimeContext } from "../src/types/index.js";

const ctx: RuntimeContext = {
  requestId: "req-1",
  ownerScope: { tenantId: "t-1", userId: "u-1" },
  userToken: "token-1",
  uiContext: { environment: "public" }
};

describe("lifecycle handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns deterministic claim_display shape without leaking token", async () => {
    vi.spyOn(mcpTools, "claimDisplay").mockResolvedValue({
      ok: true,
      result: { assignmentId: "a-1", nickname: "Lobby-1", deviceId: "d-1" }
    });

    const result = await claimDisplayHandler(ctx, { pairCode: "PAIR-123" });

    expect(result.ok).toBe(true);
    expect(result.assignmentId).toBe("a-1");
    expect(JSON.stringify(result)).not.toContain(ctx.userToken);
  });

  it("returns deterministic revoke_assignment shape", async () => {
    vi.spyOn(mcpTools, "revokeAssignment").mockResolvedValue({ ok: true, result: {} });

    const result = await revokeAssignmentHandler(ctx, { assignmentId: "a-1" });

    expect(result.ok).toBe(true);
    expect(result.assignmentId).toBe("a-1");
  });

  it("returns deterministic renew_assignment shape without leaking token", async () => {
    vi.spyOn(mcpTools, "renewAssignment").mockResolvedValue({
      ok: true,
      result: { leaseUntil: "2026-01-31T00:00:00Z" }
    });

    const result = await renewAssignmentHandler(ctx, { assignmentId: "a-1" });

    expect(result.ok).toBe(true);
    expect(result.assignmentId).toBe("a-1");
    expect(JSON.stringify(result)).not.toContain(ctx.userToken);
  });
});
