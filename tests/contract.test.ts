import { describe, expect, it } from "vitest";
import { validateSchemaById } from "../src/contracts/schemaMap.js";

describe("contracts", () => {
  it("validates runtime context", () => {
    const ctx = {
      requestId: "req-1",
      ownerScope: { tenantId: "t-1", userId: "u-1" },
      userToken: "token-1",
      uiContext: { environment: "public", locale: "en-US" }
    };
    const result = validateSchemaById("ctx", ctx);
    expect(result.ok).toBe(true);
  });

  it("validates normalized display", () => {
    const display = {
      assignmentId: "a-1",
      displayId: "d-1",
      nickname: "Lobby-1",
      status: "online"
    };
    const result = validateSchemaById("display", display);
    expect(result.ok).toBe(true);
  });

  it("validates content job", () => {
    const job = {
      target: { nickname: "Lobby-1" },
      slot: "primary",
      op: "REPLACE",
      templateId: "document.v2",
      data: { title: "Hi", content: "Hello" }
    };
    const result = validateSchemaById("contentJob", job);
    expect(result.ok).toBe(true);
  });
});
