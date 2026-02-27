const { access, chmod } = require("node:fs/promises");
const { join } = require("node:path");

const isWindows = process.platform === "win32";

async function chmodIfExists(path) {
  try {
    await access(path);
    await chmod(path, 0o755);
  } catch {
    // Ignore missing or permission errors to keep install resilient.
  }
}

async function fixBinPerms() {
  if (isWindows) return;
  const binDir = join(process.cwd(), "node_modules", ".bin");
  const candidates = [
    join(binDir, "tsc"),
    join(binDir, "vitest")
  ];

  for (const file of candidates) {
    await chmodIfExists(file);
  }
}

fixBinPerms().catch(() => process.exit(0));
