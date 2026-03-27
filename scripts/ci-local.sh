#!/usr/bin/env bash
set -euo pipefail

# Local CI — mirrors .github/workflows/ci.yml
# Run this before merging when cloud CI tokens are unavailable.

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

step=0
total=10

run_step() {
  step=$((step + 1))
  echo -e "\n${BOLD}[$step/$total] $1${RESET}"
  shift
  if "$@"; then
    echo -e "${GREEN}  ✓ passed${RESET}"
  else
    echo -e "${RED}  ✗ failed${RESET}"
    exit 1
  fi
}

cd "$(dirname "$0")/.."

echo -e "${BOLD}=== cfast local CI ===${RESET}"

# ── Core CI job ──────────────────────────────────────────────
run_step "Install dependencies" \
  pnpm install --frozen-lockfile

run_step "Build" \
  pnpm turbo build

run_step "Typecheck" \
  pnpm turbo typecheck

run_step "Lint" \
  pnpm turbo lint

run_step "Unit tests" \
  pnpm turbo test

run_step "Build Storybook" \
  pnpm turbo build-storybook --filter=@cfast/ui

# ── Integration tests ───────────────────────────────────────
run_step "Integration tests" \
  pnpm --filter integration test

# ── E2E tests (per example) ─────────────────────────────────
E2E_EXAMPLES=(team-blog-before team-blog-after)

for example in "${E2E_EXAMPLES[@]}"; do
  # Ensure .dev.vars exists so Wrangler doesn't complain about missing secrets
  dev_vars="examples/$example/.dev.vars"
  if [ ! -f "$dev_vars" ]; then
    cat > "$dev_vars" <<'VARS'
MAILGUN_API_KEY=test-key
MAILGUN_DOMAIN=test.example.com
VARS
  fi

  run_step "E2E: $example — migrate D1 + run Playwright" \
    bash -c "
      pnpm --filter $example exec playwright install --with-deps chromium &&
      pnpm --filter $example db:migrate &&
      pnpm --filter $example test:e2e
    "
done

echo -e "\n${GREEN}${BOLD}All CI steps passed.${RESET}"
