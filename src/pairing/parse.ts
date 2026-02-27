export type PairingParseResult = {
  ok: boolean;
  version?: string;
  code?: string;
  did?: string;
  exp?: number;
  reason?: "INVALID_FORMAT" | "UNSUPPORTED_VERSION" | "EXPIRED";
};

const TEXT_FIELDS = ["text", "data", "rawValue", "decodedText", "value", "result"] as const;

type ScanLike =
  | string
  | string[]
  | {
      text?: unknown;
      data?: unknown;
      rawValue?: unknown;
      decodedText?: unknown;
      value?: unknown;
      result?: unknown;
      segments?: unknown;
      lines?: unknown;
    };

function joinLines(lines: unknown): string | null {
  if (!Array.isArray(lines)) return null;
  const items = lines.filter((item) => typeof item === "string") as string[];
  if (!items.length) return "";
  return items.join("\n");
}

export function normalizeScanInput(input: ScanLike | null | undefined): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    return input.filter((item) => typeof item === "string").join("\n");
  }
  if (!input || typeof input !== "object") return "";

  const segmented = joinLines((input as { segments?: unknown }).segments);
  if (segmented !== null) return segmented;

  const lined = joinLines((input as { lines?: unknown }).lines);
  if (lined !== null) return lined;

  for (const field of TEXT_FIELDS) {
    const value = (input as Record<string, unknown>)[field];
    if (typeof value === "string") return value;
    const joined = joinLines(value);
    if (joined !== null) return joined;
  }

  return "";
}

function extractPairLine(rawText: string): string | null {
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("AI2X-PAIR")) {
      return trimmed.trim();
    }
  }
  return null;
}

function parseTokens(line: string): Record<string, string> {
  const tokens = line.split(/\s+/);
  const pairs: Record<string, string> = {};
  for (const token of tokens.slice(1)) {
    const idx = token.indexOf("=");
    if (idx <= 0) continue;
    const key = token.slice(0, idx).trim();
    const value = token.slice(idx + 1).trim();
    if (!key) continue;
    pairs[key] = value;
  }
  return pairs;
}

function parseExp(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const exp = Number.parseInt(value, 10);
  if (!Number.isFinite(exp)) return undefined;
  return exp;
}

function parseFallbackCode(rawText: string): string | undefined {
  const match = rawText.match(/(?:^|\s)code=([^\s]+)/);
  return match?.[1];
}

export function parseAi2xPairV1(rawText: string): PairingParseResult {
  const pairLine = extractPairLine(rawText);
  if (!pairLine) {
    const fallbackCode = parseFallbackCode(rawText.trim());
    if (fallbackCode) {
      return { ok: true, version: "1", code: fallbackCode };
    }
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  const tokens = parseTokens(pairLine);
  const version = tokens.v;
  const code = tokens.code;
  const did = tokens.did;
  const exp = parseExp(tokens.exp);

  if (!version || !code) {
    return { ok: false, reason: "INVALID_FORMAT", version };
  }
  if (version !== "1") {
    return { ok: false, reason: "UNSUPPORTED_VERSION", version };
  }

  if (typeof exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) {
      return { ok: false, reason: "EXPIRED", version, code, did, exp };
    }
  }

  return { ok: true, version, code, did, exp };
}

export function parsePairingFromScan(input: ScanLike | null | undefined): PairingParseResult {
  const normalized = normalizeScanInput(input);
  return parseAi2xPairV1(normalized);
}
