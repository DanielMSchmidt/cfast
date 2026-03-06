# Team Blog — with @cfast/env

A team blog platform on Cloudflare Workers showcasing how `@cfast/env` eliminates unsafe environment casts and catches misconfigured bindings at startup.

## The Problem

Without `@cfast/env`, every Cloudflare Worker app needs a manually maintained `Env` interface and `as Env` casts scattered across every route:

```typescript
// app/env.ts — manually kept in sync with wrangler.toml
export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  CACHE: KVNamespace;
  APP_URL: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
}

// Every single route file:
import type { Env } from "~/env";

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env; // unsafe cast, no validation
  // If DB is missing, you find out here at runtime with a cryptic error
}
```

This has three problems:

1. **No runtime validation.** If you forget a binding in `wrangler.toml`, you get `Cannot read properties of undefined` deep in a request handler.
2. **Unsafe `as` casts everywhere.** TypeScript can't verify the cast is correct — it trusts you blindly.
3. **Manual type maintenance.** The `Env` interface must be kept in sync with `wrangler.toml` by hand. Drift is inevitable.

## The Solution

### 1. Define your bindings once (`app/env.ts`)

```typescript
import { defineEnv } from "@cfast/env";

export const env = defineEnv({
  DB: { type: "d1" },
  UPLOADS: { type: "r2" },
  CACHE: { type: "kv" },
  APP_URL: { type: "var", default: "http://localhost:5173" },
  MAILGUN_API_KEY: { type: "secret" },
  MAILGUN_DOMAIN: { type: "var" },
});

export type Env = ReturnType<typeof env.get>;
```

This single schema is the source of truth. It produces both TypeScript types and runtime validators. Each binding declares its type (`d1`, `r2`, `kv`, `secret`, `var`), and `@cfast/env` knows how to validate each one using duck-type checks (e.g., a D1 binding must have a `.prepare()` method).

### 2. Validate once at startup (`workers/app.ts`)

```typescript
import { env } from "../app/env";

export default {
  async fetch(request: Request, rawEnv: Record<string, unknown>, ctx: ExecutionContext) {
    env.init(rawEnv); // Validates all bindings on first call, no-ops after
    return requestHandler(request, {
      cloudflare: { env: env.get(), ctx }, // Fully typed, already validated
    });
  },
};
```

`env.init()` runs duck-type checks on every binding and collects all errors at once:

```
@cfast/env: 2 binding error(s):
  - DB: Missing required D1 binding 'DB'. Check your wrangler.toml.
  - MAILGUN_API_KEY: Missing required secret 'MAILGUN_API_KEY'. Check your wrangler.toml.
```

You see this the moment your Worker starts, not buried in a stack trace during a request.

### 3. Use typed env in routes — no casts needed

```typescript
// Before: every route had this
import type { Env } from "~/env";
const env = context.cloudflare.env as Env; // unsafe cast

// After: just use context directly
const env = context.cloudflare.env; // already typed via AppLoadContext
```

The `AppLoadContext` is typed with the return type of `env.get()`, so `context.cloudflare.env.DB` resolves to `D1Database` automatically. No imports, no casts.

## What Changed (file by file)

| File | Before | After |
|---|---|---|
| `app/env.ts` | Manual `interface Env` with 6 hand-typed fields | `defineEnv()` schema — types derived automatically |
| `workers/app.ts` | Passes raw `env` unvalidated, uses `ExportedHandler<Env>` | Calls `env.init(rawEnv)`, passes typed `env.get()` |
| 16 route files | `import type { Env }` + `as Env` cast in every loader/action | Direct `context.cloudflare.env` — no import, no cast |
| `worker-configuration.d.ts` | Giant auto-generated type file (needed for `Env`) | No longer needed for env typing |

Helper files (`auth.server.ts`, `email/mailgun.ts`, etc.) still accept `env: Env` as a parameter — this is intentional for testability. The `Env` type is now derived from the schema instead of manually maintained.

## Key Benefits Demonstrated

**Fail-fast validation.** The blog uses D1, R2, KV, and two secrets (Mailgun). If any are misconfigured, `env.init()` throws immediately with all missing bindings listed — no more discovering issues one-at-a-time during requests.

**Eliminated 16 unsafe casts.** Every route file had `context.cloudflare.env as Env`. All 16 are gone, replaced by properly typed context access.

**Single source of truth.** The binding schema in `app/env.ts` replaces both the manual `Env` interface and the auto-generated `worker-configuration.d.ts` for environment typing. Add a binding to the schema and it's typed everywhere.

**Environment-aware defaults.** `APP_URL` defaults to `http://localhost:5173` in development. For production, set it in `wrangler.toml` `[vars]` or use `env.init()` with environment-aware defaults:

```typescript
APP_URL: {
  type: "var",
  default: {
    development: "http://localhost:5173",
    production: "https://blog.example.com",
  },
},
```

## Running

```bash
pnpm install
pnpm db:migrate
pnpm dev
```
