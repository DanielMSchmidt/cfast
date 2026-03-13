# Integration Tests Design

## Summary

Add 62 integration tests across 7 domains using `@cloudflare/vitest-pool-workers` to test real Cloudflare bindings (D1, KV, R2) inside the Workers runtime. Tests live in a single top-level `tests/integration/` workspace package with per-domain vitest projects. Runs in CI on every PR.

## Decisions

- **Runtime**: `@cloudflare/vitest-pool-workers` — tests execute inside the Workers runtime for maximum fidelity
- **Structure**: Single workspace package, multiple vitest projects (one per domain)
- **CI**: New `integration` job in `.github/workflows/ci.yml`, runs after `ci` job passes
- **Isolation**: Each domain gets its own `wrangler.toml` with exactly the bindings it needs

## Directory Structure

```
tests/integration/
├── package.json
├── vitest.config.ts          # multi-project config
├── tsconfig.json
├── wrangler/
│   ├── db-permissions.toml   # D1
│   ├── auth-flow.toml        # D1
│   ├── core-plugins.toml     # D1 + KV
│   ├── actions.toml          # D1
│   ├── storage.toml          # R2 + D1
│   ├── env.toml              # D1 + KV + R2 (all binding types)
│   └── email.toml            # (no bindings, mocked provider)
├── helpers/
│   ├── d1.ts                 # apply migrations, seed, reset
│   ├── auth.ts               # create test users/sessions
│   ├── permissions.ts        # role/grant fixtures
│   └── schema.ts             # shared Drizzle table definitions for tests
├── db-permissions/
│   ├── row-level-filters.test.ts
│   ├── query-builder.test.ts
│   ├── cache-invalidation.test.ts
│   ├── unsafe-and-batch.test.ts
│   └── compose.test.ts
├── auth-flow/
│   ├── session-lifecycle.test.ts
│   ├── passkey.test.ts
│   ├── role-management.test.ts
│   └── impersonation.test.ts
├── core-plugins/
│   ├── plugin-chain.test.ts
│   ├── error-handling.test.ts
│   └── app-helpers.test.ts
├── actions/
│   ├── single-action.test.ts
│   ├── composed-actions.test.ts
│   └── loader-integration.test.ts
├── storage/
│   ├── upload-download.test.ts
│   ├── validation.test.ts
│   ├── multipart.test.ts
│   └── lifecycle-hooks.test.ts
├── env/
│   ├── binding-validation.test.ts
│   └── environment-defaults.test.ts
├── email/
│   ├── send-and-render.test.ts
│   └── provider-errors.test.ts
└── permissions/
    ├── hierarchy.test.ts
    └── serialization.test.ts
```

