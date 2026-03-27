#!/usr/bin/env bash
set -euo pipefail

# Local CI — mirrors .github/workflows/ci.yml
# Run this before merging when cloud CI tokens are unavailable.

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

step=0
total=7

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

run_step "Integration tests" \
  pnpm --filter integration test

echo -e "\n${GREEN}${BOLD}All CI steps passed.${RESET}"
