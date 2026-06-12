#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PINC Phase 3 — Preflight Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd src-tauri

echo "[ 1/6 ] Format check..."
cargo fmt --check
echo "✓ Format clean"

echo "[ 2/6 ] Lint (clippy)..."
cargo clippy -- -D warnings
echo "✓ No warnings"

echo "[ 3/6 ] Unit tests..."
cargo test 2>&1 | tee /tmp/pinc_test.txt
if grep -q "FAILED" /tmp/pinc_test.txt; then
  echo "✗ Tests failed"
  exit 1
fi
echo "✓ All unit tests passed"

echo "[ 4/6 ] Integration tests..."
cargo test --test integration
cargo test --test startup_failures
echo "✓ Integration tests passed"

echo "[ 5/6 ] Security audit..."
cargo audit
echo "✓ No vulnerabilities"

cd ..

echo "[ 6/6 ] TypeScript check..."
npx tsc --noEmit
echo "✓ No type errors"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ ALL CHECKS PASSED — ready to launch"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run: bun run tauri dev"
