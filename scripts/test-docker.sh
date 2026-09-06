#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=========================================="
echo " Running Compatibility Tests in Docker"
echo "=========================================="

VERSIONS=("10" "12" "14" "16" "18" "20" "22")

for VER in "${VERSIONS[@]}"; do
  echo ""
  echo ">>> Testing in Node.js ${VER} (node:${VER}-alpine) <<<"
  docker run --rm \
    -v "${DIR}:/app" \
    -w /app \
    "node:${VER}-alpine" \
    node scripts/test-compat.cjs
done

echo ""
echo "=========================================="
echo " All Node.js versions passed successfully!"
echo "=========================================="
