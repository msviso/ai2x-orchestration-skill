import { beforeEach, describe, expect, it, vi } from "vitest";
import { pushContentHandler } from "../src/handlers/pushContent.js";
import * as listDisplaysModule from "../src/handlers/listDisplays.js";
import * as schemaMap from "../src/contracts/schemaMap.js";
import * as sanitizer from "../src/governance/sanitizer.js";
import * as mcpTools from "../src/mcp/tools.js";
import type { RuntimeContext } from "../src/types/index.js";

describe("pushContentHandler environment awareness", () => {
  const ctx: RuntimeContext = {
    requestId: "req-1",
    ownerScope: { tenantId: "tenant", userId: "user" },
    userToken: "token",
    uiContext: { environment: "public" }
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers display metadata environment when available", async () => {
    vi.spyOn(listDisplaysModule, "listDisplaysHandler").mockResolvedValue({
      ok: true,
      displays: [
        {
          assignmentId: "as-1",
          nickname: "Ops",
          environment: "private"
        }
      ]
    } as any);

    vi.spyOn(schemaMap, "validateTemplate").mockReturnValue({ ok: true });

    let governanceEnv: string | undefined;
    vi.spyOn(sanitizer, "applyGovernance").mockImplementation((ctxArg, templateId, data) => {
      governanceEnv = ctxArg.uiContext?.environment;
      return { templateId, data: data as Record<string, unknown>, degraded: false };
    });

    const pushSpy = vi.spyOn(mcpTools, "pushContent").mockResolvedValue({ ok: true } as any);

    const result = await pushContentHandler(ctx, {
      target: { assignmentId: "as-1" },
      slot: "primary",
      op: "REPLACE",
      templateId: "document.v2",
      data: { title: "hello", body: "world" }
    });

    expect(result.ok).toBe(true);
    expect(governanceEnv).toBe("private");
    expect(pushSpy).toHaveBeenCalledTimes(1);
    const ctxPassed = pushSpy.mock.calls[0][0] as RuntimeContext;
    expect(ctxPassed.uiContext?.environment).toBe("private");
  });
});
