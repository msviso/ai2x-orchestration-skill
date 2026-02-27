const fs = require("node:fs");
const path = require("node:path");

function pad2(value) {
  return String(value).padStart(2, "0");
}

function buildInfo() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = pad2(now.getUTCMonth() + 1);
  const day = pad2(now.getUTCDate());
  const hours = pad2(now.getUTCHours());
  const minutes = pad2(now.getUTCMinutes());
  const seconds = pad2(now.getUTCSeconds());

  const buildDate = `${year}${month}${day}`;
  const buildTimestamp = `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  return { buildDate, buildTimestamp };
}

function writeBuildInfo() {
  const { buildDate, buildTimestamp } = buildInfo();
  const target = path.resolve(__dirname, "..", "src", "build-info.ts");
  const content = `// This file is generated at build time by scripts/write-build-info.cjs.\n` +
    `export const buildDate = "${buildDate}";\n` +
    `export const buildTimestamp = "${buildTimestamp}";\n`;
  fs.writeFileSync(target, content, "utf8");
}

writeBuildInfo();
