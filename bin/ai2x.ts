#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  claim_display,
  list_displays,
  push_content,
  renew_assignment,
  revoke_assignment
} from "../src/index.js";
import { buildDate } from "../src/build-info.js";
import { getCapabilities } from "../src/cli/capabilities.js";
import { getDefaultCtxPath, initCtx } from "../src/cli/init.js";
import { readJsonFile, safeJsonStringify } from "../src/cli/io.js";
import {
  validateClaimDisplayInput,
  validateCtx,
  validateJob,
  validateRenewAssignmentInput,
  validateRevokeAssignmentInput
} from "../src/cli/validate.js";
import type { ContentJob, RuntimeContext } from "../src/types/index.js";

const program = new Command();

function readPackageVersionSync(): string {
  try {
    const pkgPath = resolve(process.cwd(), "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function getEngineerVersion(): string {
  const base = readPackageVersionSync();
  return `${base}-eng.${buildDate}`;
}

function printJson(value: unknown) {
  process.stdout.write(safeJsonStringify(value) + "\n");
}

function redactToken(message: string, token?: string) {
  if (!token) return message;
  return message.split(token).join("[REDACTED]");
}

function exitWithError(message: string, code: number, token?: string) {
  process.stderr.write(redactToken(message, token) + "\n");
  process.exit(code);
}

program
  .name("ai2x")
  .description("AI2X Multi-Display Skill CLI")
  .version(getEngineerVersion())
  .showHelpAfterError();

program
  .command("get-capabilities")
  .description("Print skill capabilities without requiring ctx or token")
  .action(async () => {
    const caps = await getCapabilities();
    printJson(caps);
  });

program
  .command("init")
  .description("Initialize a ctx.json with tenant/user/token")
  .option(
    "--ctx <path>",
    `Path to ctx JSON (default: ${getDefaultCtxPath()})`
  )
  .option("--tenantId <id>", "Tenant ID (prompt if missing)")
  .option("--userId <id>", "User ID (prompt if missing)")
  .option("--userToken <token>", "User token (prompt if missing; avoid passing via args)")
  .option("--mcpBaseUrl <url>", "MCP base URL (prompt if missing)")
  .option("--overwrite", "Overwrite existing ctx.json")
  .action(async (opts) => {
    try {
      const result = await initCtx({
        ctxPath: opts.ctx,
        tenantId: opts.tenantId,
        userId: opts.userId,
        userToken: opts.userToken,
        mcpBaseUrl: opts.mcpBaseUrl,
        overwrite: Boolean(opts.overwrite)
      });

      if (!result.ok) {
        if (result.code === "CTX_EXISTS") {
          exitWithError("CTX_EXISTS", 2);
          return;
        }
        exitWithError(result.code, 1);
        return;
      }

      process.stdout.write(`ctx written: ${result.path}\n`);
      process.stdout.write(`userToken: [REDACTED len=${result.tokenLength}]\n`);
    } catch (error) {
      exitWithError((error as Error).message, 1);
    }
  });

program
  .command("list-displays")
  .description("List displays using a RuntimeContext JSON file")
  .requiredOption("--ctx <path>", "Path to ctx JSON")
  .action(async (opts) => {
    try {
      const ctx = await readJsonFile<RuntimeContext>(opts.ctx);
      const validation = validateCtx(ctx);
      if (!validation.ok) {
        printJson({ ok: false, errors: validation.errors });
        process.exit(2);
      }

      const result = await list_displays(ctx);
      printJson(result);
    } catch (error) {
      exitWithError((error as Error).message, 1);
    }
  });

program
  .command("claim-display")
  .description("Claim a display using ctx and a pairing code")
  .requiredOption("--ctx <path>", "Path to ctx JSON")
  .requiredOption("--pairCode <code>", "Pairing code")
  .option("--nickname <name>", "Optional display nickname")
  .option("--leaseMs <ms>", "Lease duration in milliseconds")
  .action(async (opts) => {
    let ctx: RuntimeContext | undefined;
    try {
      ctx = await readJsonFile<RuntimeContext>(opts.ctx);
      const ctxValidation = validateCtx(ctx);
      if (!ctxValidation.ok) {
        printJson({ ok: false, errors: ctxValidation.errors });
        process.exit(2);
      }

      let leaseMs: number | undefined;
      if (opts.leaseMs !== undefined) {
        leaseMs = Number(opts.leaseMs);
        if (!Number.isFinite(leaseMs) || leaseMs <= 0) {
          exitWithError("Invalid leaseMs (must be a positive number)", 2, ctx?.userToken);
          return;
        }
      }

      const input = {
        pairCode: String(opts.pairCode || "").trim(),
        ...(opts.nickname ? { nickname: String(opts.nickname).trim() } : {}),
        ...(leaseMs !== undefined ? { leaseMs: Math.round(leaseMs) } : {})
      };
      const inputValidation = validateClaimDisplayInput(input);
      if (!inputValidation.ok) {
        printJson({ ok: false, errors: inputValidation.errors });
        process.exit(2);
      }

      const result = await claim_display(ctx, input);
      printJson(result);
      process.exit(result.ok ? 0 : 1);
    } catch (error) {
      exitWithError((error as Error).message, 1, ctx?.userToken);
    }
  });

program
  .command("revoke-assignment")
  .description("Revoke an assignment using ctx and assignmentId")
  .requiredOption("--ctx <path>", "Path to ctx JSON")
  .requiredOption("--assignmentId <id>", "Assignment ID")
  .action(async (opts) => {
    let ctx: RuntimeContext | undefined;
    try {
      ctx = await readJsonFile<RuntimeContext>(opts.ctx);
      const ctxValidation = validateCtx(ctx);
      if (!ctxValidation.ok) {
        printJson({ ok: false, errors: ctxValidation.errors });
        process.exit(2);
      }

      const input = { assignmentId: String(opts.assignmentId || "").trim() };
      const inputValidation = validateRevokeAssignmentInput(input);
      if (!inputValidation.ok) {
        printJson({ ok: false, errors: inputValidation.errors });
        process.exit(2);
      }

      const result = await revoke_assignment(ctx, input);
      printJson(result);
      process.exit(result.ok ? 0 : 1);
    } catch (error) {
      exitWithError((error as Error).message, 1, ctx?.userToken);
    }
  });

program
  .command("renew-assignment")
  .description("Renew an assignment lease using ctx and assignmentId")
  .requiredOption("--ctx <path>", "Path to ctx JSON")
  .requiredOption("--assignmentId <id>", "Assignment ID")
  .option("--leaseMs <ms>", "Lease duration in milliseconds")
  .action(async (opts) => {
    let ctx: RuntimeContext | undefined;
    try {
      ctx = await readJsonFile<RuntimeContext>(opts.ctx);
      const ctxValidation = validateCtx(ctx);
      if (!ctxValidation.ok) {
        printJson({ ok: false, errors: ctxValidation.errors });
        process.exit(2);
      }

      let leaseMs: number | undefined;
      if (opts.leaseMs !== undefined) {
        leaseMs = Number(opts.leaseMs);
        if (!Number.isFinite(leaseMs) || leaseMs <= 0) {
          exitWithError("Invalid leaseMs (must be a positive number)", 2, ctx?.userToken);
          return;
        }
      }

      const input = {
        assignmentId: String(opts.assignmentId || "").trim(),
        ...(leaseMs !== undefined ? { leaseMs: Math.round(leaseMs) } : {})
      };
      const inputValidation = validateRenewAssignmentInput(input);
      if (!inputValidation.ok) {
        printJson({ ok: false, errors: inputValidation.errors });
        process.exit(2);
      }

      const result = await renew_assignment(ctx, input);
      printJson(result);
      process.exit(result.ok ? 0 : 1);
    } catch (error) {
      exitWithError((error as Error).message, 1, ctx?.userToken);
    }
  });

program
  .command("push-content")
  .description("Push content using ctx and job JSON files")
  .requiredOption("--ctx <path>", "Path to ctx JSON")
  .requiredOption("--job <path>", "Path to job JSON")
  .action(async (opts) => {
    try {
      const ctx = await readJsonFile<RuntimeContext>(opts.ctx);
      const job = await readJsonFile<ContentJob>(opts.job);

      const ctxValidation = validateCtx(ctx);
      const jobValidation = validateJob(job);
      if (!ctxValidation.ok || !jobValidation.ok) {
        printJson({
          ok: false,
          ctxErrors: ctxValidation.errors,
          jobErrors: jobValidation.errors
        });
        process.exit(2);
      }

      const result = await push_content(ctx, job);
      printJson(result);
    } catch (error) {
      exitWithError((error as Error).message, 1);
    }
  });

program
  .command("validate")
  .description("Validate ctx (and optional job) against schemas")
  .requiredOption("--ctx <path>", "Path to ctx JSON")
  .option("--job <path>", "Path to job JSON")
  .action(async (opts) => {
    try {
      const ctx = await readJsonFile<RuntimeContext>(opts.ctx);
      const ctxValidation = validateCtx(ctx);

      let jobValidation = { ok: true, errors: [] as unknown[] };
      if (opts.job) {
        const job = await readJsonFile<ContentJob>(opts.job);
        jobValidation = validateJob(job);
      }

      if (ctxValidation.ok && jobValidation.ok) {
        process.stdout.write("Validation passed.\n");
        process.exit(0);
      }

      printJson({ ok: false, ctxErrors: ctxValidation.errors, jobErrors: jobValidation.errors });
      process.exit(2);
    } catch (error) {
      exitWithError((error as Error).message, 1);
    }
  });

program.parseAsync(process.argv);
