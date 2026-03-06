# @cfast/env Design

## Summary

Type-safe Cloudflare Worker bindings with runtime validation. Declare bindings once, validate at startup, get a fully typed object.

## Decisions

- **Environment detection**: Reserved `ENVIRONMENT` binding (var, defaults to `"development"`)
- **Binding validation**: Duck-type checks (probe known methods on binding objects)
- **Validation callbacks**: Return boolean; auto-generated error messages
- **Init/access pattern**: `env.init(rawEnv)` validates once; `env.get()` returns cached result

## Types

```typescript
type BindingType = "d1" | "kv" | "r2" | "queue" | "durable-object" | "service" | "secret" | "var";

type EnvironmentDefaults = {
  development?: string;
  staging?: string;
  production?: string;
};

type BindingDef =
  | { type: "d1" }
  | { type: "kv" }
  | { type: "r2" }
  | { type: "queue" }
  | { type: "durable-object" }
  | { type: "service" }
  | { type: "secret" }
  | { type: "var"; default?: string | EnvironmentDefaults; validate?: (v: string) => boolean };

type Schema = Record<string, BindingDef>;
```

## Type Mapping

| Binding Type | TypeScript Type |
|---|---|
| d1 | D1Database |
| kv | KVNamespace |
| r2 | R2Bucket |
| queue | Queue |
| durable-object | DurableObjectNamespace |
| service | Fetcher |
| secret | string |
| var | string |

## Duck-Type Validators

| Type | Check |
|---|---|
| d1 | `typeof val.prepare === "function"` |
| kv | `typeof val.get === "function" && typeof val.put === "function"` |
| r2 | `typeof val.put === "function" && typeof val.head === "function"` |
| queue | `typeof val.send === "function"` |
| durable-object | `typeof val.get === "function" && typeof val.idFromName === "function"` |
| service | `typeof val.fetch === "function"` |
| secret | `typeof val === "string" && val.length > 0` |
| var | `typeof val === "string"` |

## API

```typescript
const env = defineEnv({
  DB: { type: "d1" },
  CACHE: { type: "kv" },
  MAILGUN_API_KEY: { type: "secret" },
  APP_URL: {
    type: "var",
    default: {
      development: "http://localhost:8787",
      production: "https://myapp.com",
    },
  },
  LOG_LEVEL: {
    type: "var",
    default: "info",
    validate: (v) => ["debug", "info", "warn", "error"].includes(v),
  },
});

// Worker entry
export default {
  async fetch(request, rawEnv) {
    env.init(rawEnv);   // validates once, no-ops on subsequent calls
    const { DB } = env.get(); // typed D1Database
  },
};
```

## Error Design

```typescript
class EnvError extends Error {
  readonly errors: EnvValidationError[];
}

type EnvValidationError = {
  key: string;
  message: string;
};
```

All validation errors are collected and thrown together so you fix everything in one pass.

## Not in v1

- CLI/codegen for wrangler.toml
- Async validators
- Nested/grouped bindings
