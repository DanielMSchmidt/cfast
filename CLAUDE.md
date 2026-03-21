# cfast

## CI

Fix all CI failures including unrelated ones — do not leave the build broken.

## LLM Documentation

This project ships `llms.txt` files for LLM consumption:
- Root `llms.txt` — concise project overview
- Root `llms-full.txt` — complete API reference
- Per-package `packages/*/llms.txt` — focused per-package docs
- Scaffolded `CLAUDE.md` — template in `packages/create-cfast/templates/base/CLAUDE.md`

When adding or changing public APIs:
1. Update the affected package's `llms.txt`
2. Update root `llms.txt` and `llms-full.txt` if cross-package patterns change
3. Update the CLAUDE.md template if conventions change
