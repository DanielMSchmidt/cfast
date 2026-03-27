#!/usr/bin/env bash
set -euo pipefail

# Local CI — mirrors .github/workflows/ci.yml
# Run this before merging when cloud CI tokens are unavailable.

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

step=0
total=13

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

# ── ci job ───────────────────────────────────────────────────
run_step "Install dependencies" \
  pnpm install --frozen-lockfile

run_step "Build, typecheck, lint & test" \
  pnpm turbo build typecheck lint test

run_step "Root-level tests" \
  pnpm test

run_step "Build Storybook" \
  pnpm turbo build-storybook --filter=@cfast/ui

run_step "Build docs" \
  pnpm turbo build --filter=@cfast/docs

run_step "Check docs for broken links" \
  bash -c '
    pnpm --filter @cfast/docs preview -- --port 4321 &
    SERVER_PID=$!
    trap "kill $SERVER_PID 2>/dev/null" EXIT
    timeout 30 bash -c "until curl -sf http://localhost:4321/cfast/ >/dev/null 2>&1; do sleep 1; done"
    npx linkinator http://localhost:4321/cfast/ --recurse --skip "^(?!http://localhost:4321)"
  '

# ── integration job ──────────────────────────────────────────
run_step "Integration tests" \
  pnpm --filter integration test

# ── e2e job (per example) ────────────────────────────────────
E2E_EXAMPLES=(team-blog-before team-blog-after)

for example in "${E2E_EXAMPLES[@]}"; do
  dev_vars="examples/$example/.dev.vars"
  if [ ! -f "$dev_vars" ]; then
    cat > "$dev_vars" <<'VARS'
MAILGUN_API_KEY=test-key
MAILGUN_DOMAIN=test.example.com
VARS
  fi

  run_step "E2E: $example" \
    bash -c "
      pnpm --filter $example exec playwright install --with-deps chromium &&
      pnpm --filter $example db:migrate &&
      pnpm --filter $example test:e2e
    "
done

# ── screenshots job ──────────────────────────────────────────
run_step "Install Playwright for docs" \
  pnpm --filter @cfast/docs exec npx playwright install --with-deps chromium

# Create .dev.vars for tutorial step projects
for step_dir in docs/tutorials/team-blog/step-*/; do
  if [ ! -f "$step_dir/.dev.vars" ]; then
    cat > "$step_dir/.dev.vars" <<'VARS'
MAILGUN_API_KEY=test-key
MAILGUN_DOMAIN=test.example.com
VARS
  fi
done

run_step "Capture tutorial screenshots" \
  pnpm docs:screenshots

echo -e "\n${GREEN}${BOLD}All CI steps passed.${RESET}"
