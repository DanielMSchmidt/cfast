# @cfast/auth — Context System Design

**Date:** 2026-03-11
**Status:** Approved
**Supersedes:** 2026-03-06-auth-redesign-design.md (extends, doesn't replace)

## Problem

Every loader and action in the example app repeats the same boilerplate:

```ts
const env = context.cloudflare.env;
const user = await getUser(request, env);
const cfDb = createCfDb(env.DB, user);
```

This also blocks `@cfast/actions` — actions need `db` and `user` from somewhere, and making each action wire its own factory defeats the purpose.

## Key Insight: Resolve Permissions, Not Roles

Instead of passing role names to `@cfast/db` and having it resolve grants at query time, resolve grants once per request in the auth layer. Db receives pre-resolved grants and never imports `@cfast/permissions`.

This also solves the single-role limitation: the current `createDb` takes `user: { id, role }` (single string). With pre-resolved grants, multiple roles are merged upstream and db just applies the result.

## Architecture

```
Request arrives
  │
  ▼
auth.createContext(request)
  ├── betterAuth.api.getSession(request.headers)
  ├── No session → { user: null, grants: resolveGrants(permissions, ["anonymous"]) }
  └── Has session → fetch roles from D1
                   → resolveGrants(permissions, user.roles)  // merges via hierarchy
                   → { user, grants }
  │
  ▼
createDb({ d1, schema, grants, user })   // db never sees roles or Permissions
  │
  ▼
requestHandler(request, { env, user, db, ctx })
  │
  ▼
Loaders/actions destructure context — no factory calls
```

## Package Responsibilities

### @cfast/permissions (policy engine)

**New export:** `resolveGrants(permissions, roles: string[]) → Grant[]`

1. Expand roles through hierarchy (editor inherits author inherits reader)
2. Collect grants from all expanded roles
3. Deduplicate: same action + same table → merge WHERE clauses with OR
4. A grant without a WHERE clause overrides any WHERE-restricted grant on the same action+table

**WHERE merge behavior:**
- `author`: `update posts WHERE authorId = user.id`
- `moderator`: `update posts WHERE flagged = true`
- Merged: `update posts WHERE (authorId = user.id OR flagged = true)`
- If any role grants unrestricted access (no WHERE), the WHERE is dropped entirely

### @cfast/db (data)

**Breaking change to `DbConfig`:**

```ts
// Before
type DbConfig = {
  d1: D1Database;
  schema: Record<string, DrizzleTable>;
  permissions: Permissions;
  user: { id: string; role: string } | null;
  cache?: CacheConfig | false;
};

// After
type DbConfig = {
  d1: D1Database;
  schema: Record<string, DrizzleTable>;
  grants: Grant[];
  user: { id: string } | null;
  cache?: CacheConfig | false;
};
```

Db no longer imports `@cfast/permissions`. It receives pre-resolved grants and applies WHERE clauses using the `user` object for evaluation.

### @cfast/auth (identity — Better Auth wrapper)

Mostly a thin wrapper around Better Auth. Cfast-specific additions: role management, permission resolution glue, anonymous user pattern, React convenience components.

**Two-step initialization** (because env isn't available at import time on Workers):

```ts
// auth.server.ts — import-time, no env needed
export const createAppAuth = createAuth({
  permissions,
  passkeys: { rpName: "MyApp", rpId: "myapp.com" },
  session: { expiresIn: "30d" },
  redirects: { afterLogin: "/", loginPath: "/login" },
});

// workers/app.ts — request-time, env available
const auth = createAppAuth(env);
const { user, grants } = await auth.createContext(request);
```

**`createContext(request)`:**
1. Calls `betterAuth.api.getSession({ headers: request.headers })`
2. No session → `{ user: null, grants: resolveGrants(permissions, ["anonymous"]) }`
3. Has session → fetch roles from D1 → check impersonation (KV) → `resolveGrants(permissions, roles)`
4. Returns `{ user: AuthUser | null, grants: Grant[] }`

**`requireUser(request)`:**
- Same as `createContext` but redirects to loginPath if no session
- Sets `cfast_redirect_to` cookie before redirecting
- Return type guarantees `user: AuthUser` (non-null)

**What Better Auth handles (not reimplemented):**
- Session storage, creation, verification (D1)
- User creation/lookup
- Magic link flow (token generation, verification)
- Passkey/WebAuthn ceremonies
- Cookie management
- Email sending (via adapter)

**What @cfast/auth adds:**
- Pre-configured Better Auth instance (D1 adapter, Mailgun, passkeys)
- Role management: `roles` table, `setRole`/`setRoles`/`getRoles`
- Impersonation: `impersonate()`, impersonation log
- `createContext` / `requireUser` — the glue (~20 lines)
- Anonymous grants pattern
- React Router plugin (mounts Better Auth API routes)
- Client components (LoginPage, AuthGuard, AuthProvider, useCurrentUser)

## Worker Entry Point

```ts
// workers/app.ts
import { createAppAuth } from "~/auth.server";

export default {
  async fetch(request, rawEnv, ctx) {
    env.init(rawEnv);
    const e = env.get();
    const auth = createAppAuth(e);
    const { user, grants } = await auth.createContext(request);
    const db = createDb({ d1: e.DB, schema, grants, user, cache: false });

    return requestHandler(request, { env: e, user, db, auth, ctx });
  },
};
```

Routes never call `getUser()`, `createCfDb()`, or any factory. They destructure `context`.

## Anonymous User Model

Permissions must define an `anonymous` role:

```ts
const permissions = definePermissions()({
  roles: ["anonymous", "reader", "author", "editor", "admin"],
  grants: (grant) => ({
    anonymous: [
      grant("read", posts, { where: () => eq(posts.published, true) }),
    ],
    // ...
  }),
});
```

No session cookie → `resolveGrants(permissions, ["anonymous"])` → no D1 queries. Public routes work with zero cost.

## User Type

```ts
type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];              // kept for display ("Editor badge")
  isImpersonating?: boolean;
  realUser?: { id: string; name: string };
};
```

Roles stay on the user object for UI purposes. Db/actions never look at them — only the resolved grants matter.

## Client Components

Thin wrappers, no novel design:

| Component | What it does |
|---|---|
| `LoginPage` | Email input + magic link + passkey buttons. Slot overrides for customization. |
| `AuthGuard` | Layout wrapper. Loader calls `requireUser()`. Client just renders children. |
| `AuthProvider` | Root context provider. Reads user from loader data. |
| `useCurrentUser()` | Returns `AuthUser` inside AuthGuard, `AuthUser \| null` outside. |

## Package Exports

```
@cfast/auth
├── .            → Server: createAuth, types
├── /client      → Client: AuthProvider, AuthGuard, LoginPage, useCurrentUser, useAuth
├── /plugin      → React Router plugin: createAuthPlugin
└── /schema      → Drizzle schema: auth tables for migrations
```

## Implementation Order

1. `@cfast/permissions` — add `resolveGrants()` with OR-merge
2. `@cfast/db` — change DbConfig to accept `grants` instead of `permissions` + `role`
3. `@cfast/auth` — server: createAuth, createContext, requireUser, role management
4. `@cfast/auth` — React Router plugin
5. `@cfast/auth` — client components
6. Example app migration — update worker entry, remove per-route factories

## Impact on @cfast/actions (future)

With this context system, `createAction` receives `db` and `user` from route context. No factory wiring. Actions become pure functions of `(db, input, ctx) → Operation`.