## Vitest Config

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "db-permissions",
          include: ["db-permissions/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/db-permissions.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "auth-flow",
          include: ["auth-flow/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/auth-flow.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "core-plugins",
          include: ["core-plugins/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/core-plugins.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "actions",
          include: ["actions/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/actions.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "storage",
          include: ["storage/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/storage.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "env",
          include: ["env/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/env.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "email",
          include: ["email/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/email.toml" },
            },
          },
        },
      },
      {
        test: {
          name: "permissions",
          include: ["permissions/**/*.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "wrangler/db-permissions.toml" },
            },
          },
        },
      },
    ],
  },
});
```

## Test Scenarios (62 total)

### db-permissions (12 tests)

**Row-level filtering (5):**
1. Read with `where` grant returns only matching rows
2. Multiple grants on same action+table: `where` clauses OR'd
3. Unrestricted grant (no `where`) wins over filtered grants
4. `manage` grant on "all" bypasses all filters
5. Permission `where` AND'd with user-supplied `where`

**Query builder (5):**
6. `findMany`, `findFirst` against real D1
7. `insert`, `update`, `delete` against real D1
8. `update`/`delete` with row-level grant: silent no-match outside permitted set
9. `.returning()` on insert/update/delete
10. Relational queries (`with`): permission filters only on root table

**Cache (5):**
11. Cache hit on repeated read, miss after mutation
12. `cache: false` per-query skips cache
13. `cache: { ttl, staleWhileRevalidate }` custom TTL
14. `db.cache.invalidate()` manual invalidation
15. Cache key includes role: different roles don't share cache

**Unsafe & batch (2):**
16. `db.unsafe()` skips permission checks and WHERE injection
17. `db.batch(operations)` runs sequentially, all permission-checked

**Compose (2):**
18. `compose(ops, executor)` merges permission descriptors
19. Executor receives run functions, returns combined result

### auth-flow (11 tests)

**Session lifecycle (5):**
20. `initAuth({ d1, appUrl })` initializes with real D1
21. `auth.sendMagicLink({ email })` creates verification token in D1
22. Magic link callback verifies token, creates session
23. `requireAuthContext(request)` returns user from valid session
24. Expired session returns null

**Passkey (2):**
25. `registerPasskey()` stores credential in D1
26. `deletePasskey(id)` removes credential

**Role management (2):**
27. `setRole`/`setRoles`/`getRoles` round-trip correctly
28. Role hierarchy: admin inherits editor grants

**Impersonation (2):**
29. `impersonate(adminId, targetId)` returns session with target identity + flags + audit log
30. Non-admin cannot impersonate

### core-plugins (9 tests)

**Plugin chain (3):**
31. 3 plugins run in registration order via `app.context()`
32. Each plugin receives prior plugins' output
33. `app.Provider` nests providers in correct order

**Dependencies (2):**
34. Plugin with `requires` receives dependency output
35. Duplicate plugin names throw `CfastConfigError`

**Error handling (2):**
36. Plugin throw during `setup()` wrapped in `CfastPluginError`
37. Config validation errors throw `CfastConfigError`

**App helpers (2):**
38. `app.init(rawEnv)` validates env (idempotent)
39. `app.loader()`/`app.action()` build context and call handler

### actions (9 tests)

**Single action (5):**
40. `createAction` builds Operation from db + input
41. Authorized user executes successfully
42. Unauthorized user gets `ForbiddenError`
43. `.permissions` extracted pre-execution
44. `.action` handler checks permissions then executes

**Composed actions (4):**
45. `composeActions` routes by `_action` in FormData
46. JSON input with `_action` dispatches correctly
47. `_action` stripped from input before passing to operation
48. Unknown `_action` value errors

**Loader integration (1):**
49. `.loader()` injects `_actionPermissions` with correct status

### storage (8 tests)

**Upload/download (2):**
50. Upload via `storage.handle()` lands in R2, returns metadata
51. `storage.serve()` streams back matching content

**Validation (3):**
52. Wrong MIME type rejected via magic bytes (not Content-Type)
53. Exceeds `maxSize` rejected during streaming
54. Valid file accepted

**Multipart (1):**
55. File above `multipartThreshold` auto-uses multipart

**Lifecycle hooks (1):**
56. `beforeUpload` and `afterUpload` called with correct args

**Key generation (1):**
57. `key(file, ctx)` receives user context for isolation

### env (5 tests)

58. All binding types validated: D1 `.prepare()`, KV `.get()`/`.put()`, R2 `.put()`/`.head()`
59. Missing binding → `EnvError` with all failures at once
60. Idempotent `init()` + retry after failure
61. Environment-aware defaults pick correct value based on `ENVIRONMENT`
62. `var` with `validate()` runs custom validation

### email (4 tests)

63. `email.send()` renders React to HTML + plain text
64. Mailgun provider formats correct HTTP payload
65. Console provider logs and returns `{ id: "console-{uuid}" }`
66. Provider failure throws `EmailDeliveryError` with metadata

### permissions (4 tests — standalone with real runtime)

67. Circular hierarchy detection throws Error
68. `grant("manage", "all")` grants everything
69. `checkPermissions` returns `{ permitted, denied, reasons }`
70. `ForbiddenError.toJSON()` serializes correctly

## CI Integration

New job in `.github/workflows/ci.yml`:

```yaml
integration:
  name: Integration Tests
  runs-on: ubuntu-latest
  needs: ci
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - name: Restore turbo cache
      uses: actions/cache@v4
      with:
        path: .turbo
        key: turbo-${{ runner.os }}-${{ github.sha }}
        restore-keys: turbo-${{ runner.os }}-
    - run: pnpm build
    - name: Run integration tests
      run: pnpm --filter integration test
```

## Scripts

Root `package.json` adds:
```json
"test:integration": "pnpm --filter integration test"
```

`tests/integration/package.json` has:
```json
"test": "vitest run",
"test:project": "vitest run --project"
```

Run a single domain: `pnpm test:integration -- --project db-permissions`

## Turbo Config

Add `test:integration` task to `turbo.json` (no caching — integration tests should always run fresh):

```json
"test:integration": {
  "dependsOn": ["^build"],
  "cache": false
}
```
