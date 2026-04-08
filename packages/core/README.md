# @cfast/core

**The app object that wires @cfast/\* packages together.**

`@cfast/core` is the optional composition layer for the cfast framework. It provides `createApp()` — a single definition that connects env, auth, db, storage, and any other plugins into a typed per-request context on the server and a unified provider tree on the client.

Individual packages remain fully usable on their own. Core is for when you want them to work together without wiring boilerplate in every route.

## Why This Exists

Without core, every route loader in a cfast app repeats the same initialization:

```typescript
export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);
  const db = createCfDb(env.DB, ctx);
  // NOW you can do your thing
}
```

Three lines of setup, duplicated across every route. On the client side, there's no unified provider tree — each package that needs a React context requires separate setup.

`@cfast/core` eliminates this by running a plugin chain once per request (server) and composing providers automatically (client).

## Design Decisions and Their Rationale

### Why a plugin system instead of a config object?

We considered three approaches:

1. **Declarative config** — `createApp({ auth: authConfig, db: dbConfig })` where core knows about all packages. Simple DX, but core must depend on every package and changes require new core releases.
2. **Plugin registration** — `createApp().use(authPlugin()).use(dbPlugin())` where packages own their integration logic. Core stays thin and decoupled.
3. **Callback composition** — `createApp({ getContext: async (req) => { ... } })` where the user writes the wiring function. Maximum flexibility, but doesn't eliminate boilerplate — just moves it.

We chose **plugins** because cfast's identity is "composable libraries." Core shouldn't be a monolithic hub that knows about every package. Each package can ship its own plugin, and third-party packages can integrate without waiting for core releases.

### Why namespaced context instead of flat merging?

Each plugin's `setup()` return is nested under its `name` key:

```typescript
// ctx.auth.user — not ctx.user
// ctx.db.client — not ctx.db
```

This prevents plugins from silently overriding each other's values. Two plugins that both return `{ client }` would collide in a flat merge — with namespacing, they're `ctx.foo.client` and `ctx.bar.client`. Core throws at startup if two plugins share a `name`.

### Why are plugins ordered and not dependency-sorted?

Plugins run in registration order, not topologically sorted by their `requires` declarations. This is simpler to reason about — you read the `.use()` chain top to bottom and know exactly what runs when. Core validates at startup that each plugin's requirements are met by prior plugins, and throws with a clear error if not.

The alternative (automatic sorting) would make the execution order implicit and harder to debug when something goes wrong.

### Why `requires` as a generic parameter?

Plugin dependencies are declared via a TypeScript generic on `definePlugin<TRequires>()`. Earlier designs used an `as` cast on a `requires` property (`requires: {} as { auth: {...} }`), but a generic parameter is cleaner — no phantom runtime values, and the intent is unambiguous.

Because TypeScript cannot partially infer generic parameters in a single call, dependent plugins use a **curried form** — you specify `TRequires` explicitly and let the compiler infer the rest:

```typescript
import type { AuthPluginProvides } from '@cfast/auth';
definePlugin<AuthPluginProvides>()({ name: 'db', setup(ctx) { ... } })
//                              ^^ curried call
```

This creates a compile-time contract: if `authPlugin` renames a field, dependent plugins break at the type level.

---

## Setup

```typescript
// app/cfast.ts
import { createApp } from '@cfast/core';
import { authPlugin } from '@cfast/auth';
import { dbPlugin } from '@cfast/db';
import { storagePlugin } from '@cfast/storage';
import { envSchema } from './env';
import { permissions } from './permissions';

export const app = createApp({ env: envSchema, permissions })
  .use(authPlugin({
    magicLink: { sendMagicLink: async ({ email, url }) => { /* ... */ } },
    session: { expiresIn: '30d' },
    defaultRoles: ['reader'],
  }))
  .use(dbPlugin({ schema }))
  .use(storagePlugin(storageSchema));
```

`createApp` takes the two leaf packages (`env` and `permissions`) as direct config because every cfast app needs them and they have no dependencies. Everything else is a plugin.

## Server API

### `app.init(rawEnv)`

Call once in the Workers entry point. Validates env bindings (delegates to `@cfast/env`).

