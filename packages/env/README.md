# @cfast/env

**Type-safe Cloudflare Worker bindings. Validated at startup, not at crash time.**

Every Cloudflare Worker has bindings: D1 databases, KV namespaces, R2 buckets, secrets, environment variables. By default, they're all `unknown` or loosely typed, and you find out about misconfiguration when your production handler throws `Cannot read properties of undefined`.

`@cfast/env` fixes this. You declare your bindings in one place, and get a fully typed, runtime-validated environment object. If a binding is missing or misconfigured, you get a clear error at startup, not buried in a stack trace at 3am.

## Design Goals

- **Single source of truth.** One schema definition produces TypeScript types, runtime validation, and documentation.
- **Fail fast.** Missing bindings are caught at Worker startup, before any request is processed.
- **Zero runtime overhead on the hot path.** Validation runs once at initialization. After that, it's just a typed object.
- **Works with wrangler.toml.** The schema mirrors the structure of your wrangler config so there's no mental translation layer.

## Quick Start

```typescript
import { defineEnv } from "@cfast/env";

const env = defineEnv({
  DB: { type: "d1" },
  CACHE: { type: "kv" },
  UPLOADS: { type: "r2" },
  MAILGUN_API_KEY: { type: "secret" },
  APP_URL: { type: "var", default: "http://localhost:8787" },
});

export default {
  async fetch(request, rawEnv) {
    env.init(rawEnv);
    const { DB, MAILGUN_API_KEY, APP_URL } = env.get();
    //       ^-- D1Database  ^-- string       ^-- string
  },
};
```

## API

### `defineEnv(schema)`

Creates an env instance with `init()` and `get()` methods. The schema is a record of binding names to binding definitions.

```typescript
const env = defineEnv({
  DB: { type: "d1" },
  API_KEY: { type: "secret" },
  LOG_LEVEL: { type: "var", default: "info", validate: (v) => ["debug", "info", "warn", "error"].includes(v) },
});
```

### `env.init(rawEnv)`

Validates all bindings against the schema and caches the result. Call this once in your Worker's `fetch` handler before accessing any bindings.

```typescript
export default {
  async fetch(request, rawEnv, ctx) {
    env.init(rawEnv);
    // ...
  },
};
```

**Behavior:**
- **First call:** Validates every binding. If any fail, throws `EnvError` with all failures listed. If all pass, caches the typed result.
- **Subsequent calls (after success):** No-op. Returns immediately without re-validating. The first valid `rawEnv` wins.
- **After a failed call:** Can be retried. Since the result wasn't cached (validation failed), the next `init()` call will attempt validation again.

### `env.get()`

Returns the validated, fully typed environment object. Throws if `init()` hasn't been called successfully.

```typescript
const { DB, API_KEY } = env.get();
// DB is typed as D1Database
// API_KEY is typed as string
```

To derive a reusable `Env` type for function signatures:

```typescript
export type Env = ReturnType<typeof env.get>;

function createAuth(env: Env) {
  const db = createDbClient(env.DB); // DB is D1Database
}
```

## Binding Types

### Reference

| Type | TypeScript Type | Validation |
|---|---|---|
| `d1` | `D1Database` | Object with `.prepare()` method |
| `kv` | `KVNamespace` | Object with `.get()` and `.put()` methods |
| `r2` | `R2Bucket` | Object with `.put()` and `.head()` methods |
| `queue` | `Queue` | Object with `.send()` method |
| `durable-object` | `DurableObjectNamespace` | Object with `.get()` and `.idFromName()` methods |
| `service` | `Fetcher` | Object with `.fetch()` method |
| `secret` | `string` | Non-empty string |
| `var` | `string` | String (empty allowed) |

Validation uses duck-type checks — it probes for known methods on the binding object rather than checking constructors. This works reliably across Cloudflare's runtime without depending on `@cloudflare/workers-types` at runtime.

### `secret` vs `var`

