# {{projectName}}

Built with [cfast](https://github.com/DanielMSchmidt/cfast) — Cloudflare Workers + React Router 7 + Drizzle ORM + D1.

## Architecture

- **Runtime:** Cloudflare Workers
- **Framework:** React Router v7 (file-based routing)
- **Database:** Cloudflare D1 via Drizzle ORM
- **Auth:** @cfast/auth (Better Auth — magic email + passkeys)
- **Permissions:** @cfast/permissions (isomorphic, DB-enforced)
- **UI:** @cfast/ui + @cfast/forms (schema-derived)

## Key Conventions

### Permissions are DB-enforced — never check manually in route handlers

Permissions are defined once in `app/permissions.ts` and enforced automatically by `@cfast/db`.
Do NOT add manual permission checks in loaders/actions. The DB layer rejects unauthorized queries.

### Use @cfast/actions for route actions

Actions are defined in `app/actions.server.ts` using `createAction` and composed with `composeActions`.
Do NOT use raw React Router `action` functions with manual request parsing.

### Forms are schema-derived

Use `@cfast/forms` to generate forms from Drizzle schema columns.
Customize with field overrides — do NOT rewrite forms from scratch.

### Use @cfast/db for all database operations

`@cfast/db` wraps Drizzle with permission-aware, lazy queries.
Do NOT use raw Drizzle `db.select()` / `db.insert()` calls directly.

### Auth is pre-configured

Use `requireUser(request)` or `requireAuthContext(request)` from `~/auth.helpers.server` for protected routes.
Do NOT build custom auth flows.

### File uploads use @cfast/storage

Schema-defined file types with R2 storage. Do NOT write custom upload handlers.

## Common Tasks

### Add a new entity

1. Define the table in `app/db/schema.ts` (Drizzle `sqliteTable`)
2. Run `pnpm db:generate` then `pnpm db:migrate:local`
3. Add permission grants in `app/permissions.ts`
4. Create actions in a `*.server.ts` file using `createAction` from `~/actions.server`
5. Create the route in `app/routes/` using `composeActions` for the action export

### Add a new page/route

1. Create a file in `app/routes/` (React Router file-based routing)
2. Export a `loader` for data fetching, `action` via `composeActions` for mutations
3. Export a default component for the UI

### Add a new action to an existing route

1. Define the action with `createAction` in the route's `*.server.ts` file
2. Add it to the existing `composeActions` call
3. Use `<ActionButton>` or a form with the action's `intent` hidden field in the UI

### Add a table to the admin panel

1. Import the table from `~/db/schema` in `app/admin.server.ts`
2. Add it to the `schema` object in the admin config
3. Optionally add dashboard widgets in the `dashboard.widgets` array

### Customize form fields

Use field overrides when calling the form generator:
```ts
// Override specific fields, keep the rest auto-generated
{ fields: { title: { label: "Item Name", placeholder: "Enter name..." } } }
```

## Anti-Patterns — Do NOT Do These

| Instead of... | Do this |
|---|---|
| Manual permission checks in loaders/actions | Define grants in `permissions.ts` — DB enforces them |
| `<PermissionGate>` with custom logic | Use `<PermissionGate>` with the grant system or action permission status |
| Raw Drizzle `db.select()`/`db.insert()` | Use `@cfast/db` operations (permission-aware) |
| Raw SQL queries | Use `@cfast/db` operations |
| Custom auth middleware or flows | Use `requireUser()` / `requireAuthContext()` from `~/auth.helpers.server` |
| Hand-writing full form markup | Use `@cfast/forms` with schema derivation + field overrides |
| Custom file upload endpoints | Use `@cfast/storage` with schema-defined file types |
| Manual `request.formData()` parsing in actions | Use `createAction` which handles parsing, validation, and permissions |
| `hasRole()` / `hasAnyRole()` checks | Use `can()` from `@cfast/permissions` to check permissions |
| Manually adding hidden `<input>` fields to forms | Use `<ActionForm>` which injects hidden fields (e.g. `intent`) automatically |

## Project Structure

```
app/
├── routes/             # React Router file-based routes
├── db/
│   ├── schema.ts       # Drizzle schema (source of truth)
│   └── client.ts       # DB client factory
├── permissions.ts      # Permission definitions
├── auth.helpers.server.ts  # Auth utilities (requireUser, etc.)
├── auth.setup.server.ts    # Auth initialization
├── cfast.server.ts     # App context setup
├── actions.server.ts   # Shared action factory
├── env.ts              # Type-safe env bindings
└── root.tsx            # App root layout
workers/
└── app.ts              # Cloudflare Worker entry point
wrangler.toml           # Cloudflare config (D1, KV, R2 bindings)
drizzle.config.ts       # Drizzle Kit config
```

## Commands

```bash
pnpm dev                    # Start local dev server
pnpm build                  # Production build
pnpm db:generate            # Generate migrations from schema changes
pnpm db:migrate:local       # Apply migrations locally
pnpm db:migrate:remote      # Apply migrations to remote D1
pnpm deploy:staging         # Deploy to staging
pnpm deploy:production      # Deploy to production
```

## Keeping LLM Documentation Updated

When adding or changing public APIs in any `@cfast` package:
- Update the package's `llms.txt` with the new/changed API signatures, examples, and integration notes
- Update the root `llms.txt` (concise overview) and `llms-full.txt` (complete reference) if the change affects cross-package patterns or the mental model
- The scaffolded `CLAUDE.md` (this file's template in `create-cfast`) should be updated if conventions change

## Package Documentation

For detailed API reference on any cfast package, check:
`node_modules/@cfast/[package]/llms.txt`

Available packages: `@cfast/env`, `@cfast/permissions`, `@cfast/auth`, `@cfast/db`,
`@cfast/actions`, `@cfast/ui`, `@cfast/forms`, `@cfast/pagination`, `@cfast/storage`,
`@cfast/email`, `@cfast/admin`.