```typescript
// workers/app.ts
import { app } from '~/cfast';
import { requestHandler } from 'react-router';

export default {
  async fetch(request: Request, rawEnv: Record<string, unknown>, ctx: ExecutionContext) {
    app.init(rawEnv);
    return requestHandler(request, {
      cloudflare: { env: app.env(), ctx },
    });
  },
};
```

### `app.env()`

Returns the typed, validated environment. Same as calling `env.get()` directly, but accessible from the app object.

### `app.permissions`

The permissions config passed to `createApp()`, exposed for direct access (e.g., checking grants outside a request context).

### `app.context(request, context)`

Builds the per-request context by running each plugin's `setup()` in registration order.

```typescript
// app/routes/posts.tsx
import { app } from '~/cfast';

export async function loader({ request, context }: Route.LoaderArgs) {
  const ctx = await app.context(request, context);
  return ctx.db.client.query(posts).findMany().run();
}
```

The return type is the intersection of all plugin namespaces:

```typescript
// With authPlugin + dbPlugin + storagePlugin:
type AppContext = {
  env: ParsedEnv<typeof envSchema>;
  auth: { user: AuthUser | null; grants: Grant[]; instance: AuthInstance };
  db: { client: Db };
  storage: { handle: HandleFn; getSignedUrl: SignedUrlFn; /* ... */ };
};
```

**Each plugin's `setup()` receives everything prior plugins have provided**, plus `request` and `env`:

1. `authPlugin.setup({ request, env })` → returns `{ user, grants, instance }`
2. `dbPlugin.setup({ request, env, auth: { user, grants, instance } })` → returns `{ client }`
3. `storagePlugin.setup({ request, env, auth: {...}, db: {...} })` → returns `{ handle, ... }`

If a plugin's `setup()` throws, the error is wrapped with the plugin name:

```
CfastPluginError: Plugin "db" setup failed: D1 binding not found
  Caused by: Error: D1 binding not found
```

### `app.loader(loaderFn)` and `app.action(actionFn)`

Optional convenience wrappers that call `app.context()` and pass the result as the first argument:

```typescript
export const loader = app.loader(async (ctx, { params }) => {
  return ctx.db.client.query(posts).findMany().run();
});
```

