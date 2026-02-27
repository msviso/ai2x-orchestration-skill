const fs = require('node:fs');
const path = require('node:path');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const srcRoot = path.resolve(__dirname, '..', 'src', 'contracts');
const distRoot = path.resolve(__dirname, '..', 'dist', 'src', 'contracts');

if (!fs.existsSync(srcRoot)) {
  console.error('[copy-contracts] missing src/contracts');
  process.exit(1);
}

const files = walk(srcRoot).filter((p) => p.endsWith('.json'));
for (const file of files) {
  const rel = path.relative(srcRoot, file);
  const dest = path.join(distRoot, rel);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(file, dest);
}

console.log(`[copy-contracts] copied ${files.length} json files to dist`);