Both resolve to `string` at the type level. The difference is validation:

- **`secret`**: Must be a non-empty string. Intended for API keys, tokens, and credentials set via `wrangler secret put`. No defaults allowed.
- **`var`**: Can be empty. Supports `default` values and `validate` callbacks. Intended for configuration set via `[vars]` in `wrangler.toml`.

### `var` Options

```typescript
APP_URL: {
  type: "var",
  default: "http://localhost:8787",      // Simple default
  validate: (v) => v.startsWith("http"), // Must return true to pass
}
```

- **`default`**: Used when the binding is missing from `rawEnv`. Can be a string or an environment-aware defaults object (see below).
- **`validate`**: Called with the resolved value (after defaults). Return `true` to accept, `false` to reject. Rejection produces a generic error message: `"Variable 'X' failed validation."`.

## Environment-Aware Defaults

Bindings of type `var` can have different defaults per environment. The current environment is determined by a reserved `ENVIRONMENT` binding in `rawEnv`.

```typescript
const env = defineEnv({
  APP_URL: {
    type: "var",
    default: {
      development: "http://localhost:8787",
      staging: "https://staging.myapp.com",
      production: "https://myapp.com",
    },
  },
});
```

### The `ENVIRONMENT` Binding

`ENVIRONMENT` is a reserved binding name read from `rawEnv` during `init()`. You don't need to declare it in your schema.

- **Valid values:** `"development"`, `"staging"`, `"production"`
- **Default:** `"development"` (when `ENVIRONMENT` is absent or not a string)
- **Invalid values** (e.g., `"test"`, `"local"`): Throws `EnvError`

Set it in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"

[env.staging.vars]
ENVIRONMENT = "staging"
```

When an environment-aware default object has no key for the current environment and no value is provided in `rawEnv`, `init()` throws an error:

```
Missing required variable 'APP_URL'. No default for environment 'staging'.
```

## Error Handling

When validation fails, `init()` throws an `EnvError` containing all failures — not just the first one. This lets you fix everything in a single pass.

```typescript
import { EnvError } from "@cfast/env";

try {
  env.init(rawEnv);
} catch (e) {
  if (e instanceof EnvError) {
    console.error(e.message);
    // @cfast/env: 2 binding error(s):
    //   - DB: Missing required D1 binding 'DB'. Check your wrangler.toml.
    //   - API_KEY: Missing required secret 'API_KEY'. Check your wrangler.toml.

    for (const err of e.errors) {
      console.error(err.key, err.message);
    }
  }
}
```

### `EnvError`

```typescript
class EnvError extends Error {
  readonly errors: EnvValidationError[];
}

type EnvValidationError = {
  key: string;    // The binding name (e.g., "DB")
  message: string; // Human-readable error message
};
```

## Exported Types

```typescript
import type {
  BindingDef,         // Union of VarBindingDef | ObjectBindingDef | SecretBindingDef
  BindingType,        // "d1" | "kv" | "r2" | "queue" | "durable-object" | "service" | "secret" | "var"
  BindingTypeMap,     // Maps each BindingType to its TypeScript type
  EnvironmentDefaults,// Partial<Record<"development" | "staging" | "production", string>>
  EnvironmentName,    // "development" | "staging" | "production"
  EnvValidationError, // { key: string; message: string }
  ParsedEnv,          // Mapped type: schema keys → their Cloudflare types
  Schema,             // Record<string, BindingDef>
  VarBindingDef,      // { type: "var"; default?: string | EnvironmentDefaults; validate?: ... }
  ObjectBindingDef,   // { type: "d1" | "kv" | "r2" | "queue" | "durable-object" | "service" }
  SecretBindingDef,   // { type: "secret" }
} from "@cfast/env";
```

## Integration with Other cfast Packages

Other cfast packages accept the parsed env object directly:

```typescript
env.init(rawEnv);
const { DB } = env.get();
const db = createDb(DB); // @cfast/db knows this is D1Database
```
