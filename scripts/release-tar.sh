#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "ERROR: Release tarball must be built on Linux to avoid SCHILY.* headers." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/ai2x-skill-release.tgz}"
STAGE="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGE"
}
trap cleanup EXIT

cd "$ROOT"

if [[ ! -f package-lock.json ]]; then
  npm install --package-lock-only --ignore-scripts
fi

if [[ ! -d dist ]]; then
  echo "ERROR: dist/ not found. Build first or commit prebuilt dist/." >&2
  exit 1
fi

mkdir -p "$STAGE/src/contracts/templates"
cp -a dist "$STAGE/"
cp -a package.json package-lock.json SKILL.md README.md "$STAGE/"
cp -a examples "$STAGE/"
cp -a src/contracts/templates/*.schema.json "$STAGE/src/contracts/templates/"

tar --sort=name --owner=0 --group=0 --numeric-owner -czf "$OUT" -C "$STAGE" .

echo "Release tarball written to: $OUT"
