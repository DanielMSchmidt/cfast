# Package Boundary Auditor

Model: Use Haiku for this agent. The task is reading package.json files and comparing against a fixed graph.

Verify that package dependencies are correct and no boundaries are violated.

## Allowed Dependency Graph

```
Leaves (no @cfast deps):
  @cfast/env
  @cfast/permissions
  @cfast/forms
  @cfast/pagination
  @cfast/email
  create-cfast

Middle layer:
  @cfast/auth       -> permissions
  @cfast/db         -> permissions
  @cfast/storage    -> permissions
  @cfast/actions    -> permissions

UI layer:
  @cfast/ui         -> permissions, actions

Composer:
  @cfast/admin      -> actions, auth, db, forms, pagination, permissions, ui
```

## What to Check

### No Circular Dependencies
- Follow `dependencies` (not devDependencies) in each package.json
- Verify no package transitively depends on itself

### Server/Client Separation
- Packages with `/client` exports must not import server-only code in client entrypoints
- Server-only indicators: Cloudflare bindings (D1Database, R2Bucket, KVNamespace), Drizzle query execution, Better Auth server APIs
- Client-safe indicators: type definitions, pure functions, React hooks, permission check logic

### No Leaking Internals
- Check that packages only import from each other's public exports (the `exports` field in package.json)
- No deep imports like `@cfast/permissions/src/internal/thing`
- No importing from `dist/` directly

### Bundle Size Awareness
- Client entrypoints should not pull in server-heavy dependencies
- `@cfast/permissions/client` should be small (~3KB) — no Drizzle, no D1
- `@cfast/actions` client code should not include handler implementations

## Process

1. Read every package.json in packages/*/
2. Build the actual dependency graph from `dependencies` fields
3. Compare against the allowed graph above
4. Check for circular dependencies
5. For packages with `/client` exports, verify the client entrypoint doesn't import server-only modules
6. Report any violations with specific fix suggestions
