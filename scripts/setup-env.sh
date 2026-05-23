#!/usr/bin/env bash
# Usage: ./scripts/setup-env.sh
# Copies all .env.example → .env if .env doesn't already exist

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

copy_if_missing() {
  local example="$1"
  local target="${example%.example}"
  if [[ -f "$target" ]]; then
    echo "  ⏭  $target already exists, skipping"
  else
    cp "$example" "$target"
    echo "  ✅ Created $target — fill in your values"
  fi
}

echo "🔧 Setting up environment files..."
echo ""

echo "📦 Backend (apps/api):"
copy_if_missing "$ROOT_DIR/apps/api/.env.example"

echo ""
echo "🌐 Frontend (apps/web):"
copy_if_missing "$ROOT_DIR/apps/web/.env.example"

echo ""
echo "☁️  Infrastructure (infra):"
if [[ -f "$ROOT_DIR/infra/terraform.tfvars.example" ]]; then
  copy_if_missing "$ROOT_DIR/infra/terraform.tfvars.example"
else
  echo "  ⏭  No terraform.tfvars.example found, skipping"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done! Next steps:"
echo "  1. Open each .env file and paste your real values"
echo "  2. Run 'docker compose up -d' to start PostgreSQL"
echo "  3. Run 'bun run --filter api db:migrate'"
echo "  4. Run 'bun run --filter api db:seed'"
echo "  5. Run 'bun run dev' to start the app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
