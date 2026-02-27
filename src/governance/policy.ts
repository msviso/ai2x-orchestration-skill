export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

const HIGH_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api\s*key/i,
  /apikey/i
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_PATTERN = /\+?\d[\d\s\-().]{7,}\d/;

export function classifyRisk(data: unknown): RiskLevel {
  const text = JSON.stringify(data || "");

  if (HIGH_PATTERNS.some((re) => re.test(text))) return "HIGH";
  if (EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text)) return "HIGH";

  if (text.length > 800) return "MEDIUM";
  if (/internal|confidential/i.test(text)) return "MEDIUM";

  return "LOW";
}
