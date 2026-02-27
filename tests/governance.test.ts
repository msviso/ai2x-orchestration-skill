import { describe, expect, it } from "vitest";
import { applyGovernance } from "../src/governance/sanitizer.js";
import type { RuntimeContext } from "../src/types/index.js";

describe("governance", () => {
  it("degrades high-risk content to alert", () => {
    const ctx: RuntimeContext = {
      requestId: "req-1",
      ownerScope: { tenantId: "t-1", userId: "u-1" },
      userToken: "token-1",
      uiContext: { environment: "public" }
    };

    const result = applyGovernance(ctx, "document.v2", {
      title: "Secrets",
      content: "API key: super-secret-token"
    });

    expect(result.degraded).toBe(true);
    expect(result.templateId).toBe("alert.v2");
  });

  it("adds body string when summarizing medium-risk content", () => {
    const ctx: RuntimeContext = {
      requestId: "req-2",
      ownerScope: { tenantId: "t-1", userId: "u-1" },
      userToken: "token-2",
      uiContext: { environment: "public" }
    };

    const longText = "a".repeat(900);
    const result = applyGovernance(ctx, "document.v2", {
      title: "Report",
      content: longText
    });

    expect(result.degraded).toBe(true);
    expect(result.templateId).toBe("document.v2");
    expect(typeof result.data.body).toBe("string");
    expect(String(result.data.body).length).toBeGreaterThan(0);
  });
});
