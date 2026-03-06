# CFast

Composable TypeScript libraries for Cloudflare Workers + React Router + Drizzle ORM.

## Stack

- Runtime: Cloudflare Workers (no Node.js APIs — no `Buffer`, `fs`, `crypto.randomBytes`, `process`)
- Framework: React Router v7+ (file-based routing, SSR on Workers)
- DB: Cloudflare D1 via Drizzle ORM (SQLite dialect)
- Auth: Better Auth (magic email + passkeys)
- UI: MUI Joy UI
- Monorepo: pnpm workspaces + turborepo

## Packages

`@cfast/env`, `@cfast/permissions`, `@cfast/auth`, `@cfast/db`, `@cfast/storage`, `@cfast/actions`, `@cfast/ui`, `@cfast/forms`, `@cfast/pagination`, `@cfast/admin`, `@cfast/email`, `create-cfast`. Each has a README.md with the full vision and planned API — read it before touching the package.

## Rules

### Workers Compatibility
- Never use Node.js built-ins. Use Web APIs (`fetch`, `crypto.randomUUID()`, `TextEncoder`, `Response`, `Request`).
- Never use `setTimeout`/`setInterval` outside of scheduled handlers.
- All code must run in the Workers runtime. If unsure, check the Cloudflare Workers docs.

### Package Boundaries
- No circular dependencies. Dependency flow: `env` and `permissions` are leaves. `db`, `auth`, `actions`, `storage` depend on `permissions`. `ui` depends on `permissions` + `actions`. `forms` and `pagination` are independent. `admin` composes everything.
- Server-only code must never end up in client bundles. Use separate entrypoints (`/client` exports) when a package has both server and client code.
- Keep packages small. If a package does two unrelated things, split it.

### API Design
- Consistent patterns across packages: `createX()` for factory functions, `defineX()` for schema/config declarations, `useX()` for React hooks.
- All data crossing the server/client boundary must be JSON-serializable. TypeScript must enforce this at the type level.
- Errors are typed, not strings. Each package defines its own error classes extending a shared base.
- Options objects over positional arguments. Required fields are top-level, optional config goes in an `options` object.

### Dependencies
- Always use **caret ranges** (`^x.y.z`) for dependency versions, not pinned versions (e.g. `^7.12.0` not `7.12.0`).
- Exception: paired packages that must match exactly (e.g. `react-router` + `@react-router/dev`) — pin both and add a `// pinned: must match @react-router/dev` comment.
- When adding a dependency, check `pnpm outdated` first and use the latest version.
- The same dependency across multiple packages must use the same version range.
- Never use `*`, `>=`, or bare version numbers without `^`.

### Code Style
- Strict TypeScript. No `any`, no `as` casts except at the Workers env boundary (which `@cfast/env` eliminates).
- Prefer `type` over `interface` for public API types (they compose better).
- No classes in public APIs unless there's a strong reason. Prefer functions and plain objects.
- Named exports only. No default exports except in route files (React Router convention).

### Testing
- Test against D1/SQLite, not Postgres. Use `miniflare` or `wrangler dev` for integration tests.
- Unit tests for pure logic (permissions, validation). Integration tests for DB/auth/storage.
- Every public API function needs at least one test.

### README-Driven Development
- Each package README is the spec. Read it before implementing. Update it if the implementation diverges.
- New features start as README additions, not code.

## Agents

Use the custom agents in `.claude/agents/` for quality checks. Spawn them with the recommended model to save cost — the mechanical agents don't need Opus.

| Agent | Model | When to Run |
|---|---|---|
| `api-reviewer.md` | Sonnet | After adding/changing any public API |
| `workers-compat.md` | Haiku | After adding deps or writing code that might use Node.js APIs |
| `package-boundary.md` | Haiku | After changing dependencies between packages or adding exports |
| `readme-sync.md` | Sonnet | After implementing features to verify code matches documented API |
| `deps-checker.md` | Haiku | After adding/changing dependencies or periodically to check freshness |
| `example-sync.md` | Sonnet | After implementing/changing any @cfast/* package — verifies `examples/team-blog-after` uses the latest APIs |

## Commands

```bash
pnpm build          # Build all packages
pnpm dev            # Dev mode (watch)
pnpm test           # Run unit tests (vitest via turbo)
pnpm typecheck      # Type-check all packages
pnpm lint           # Lint all packages
```
