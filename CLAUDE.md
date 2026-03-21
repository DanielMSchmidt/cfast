# cfast

Composable TypeScript libraries for building web apps on Cloudflare Workers + React Router 7.

## Stack

- **Runtime:** Cloudflare Workers
- **Framework:** React Router v7 (file-based routing)
- **Database:** Cloudflare D1 via Drizzle ORM
- **Auth:** Better Auth (magic email + passkeys)
- **Email:** Mailgun via react-email
- **Storage:** Cloudflare R2
- **UI:** Plugin-based (ships with MUI Joy UI)
- **Monorepo:** pnpm workspaces + Turborepo

## Monorepo Structure

```
packages/
├── env/           # Type-safe Cloudflare bindings with runtime validation
├── permissions/   # Isomorphic permission system (~3KB, no server deps)
├── db/            # Permission-aware Drizzle queries (lazy Operations)
├── auth/          # Better Auth integration (magic email + passkeys)
├── storage/       # Schema-driven R2 file uploads
├── actions/       # Multi-action routes with permission-aware client hooks
├── forms/         # Auto-generated forms from Drizzle schema
├── ui/            # Permission-aware component library (headless + Joy UI)
├── pagination/    # Cursor-based, offset-based pagination hooks
├── email/         # Workers-native email with react-email templates
├── admin/         # Auto-generated admin panel from Drizzle schema
├── core/          # Optional plugin-based app composition layer
└── create-cfast/  # Project scaffolder (npm create cfast@latest)
examples/          # Reference apps (team-blog-before, team-blog-after)
docs/              # Documentation site (Astro) + tutorials
tests/             # Integration tests
```

## Core Design Principles

These principles are non-negotiable — all code, examples, and tests must follow them:

1. **Permissions are first-class.** Define once with `@cfast/permissions`, enforce in the DB with `@cfast/db`, reflect in the UI with `@cfast/actions` + `@cfast/ui`. Zero duplication.
2. **The database drives the UI.** Drizzle schema is the single source of truth. Forms, admin panels, validation derive from it.
3. **Common patterns, not configuration.** Multi-action routes, pagination, auth, role management — solved once, imported.
4. **Operations are lazy.** `db.query(posts).findMany()` returns an `Operation`, not a promise. Inspect `.permissions` before calling `.run()`.
5. **Isomorphic types.** Same permission definitions, validation rules, and data types on client and server.

## Key Conventions

- Permissions flow: `definePermissions()` → `resolveGrants()` → `createDb({ grants })` → DB enforces → UI reflects
- Never manually check permissions in route handlers — the DB layer handles it
- Use `can(grants, action, table)` for quick grant-level boolean checks (not `hasRole`/`hasAnyRole`)
- Use `@cfast/actions` with `createAction`/`composeActions` — not raw React Router action functions
- Use `<ActionForm>` to inject hidden fields — not manual `<input type="hidden">` elements
- Forms are schema-derived via `@cfast/forms` — customize with field overrides, don't rewrite
- Use `@cfast/db` operations — never raw Drizzle queries (except via `db.unsafe()` for system tasks)
- `Operation.run()` params are optional (default `{}`)
- Use `composeSequential(ops)` when operations have no data dependencies
- Use `createAdminAuth(getAuth)` to bridge auth → admin (not manual adapter boilerplate)
- Auth is pre-configured via `@cfast/auth` — use `requireUser()` for protected routes
- File uploads go through `@cfast/storage` with schema-defined file types

## Anti-Patterns

| Instead of... | Do this |
|---|---|
| Manual permission checks in loaders/actions | Define grants in permissions — DB enforces them |
| `hasRole()` / `hasAnyRole()` | `can()` from `@cfast/permissions` |
| Raw Drizzle `db.select()`/`db.insert()` | `@cfast/db` operations (permission-aware) |
| Raw React Router `action` functions | `createAction` + `composeActions` from `@cfast/actions` |
| Manual `<input type="hidden">` in forms | `<ActionForm>` from `@cfast/actions/client` |
| Hand-writing full form markup | `@cfast/forms` with schema derivation + field overrides |
| Custom auth middleware | `requireUser()` / `requireAuthContext()` from `@cfast/auth` |
| Manual admin auth adapter (~150 lines) | `createAdminAuth(getAuth)` from `@cfast/auth` |
| Custom file upload endpoints | `@cfast/storage` with schema-defined file types |
| `compose` with no data dependencies | `composeSequential(ops)` |
| `composed.client` from `.server` import | `clientDescriptor()` from `@cfast/actions/client` |

## React Router Server/Client Boundary

Route files are split by React Router into server and client bundles. `.server` imports are **only safe** when they're exclusively referenced in server exports (`loader`, `action`).

**Never** create a module-level variable from a `.server` import and then use it in both a server export and the component:

```ts
// BAD — `composed` bridges server import into client code
import { composeActions } from "~/actions.server";
const composed = composeActions({ ... });
export const action = composed.action;   // server
// ...
useActions(composed.client);              // client — breaks build
```

Instead, inline the `.server` usage in the server export and use `clientDescriptor()` from `@cfast/actions/client` for client code:

```ts
// GOOD — .server import only referenced in `action` export
import { composeActions } from "~/actions.server";
import { clientDescriptor } from "@cfast/actions/client";

const client = clientDescriptor(["create", "delete"]);
export const action = composeActions({ create, delete }).action;
// ...
useActions(client);
```

The same rule applies to any `.server` module — only reference it inside `loader`/`action` exports, never at module scope if the result flows into client code.

## Commands

```bash
pnpm install          # Install all workspaces
pnpm dev              # Dev mode (all packages)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm typecheck        # Full typecheck across monorepo
pnpm publish-packages # Build + lint + test + changesets + publish
```

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
