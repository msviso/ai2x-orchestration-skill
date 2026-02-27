import { describe, expect, it } from "vitest";
import {
  normalizeScanInput,
  parseAi2xPairV1,
  parsePairingFromScan
} from "../src/pairing/parse.js";

describe("pairing scan parsing", () => {
  it("parses multi-line v1 protocol and ignores URL line", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const raw = `AI2X-PAIR v=1 code=PAIR-123 did=disp-9 exp=${exp}\nhttps://ai2x.link/install`;

    const result = parseAi2xPairV1(raw);

    expect(result.ok).toBe(true);
    expect(result.code).toBe("PAIR-123");
    expect(result.did).toBe("disp-9");
    expect(result.exp).toBe(exp);
  });

  it("parses from object text field", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const raw = `AI2X-PAIR v=1 code=PAIR-456 exp=${exp}\nhttps://ai2x.link/install`;

    const result = parsePairingFromScan({ text: raw });

    expect(result.ok).toBe(true);
    expect(result.code).toBe("PAIR-456");
  });

  it("parses from array of lines", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const lines = [
      `AI2X-PAIR v=1 code=PAIR-789 did=disp-1 exp=${exp}`,
      "https://ai2x.link/install"
    ];

    const result = parsePairingFromScan(lines);

    expect(result.ok).toBe(true);
    expect(result.code).toBe("PAIR-789");
    expect(result.did).toBe("disp-1");
  });

  it("returns EXPIRED when exp is in the past", () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    const raw = `AI2X-PAIR v=1 code=PAIR-OLD exp=${exp}`;

    const result = parseAi2xPairV1(raw);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("EXPIRED");
  });

  it("returns UNSUPPORTED_VERSION for unknown version", () => {
    const raw = "AI2X-PAIR v=9 code=PAIR-NEW";

    const result = parseAi2xPairV1(raw);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("UNSUPPORTED_VERSION");
  });

  it("normalizes segments and lines arrays", () => {
    const normalized = normalizeScanInput({
      lines: ["AI2X-PAIR v=1 code=PAIR-SEG", "https://ai2x.link/install"]
    });

    expect(normalized).toContain("AI2X-PAIR v=1 code=PAIR-SEG");
  });
});
