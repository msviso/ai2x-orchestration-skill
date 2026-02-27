import { readFile } from "node:fs/promises";

export async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}`);
  }
}

export function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet();
  const redactedKeys = new Set(["userToken"]);

  return JSON.stringify(
    value,
    (key, val) => {
      if (redactedKeys.has(key)) return "***REDACTED***";
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val as object);
      }
      return val;
    },
    2
  );
}