These are thin sugar — `app.context()` is always available for cases where you need more control (e.g., routes that don't need the full context, or actions already handled by `@cfast/actions`).

### Integration with `@cfast/actions`

`@cfast/actions` has its own context mechanism via `createActions({ getContext })`. With core, the wiring becomes a one-liner:

```typescript
// app/actions.server.ts
import { createActions } from '@cfast/actions';
import { app } from '~/cfast';

export const { createAction, composeActions } = createActions({
  getContext: async ({ request, context }) => {
    const ctx = await app.context(request, context);
    return { db: ctx.db.client, user: ctx.auth.user, grants: ctx.auth.grants };
  },
});
```

Core doesn't wrap or replace `@cfast/actions` — actions own their execution semantics.

---

## Client API

### `<app.Provider>`

Composes all plugin providers into a single tree. Plugins without a `Provider` are skipped.

```typescript
// app/root.tsx
import { app } from '~/cfast';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <app.Provider>
          {children}
        </app.Provider>
      </body>
    </html>
  );
}
```

The rendered tree nests providers in registration order:

```tsx
<CoreContext.Provider value={clientValues}>
  <AuthProvider>          {/* from authPlugin */}
    <StorageProvider>     {/* from storagePlugin */}
      {children}
    </StorageProvider>
  </AuthProvider>
</CoreContext.Provider>
```

### `useApp()`

Typed access to all plugins' client-side exports:

```typescript
import { useApp } from '@cfast/core/client';

function MyComponent() {
  const { auth, storage } = useApp();
  const user = auth.useCurrentUser();
  const upload = storage.useUpload('avatar');
}
```

The type reflects only plugins that declared a `client` export. Plugins without client exports don't appear.

Individual package hooks (`useCurrentUser()`, `useUpload()`) continue to work directly — `useApp()` is additive, not a replacement.

---

## Plugin API

### `definePlugin(config)` / `definePlugin<TRequires>()(config)`

Creates a plugin. This is the API package authors use.

The direct form (no dependencies) infers all type parameters:

```typescript
import { definePlugin } from '@cfast/core';

export const myPlugin = (config: MyConfig) =>
  definePlugin({
    name: 'my-plugin',
    setup(ctx) {
      // ctx is { request, env } when no dependencies
      return { /* values exposed as ctx['my-plugin'] */ };
    },
  });
```

The curried form (with dependencies) lets you specify `TRequires` while inferring the rest:

```typescript
definePlugin<AuthPluginProvides>()({
  name: 'db',
  setup(ctx) {
    ctx.auth.user // typed from TRequires
    return { client };
  },
});
```

### Plugin config

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Unique identifier. Used as the namespace key in context. |
| `setup` | `(ctx) => TProvides \| Promise<TProvides>` | Yes | Called per-request. Receives `{ request, env }` plus all prior plugin namespaces. Returns the values this plugin provides. |
| `Provider` | `React.ComponentType<{ children: ReactNode }>` | No | Client-side React provider. Composed into `app.Provider`. |
| `client` | `Record<string, unknown>` | No | Client-side values exposed via `useApp()`. |

### Declaring dependencies

Import the type token from the package you depend on:

```typescript
import { definePlugin } from '@cfast/core';
import type { AuthPluginProvides } from '@cfast/auth';

export const dbPlugin = (config: DbPluginConfig) =>
  definePlugin<AuthPluginProvides>()({
    name: 'db',
    setup(ctx) {
      // ctx.auth.user and ctx.auth.grants are typed
      const client = createDb({
        d1: ctx.env.DB,
        schema: config.schema,
        grants: ctx.auth.grants,
        user: ctx.auth.user,
      });
      return { client };
    },
  });
```

Each package that ships a plugin should export a `PluginProvides` type:

```typescript
// @cfast/auth exports:
export type AuthPluginProvides = PluginProvides<typeof authPlugin>;
// Resolves to: { auth: { user: AuthUser | null; grants: Grant[]; instance: AuthInstance } }
```

`PluginProvides<T>` is a utility type exported by `@cfast/core` that extracts `{ [name]: ReturnType<setup> }` from any plugin definition.

### Multiple dependencies

Intersect the type tokens:

```typescript
import type { AuthPluginProvides } from '@cfast/auth';
import type { DbPluginProvides } from '@cfast/db';

export const adminPlugin = (config: AdminConfig) =>
  definePlugin<AuthPluginProvides & DbPluginProvides>()({
    name: 'admin',
    setup(ctx) {
      ctx.auth.user       // typed
      ctx.db.client       // typed
      return { /* ... */ };
    },
  });
```

### No dependencies (leaf plugins)

Omit the generic — `TRequires` defaults to `{}`:

```typescript
export const analyticsPlugin = (config: AnalyticsConfig) =>
  definePlugin({
    name: 'analytics',
    setup(ctx) {
      // ctx has { request, env } only
      return { track: (event: string) => { /* ... */ } };
    },
  });
```

### Client-only plugins

Plugins that only provide client-side functionality can return `{}` from `setup`:

```typescript
export const themePlugin = (config: ThemeConfig) =>
  definePlugin({
    name: 'theme',
    setup() {
      return {};
    },
    Provider({ children }) {
      return <ThemeProvider theme={config.theme}>{children}</ThemeProvider>;
    },
    client: {
      useTheme: () => useContext(ThemeContext),
    },
  });
```

---

## Writing a Plugin: Complete Example

A rate-limiting plugin that uses KV to track request counts:

```typescript
// packages/rate-limit/src/plugin.ts
import { definePlugin, type PluginProvides } from '@cfast/core';
import type { AuthPluginProvides } from '@cfast/auth';

export type RateLimitConfig = {
  kv: string;           // env binding name for KV namespace
  maxRequests: number;  // per window
  windowMs: number;     // window size in milliseconds
};

export const rateLimitPlugin = (config: RateLimitConfig) =>
  definePlugin<AuthPluginProvides>()({
    name: 'rate-limit',

    async setup(ctx) {
      const kv = ctx.env[config.kv] as KVNamespace;
      const key = ctx.auth.user?.id ?? ctx.request.headers.get('cf-connecting-ip') ?? 'unknown';
      const windowKey = `rl:${key}:${Math.floor(Date.now() / config.windowMs)}`;

      const current = parseInt(await kv.get(windowKey) ?? '0', 10);
      const remaining = Math.max(0, config.maxRequests - current);
      const limited = current >= config.maxRequests;

      return {
        limited,
        remaining,
        async consume() {
          await kv.put(windowKey, String(current + 1), {
            expirationTtl: Math.ceil(config.windowMs / 1000),
          });
        },
      };
    },
  });

// Type token for dependents
export type RateLimitPluginProvides = PluginProvides<ReturnType<typeof rateLimitPlugin>>;
```

Usage:

```typescript
// app/cfast.ts
import { rateLimitPlugin } from '@cfast/rate-limit';

export const app = createApp({ env: envSchema, permissions })
  .use(authPlugin({ /* ... */ }))
  .use(rateLimitPlugin({ kv: 'RATE_LIMIT', maxRequests: 100, windowMs: 60_000 }))
  .use(dbPlugin({ schema }));

// app/routes/api.tsx
export async function loader({ request, context }: Route.LoaderArgs) {
  const ctx = await app.context(request, context);

  if (ctx['rate-limit'].limited) {
    throw new Response('Too many requests', { status: 429 });
  }
  await ctx['rate-limit'].consume();

  return ctx.db.client.query(posts).findMany().run();
}
```

---

## Startup Validation

`createApp().use()` performs validation eagerly (at import time, not per-request):

1. **Duplicate names** — If two plugins share a `name`, `.use()` throws a `CfastConfigError` immediately.
2. **Missing requirements** — If a plugin's `TRequires` includes keys not provided by prior plugins, TypeScript reports a type error at the `.use()` call site. This is compile-time only — there is no runtime check for missing requirements.

If plugin `setup()` throws during `app.context()`, the error is wrapped in a `CfastPluginError` with the plugin name for diagnostics.

---

## Exports

Server (`@cfast/core`):

```typescript
export { createApp } from './create-app.js';
export { definePlugin } from './define-plugin.js';
export { CfastPluginError, CfastConfigError } from './errors.js';
export type {
  CfastPlugin, CreateAppConfig, PluginSetupContext,
  AppContext, PluginProvides, App, RouteArgs,
} from './types.js';
```

Client (`@cfast/core/client`):

```typescript
export { useApp } from './client/use-app.js';
export { createCoreProvider, CoreContext } from './client/provider.js';
```

---

## Integration with Other @cfast Packages

- **`@cfast/env`** — Core accepts the env schema directly and delegates to `defineEnv` internally. `app.init()` calls `env.init()`, `app.env()` calls `env.get()`.
- **`@cfast/permissions`** — Core accepts the permissions config directly and makes it available to all plugins via `ctx.env` (the env binding) and the base context.
- **`@cfast/auth`**, **`@cfast/db`**, **`@cfast/storage`**, etc. — Each ships an optional plugin export alongside their standalone API. The plugin wraps their existing factory function and registers it with core.
- **`@cfast/actions`** — Not wrapped by core. Actions have their own context mechanism. Core's `app.context()` feeds into `createActions({ getContext })`.
- **`@cfast/admin`** — Can ship an `adminPlugin` that depends on auth + db + forms plugins.

---

## Known Limitations

### 1. Plugin setup runs on every request

There is no caching of plugin `setup()` results across requests. Each call to `app.context()` runs the full plugin chain. This is intentional — most setup work is cheap (object construction, cookie parsing) and the per-request user context makes caching unsafe.

If a plugin has expensive one-time initialization, it should do that work in the plugin factory (the outer function) rather than in `setup()`.

### 2. Provider ordering matches registration order

Client-side providers nest in the order plugins were registered. If a provider needs to wrap another provider (e.g., auth must wrap storage for token access), the plugins must be registered in the correct order. This is the same constraint as the server-side `setup()` chain.

### 3. `useApp()` requires `app.Provider` in the tree

Calling `useApp()` outside of `app.Provider` throws a context error. Individual package hooks may or may not have this requirement depending on their implementation.
