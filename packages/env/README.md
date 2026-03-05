# @cfast/env

**Type-safe Cloudflare Worker bindings. Validated at startup, not at crash time.**

Every Cloudflare Worker has bindings: D1 databases, KV namespaces, R2 buckets, secrets, environment variables. By default, they're all `unknown` or loosely typed, and you find out about misconfiguration when your production handler throws `Cannot read properties of undefined`.

`@cfast/env` fixes this. You declare your bindings in one place, and get a fully typed, runtime-validated environment object. If a binding is missing or misconfigured, you get a clear error at startup, not buried in a stack trace at 3am.

## Design Goals

- **Single source of truth.** One schema definition produces TypeScript types, runtime validation, and documentation.
- **Fail fast.** Missing bindings are caught at Worker startup, before any request is processed.
- **Zero runtime overhead on the hot path.** Validation runs once at initialization. After that, it's just a typed object.
- **Works with wrangler.toml.** The schema mirrors the structure of your wrangler config so there's no mental translation layer.

## Planned API

```typescript
import { defineEnv } from "@cfast/env";

const env = defineEnv({
  // Cloudflare bindings
  DB: { type: "d1" },
  CACHE: { type: "kv" },
  UPLOADS: { type: "r2" },
  EMAIL_QUEUE: { type: "queue" },

  // Secrets & variables
  MAILGUN_API_KEY: { type: "secret" },
  APP_URL: { type: "var", default: "http://localhost:8787" },
  LOG_LEVEL: { type: "var", default: "info", validate: (v) => ["debug", "info", "warn", "error"].includes(v) },
});

// In your Worker:
export default {
  async fetch(request, rawEnv) {
    const { DB, MAILGUN_API_KEY, APP_URL } = env.parse(rawEnv);
    //       ^-- D1Database        ^-- string     ^-- string
    // If DB is missing, this threw at startup with:
    // "CFast: Missing required D1 binding 'DB'. Check your wrangler.toml."
  },
};
```

## Features

### Binding Types
Built-in validators for every Cloudflare binding type: `d1`, `kv`, `r2`, `queue`, `durable-object`, `service`, `secret`, `var`.

### Environment-Aware Defaults
Different defaults for development, staging, and production. No more `process.env.NODE_ENV` ternaries scattered across your codebase.

```typescript
APP_URL: {
  type: "var",
  default: {
    development: "http://localhost:8787",
    staging: "https://staging.myapp.com",
    production: "https://myapp.com",
  },
},
```

### Integration with Other cfast Packages
Other cfast packages accept the parsed env object directly. No adapter code needed:

```typescript
const { DB } = env.parse(rawEnv);
const db = createDb(DB); // @cfast/db knows this is D1Database
```
