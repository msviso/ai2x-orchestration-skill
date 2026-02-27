import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, chmod, mkdir, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { dirname, resolve } from "node:path";
import readline from "node:readline";

export type InitOptions = {
  ctxPath?: string;
  tenantId?: string;
  userId?: string;
  userToken?: string;
  mcpBaseUrl?: string;
  overwrite?: boolean;
};

export type InitResult =
  | { ok: true; path: string; tokenLength: number }
  | { ok: false; code: "CTX_EXISTS" | "ABORTED" };

export function getDefaultCtxPath(): string {
  if (platform() === "win32") {
    const appData = process.env.APPDATA || resolve(homedir(), "AppData", "Roaming");
    return resolve(appData, "ai2x", "ctx.json");
  }
  return resolve(homedir(), ".config", "ai2x", "ctx.json");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true, mode: 0o700 });
  if (platform() !== "win32") {
    await chmod(path, 0o700);
  }
}

async function promptLine(label: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  const output = (rl as any).output as NodeJS.WritableStream;
  const originalWrite = output.write.bind(output as any);
  let muted = false;

  if (hidden) {
    output.write = (chunk: string | Uint8Array): boolean => {
      if (!muted) {
        return originalWrite(chunk);
      }
      return true;
    };
  }

  const answer = await new Promise<string>((resolveAnswer) => {
    muted = hidden;
    rl.question(label, (value) => {
      resolveAnswer(value);
    });
  });

  if (hidden) {
    muted = false;
    originalWrite("\n");
  }

  rl.close();
  return answer.trim();
}

async function promptRequired(label: string, hidden = false): Promise<string> {
  while (true) {
    const value = await promptLine(label, hidden);
    if (value.length > 0) return value;
    process.stdout.write("Input required.\n");
  }
}

export async function initCtx(options: InitOptions): Promise<InitResult> {
  const ctxPath = resolve(options.ctxPath || getDefaultCtxPath());
  if (!options.overwrite && (await fileExists(ctxPath))) {
    return { ok: false, code: "CTX_EXISTS" };
  }

  const tenantId = options.tenantId || (await promptRequired("Tenant ID: "));
  const userId = options.userId || (await promptRequired("User ID: "));
  const userToken = options.userToken || (await promptRequired("User Token (hidden): ", true));
  const mcpBaseUrl =
    options.mcpBaseUrl ||
    (await promptRequired("MCP_BASE_URL (e.g. https://md-mcp-.../mcp): "));

  const ctx = {
    requestId: `ctx-${randomUUID()}`,
    ownerScope: { tenantId, userId },
    userToken,
    mcpBaseUrl,
    uiContext: {
      environment: "public",
      locale: "zh-TW",
      timezone: "Asia/Taipei"
    }
  };

  await ensureDir(dirname(ctxPath));
  await writeFile(ctxPath, `${JSON.stringify(ctx, null, 2)}\n`, { mode: 0o600 });
  if (platform() !== "win32") {
    await chmod(ctxPath, 0o600);
  }

  return { ok: true, path: ctxPath, tokenLength: userToken.length };
}
