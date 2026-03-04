import { describe, expect, it } from "vitest";
import { normalizeDisplays } from "../src/mcp/normalize.js";
import { validateSchemaById } from "../src/contracts/schemaMap.js";

describe("normalizeDisplays", () => {
  it("normalizes listDisplays response", () => {
    const envelope = {
      ok: true,
      tool: "listDisplays",
      result: {
        count: 1,
        devices: [
          {
            assignmentId: "a-123",
            deviceId: "d-123",
            nickname: "Lobby-1",
            status: "online",
            trustTier: "secure",
            assignmentMeta: { defaultEnvironment: "private" }
          }
        ]
      },
      ts: 1730000000000
    };

    const output = normalizeDisplays(envelope);
    expect(output.length).toBe(1);
    expect(output[0].assignmentId).toBe("a-123");
    expect(output[0].nickname).toBe("Lobby-1");
    expect(output[0].environment).toBe("private");

    const validation = validateSchemaById("display", output[0]);
    expect(validation.ok).toBe(true);
  });
});
