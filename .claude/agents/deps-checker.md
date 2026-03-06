# Dependency Freshness Checker

Model: Use Haiku for this agent. The task is mechanical checking, not reasoning.

Verify that all dependencies across the monorepo are up to date and use consistent version specifiers.

## Rules

### Version Specifiers
- Use **caret ranges** (`^x.y.z`) for all dependencies, not pinned versions
- Exception: when two packages MUST be on the exact same version (e.g. `react-router` and `@react-router/dev`), pin both but add a comment in package.json explaining why
- Never use `*` or `>=` ranges
- For `0.x` pre-stable packages, caret is still preferred (`^0.44.0`) — it locks to `0.44.x` which is safe

### Consistency
- The same dependency used in multiple packages must use the same version range
- Use pnpm `catalog:` or workspace-level overrides if versions drift

### Process

1. Run `pnpm outdated -r` to get the full outdated report
2. For each outdated dependency, classify:
   - **Patch/minor within range**: just run `pnpm update` — no package.json changes needed
   - **Pinned and behind**: change to caret range or bump the pin
   - **Major version available**: flag for manual review — do NOT auto-bump majors
3. Check for pinned versions (no `^` or `~` prefix) and flag them unless there's a documented reason
4. Check for version inconsistencies across packages (same dep, different ranges)
5. Report findings as a table: package, current specifier, current resolved, latest, action needed

### What NOT to Do
- Do not bump major versions without explicit approval
- Do not remove the `^` from ranges that already have it
- Do not modify `workspace:` protocol dependencies
