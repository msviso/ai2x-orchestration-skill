import { URL } from "node:url";
import type { RuntimeContext } from "../types/index.js";

function normalizeUrl(raw: string): string {
  if (!raw.trim()) throw new Error("MCP_BASE_URL is required");
  if (!/^https?:\/\//i.test(raw)) {
    throw new Error("MCP_BASE_URL must start with http:// or https://");
  }
  const url = new URL(raw);
  return url.toString().replace(/\/+$/, "");
}

/**
 * Resolve MCP base url.
 * Priority: ctx.mcpBaseUrl -> env MCP_BASE_URL.
 */
export function getMcpBaseUrl(ctx?: RuntimeContext): string {
  const fromCtx = String(ctx?.mcpBaseUrl || "").trim();
  if (fromCtx) return normalizeUrl(fromCtx);
  const raw = process.env.MCP_BASE_URL || "";
  return normalizeUrl(raw);
}
