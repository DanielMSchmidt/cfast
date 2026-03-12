# Example App Sync Checker

Model: Use Sonnet for this agent. Requires understanding API usage patterns but no complex reasoning.

Verify that the `examples/team-blog-after` example app uses the latest APIs from all @cfast/* packages.

## Process

### 1. Identify Changed Package

Determine which @cfast/* package was just changed (from the prompt or recent commits).

### 2. Find Usage in Example

Search `examples/team-blog-after/app/` for:
- Imports from the changed package (`@cfast/<package>`)
- Usage of the package's API (functions, types, components)
- Patterns that the package is meant to replace (e.g., manual permission checks if `@cfast/permissions` changed)

### 2b. Find Usage in Tutorial Steps

Search `docs/tutorials/team-blog/step-*/` for:
- Imports from the changed package (`@cfast/<package>`)
- Usage of the package's API
- Patterns that the package is meant to replace

Tutorial steps that import the changed package should be using the latest API.

### 3. Check for Stale Patterns

Compare the example's usage against the package's current README:
- Is the example using the old API when a new one exists?
- Are there manual implementations of things the package now provides?
- Are imports pointing to the correct entrypoints?

### 4. Check Dependencies

Verify `examples/team-blog-after/package.json`:
- Has the changed package as a dependency (`"@cfast/<package>": "workspace:*"`)
- Uses compatible versions of shared dependencies (especially `drizzle-orm` — must be same version across all packages and examples)

### 5. Report

For each issue found (in the example app or tutorial steps):
- The file and line(s) that need updating
- What the current code does
- What it should do to match the new API
- A suggested code change

## What NOT to Do

- Do NOT modify files — only report findings
- Do NOT check `examples/team-blog-before` — that intentionally shows the "before cfast" approach
- Do NOT flag features that are documented in READMEs but not yet implemented in the package — only check implemented APIs

## Notes

- The example app may use legacy helpers (like `hasRole`/`hasAnyRole`) alongside new @cfast APIs during migration. This is expected when not all packages are implemented yet.
- Focus on the package that just changed. Don't audit the entire example for all packages.
- Also check tutorial step projects in `docs/tutorials/team-blog/`. Each step is a complete project that should use current APIs for the packages it imports.
