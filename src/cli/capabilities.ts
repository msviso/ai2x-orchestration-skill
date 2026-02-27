import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TEMPLATE_ALLOWLIST } from "../config/defaults.js";

export type Capabilities = {
  name: string;
  version: string;
  vendor: string;
  tools: Array<{ name: string; desc: string }>;
  templates: string[];
  governance: {
    defaultEnvironment: string;
    publicSafeByDefault: boolean;
    downgradeStrategy: string[];
  };
};

async function readPackageVersion(): Promise<string> {
  try {
    const pkgPath = resolve(process.cwd(), "package.json");
    const raw = await readFile(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function getCapabilities(): Promise<Capabilities> {
  const version = await readPackageVersion();
  return {
    name: "ai2x",
    version,
    vendor: "Microsense Vision Co., Ltd.",
    tools: [
      {
        name: "ai2x.list_displays",
        desc: "List displays available to the current user scope, returned in normalized shape."
      },
      {
        name: "ai2x.help",
        desc: "Provide onboarding help and support details for AI2X pairing and display setup."
      },
      {
        name: "ai2x.push_content",
        desc: "Resolve target display, validate template payload, apply governance, then push content via MCP."
      },
      {
        name: "ai2x.claim_display",
        desc: "Claim a display using a pairing code and return assignment details."
      },
      {
        name: "ai2x.revoke_assignment",
        desc: "Revoke an assignment by assignmentId."
      },
      {
        name: "ai2x.renew_assignment",
        desc: "Renew an assignment lease by assignmentId."
      }
    ],
    templates: [...TEMPLATE_ALLOWLIST],
    governance: {
      defaultEnvironment: "unknown",
      publicSafeByDefault: true,
      downgradeStrategy: ["summary", "alert_pointer", "workspace_pointer"]
    }
  };
}
