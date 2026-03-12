# @cfast/auth — Completion Design

**Date:** 2026-03-12
**Status:** Approved
**Extends:** 2026-03-06-auth-redesign-design.md, 2026-03-11-auth-context-design.md

## Context

The auth package has a working server core: `createAuth()`, role management, `createContext()`/`requireUser()`, `AuthProvider`, and route handlers. The example app has a manual login page.

This design covers the remaining features needed for full README parity.

## What Exists

| Feature | File | Lines |
|---|---|---|
| `createAuth()` factory | `src/create-auth.ts` | 138 |
| `AuthUser`, `AuthConfig`, etc. types | `src/types.ts` | 54 |
| Role manager (getRoles, setRole, setRoles, removeRole) | `src/roles.ts` | 51 |
| Route handler helpers | `src/route-handlers.ts` | 27 |
| `AuthProvider`, `useCurrentUser`, `useLoginPath` | `src/client/auth-provider.tsx` | 48 |
| Better Auth client re-exports | `src/client/create-auth-client.ts` | 16 |
| Tests for all above | `src/__tests__/` | ~550 |
| Manual login page (example app) | `examples/.../routes/login.tsx` | 133 |

## What's Missing

### 1. LoginPage Component

Extract the example app's manual login page into a reusable Joy UI component with slot overrides.

**File:** `src/client/login-page.tsx`

**Slot types:**
```typescript
type LoginComponents = {
  Layout?: ComponentType<{ children: ReactNode }>;
  EmailInput?: ComponentType<{ value: string; onChange: (v: string) => void; error?: string }>;
  PasskeyButton?: ComponentType<{ onClick: () => void; loading: boolean }>;
  MagicLinkButton?: ComponentType<{ onClick: () => void; loading: boolean }>;
  SuccessMessage?: ComponentType<{ email: string }>;
  ErrorMessage?: ComponentType<{ error: string }>;
};

type LoginPageProps = {
  components?: LoginComponents;
  title?: string;
  subtitle?: string;
};
```

**State machine:** `idle → loading → success | error`

**Calls:** `authClient.signIn.magicLink()` and `authClient.signIn.passkey()` from Better Auth's React client. The component needs the `authClient` instance — accept it as a prop or use `createAuthClient` internally.

**Decision:** Accept `authClient` as a prop. The consumer already creates one in their `auth.client.ts`. This avoids the component needing to know about plugins.

```typescript
type LoginPageProps = {
  authClient: ReturnType<typeof createAuthClient>;
  components?: LoginComponents;
  title?: string;
  subtitle?: string;
};
```

### 2. AuthGuard Component

Thin layout wrapper. Reads user from React Router loader data and provides it to `AuthProvider` context.

**File:** `src/client/auth-guard.tsx`

```typescript
type AuthGuardProps = {
  children: ReactNode;
  user: AuthUser;  // From loader data — requireUser guarantees non-null
};
```

The consumer destructures `user` from `useLoaderData()` and passes it. AuthGuard sets the user in context so `useCurrentUser()` returns non-null inside the guard boundary.

### 3. useAuth Hook

Wraps Better Auth's passkey client for registration and listing, plus sign-out.

**File:** `src/client/use-auth.ts`

```typescript
function useAuth(authClient: ReturnType<typeof createAuthClient>): {
  signOut: () => Promise<void>;
};
```

Passkey registration/listing depends on the `@better-auth/passkey` plugin being configured in the client. Since LoginPage already accepts `authClient` as a prop, `useAuth` does the same.

### 4. Impersonation

Server-side session swap with audit logging. Uses D1 `impersonation_log` table.

**Added to `AuthConfig`:**
```typescript
impersonation?: {
  allowedRoles?: string[];  // Roles that can impersonate. Default: ["admin"]
};
```

**Added to `AuthInstance`:**
```typescript
impersonate: (adminUserId: string, targetUserId: string) => Promise<void>;
stopImpersonating: (adminUserId: string) => Promise<void>;
```

**Implementation:** Store impersonation state in the `impersonation_log` table with `active` flag. In `createContext()`, check if the user has an active impersonation entry, and if so, swap to the target user's identity while setting `isImpersonating: true` and `realUser`.

**New file:** `src/impersonation.ts` for the impersonation manager (similar pattern to `roles.ts`).

### 5. roleGrants

Validation on who can assign which roles.

**Added to `AuthConfig`:**
```typescript
roleGrants?: Record<string, string[]>;
```

**Implementation:** In `setRole`/`setRoles`, accept an optional `callerRoles: string[]` parameter. If `roleGrants` is configured and `callerRoles` is provided, validate that at least one caller role has permission to assign the target role. Throws `ForbiddenError` if not.

This keeps existing usage (no caller = no check) backward-compatible while enabling admin UIs to enforce the rules.

### 6. createAuthPlugin (React Router)

Injects auth routes into React Router's config. This is a build-time plugin.

**File:** `src/plugin.ts`

React Router v7 plugins are objects with `name` and `routes` properties. The plugin injects a catch-all route for Better Auth's API endpoints.

```typescript
function createAuthPlugin(options?: { basePath?: string }): ReactRouterPlugin;
```

This replaces the manual `routes/auth.$.tsx` file. The plugin generates the equivalent route configuration at build time.

### 7. Schema Export

Drizzle table definitions for migrations.

**File:** `src/schema.ts`

Exports the table definitions that Better Auth + cfast use:
- `users` — Better Auth user table
- `sessions` — Better Auth session table
- `accounts` — Better Auth account table
- `verifications` — Better Auth verification table
- `roles` — cfast role assignments
- `impersonationLog` — cfast impersonation audit trail

### 8. Package Exports

Add to `package.json` exports:
- `./plugin` → `dist/plugin.js`
- `./schema` → `dist/schema.js`

Update build script to include `src/plugin.ts` and `src/schema.ts`.

## Implementation Order

1. **Schema export** — standalone, no deps on other new features
2. **AuthGuard** — simple, enables the pattern for other client work
3. **LoginPage** — extract from example, add slot overrides
4. **useAuth** — small hook, wraps Better Auth client
5. **roleGrants** — config validation on existing role manager
6. **Impersonation** — server feature, extends createContext
7. **createAuthPlugin** — build-time plugin, can be done independently
8. **Package exports** — wire everything in package.json + build script
9. **Example app migration** — update example to use new components
10. **README update** — mark features as implemented

## Decisions

| Decision | Choice | Why |
|---|---|---|
| LoginPage authClient | Prop, not internal | Consumer already configures plugins; avoids double-config |
| AuthGuard user prop | Explicit prop, not useRouteLoaderData | Doesn't assume route structure; works with any data source |
| Impersonation storage | D1 table, not KV | Consistent with rest of stack; auditable |
| roleGrants enforcement | Optional callerRoles param | Backward-compatible; doesn't break existing setRole calls |
| Plugin approach | React Router plugin object | Official extensibility mechanism; replaces manual route file |
