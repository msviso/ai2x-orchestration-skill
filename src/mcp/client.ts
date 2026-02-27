import { fetch } from "undici";
import { getMcpBaseUrl } from "../config/env.js";
import type { RuntimeContext } from "../types/index.js";

function buildUrl(base: string, path: string) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export async function callTool(tool: string, input: Record<string, unknown>, ctx: RuntimeContext) {
  const baseUrl = getMcpBaseUrl(ctx);
  const url = buildUrl(baseUrl, "/tools/call");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-token": ctx.userToken
    },
    body: JSON.stringify({ tool, input })
  });

  const bodyText = await res.text();
  let body: unknown = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = { ok: false, error: "INVALID_JSON", message: "Non-JSON response" };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: "HTTP_ERROR",
      message: `MCP responded with ${res.status}`,
      status: res.status,
      body
    };
  }

  return body;
}
