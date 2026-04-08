# @cfast/auth

**Authentication for Cloudflare Workers. Magic email, passkeys, roles, impersonation. Built on Better Auth.**

`@cfast/auth` is a pre-configured [Better Auth](https://better-auth.com) setup purpose-built for Cloudflare Workers with D1. It takes the decisions out of authentication: magic email links and passkeys for login, Mailgun for delivery, D1 for storage, and a complete role management system that plugs directly into `@cfast/permissions`.

You don't configure an auth library. You tell cfast what roles your app has, and auth just works.

## Design Goals

- **Zero-config for the common case.** Magic email + passkeys out of the box. No OAuth provider configuration unless you want it.
- **Email-first login.** The user enters their email, then chooses between passkey or magic link. Both methods are passwordless.
- **Overridable UI.** Default components use MUI Joy UI. Override individual component slots to customize the login experience without rebuilding from scratch.
- **Cookie-based redirect-back.** When an unauthenticated user hits a protected route, the intended path is stored in a cookie and restored after login.
- **Roles are the bridge.** `@cfast/auth` assigns roles to users. `@cfast/permissions` defines what those roles can do. The two packages share the same role type definitions.
- **Workers-native.** Session storage on D1, email via Mailgun (Worker-friendly HTTP API), passkeys via WebAuthn. No Node.js dependencies.
- **Admin-ready.** Role management and user impersonation built in, not bolted on.

## API

### Server Setup

```typescript
import { createAuth } from "@cfast/auth";
import { permissions } from "./permissions"; // from @cfast/permissions

export const initAuth = createAuth({
  permissions, // Roles are inferred from your permission definitions
  magicLink: {
    sendMagicLink: async ({ email, url }) => {
      // Send email with your provider (Mailgun, Resend, etc.)
    },
  },
  passkeys: {
    rpName: "MyApp",
    rpId: "myapp.com",
  },
  session: {
    expiresIn: "30d",
  },
  redirects: {
    afterLogin: "/",        // default redirect after successful login
    loginPath: "/login",    // where to send unauthenticated users
  },
});

// In your request handler, initialize with D1:
const auth = initAuth({ d1: env.DB, appUrl: "https://myapp.com" });
```

### Route Integration (routes.ts Helper)

Auth routes (magic link callback, passkey endpoints) are added via a helper in your `routes.ts`. You create a handler file that forwards requests to Better Auth.

```typescript
// app/routes.ts
import type { RouteConfig } from "@react-router/dev/routes";
import { authRoutes } from "@cfast/auth/plugin";

export default [
  ...authRoutes({ handlerFile: "routes/auth.$.tsx" }),
  // ... other routes
] satisfies RouteConfig;
```

The handler file (`routes/auth.$.tsx`) uses `createAuthRouteHandlers`:
```typescript
import { createAuthRouteHandlers } from "@cfast/auth";
const { loader, action } = createAuthRouteHandlers(() => getAuth());
export { loader, action };
```

### Protecting Routes with AuthGuard

`AuthGuard` is a layout-level component. It takes a `user` prop from the loader and provides it to all child routes via context.

```typescript
// routes/_protected.tsx
import { AuthGuard } from "@cfast/auth/client";
import { requireAuthContext } from "~/auth.helpers.server";
import { Outlet, useLoaderData } from "react-router";

export async function loader({ request }) {
  const ctx = await requireAuthContext(request);
  // Sets a cfast_redirect_to cookie with the current path
  // Throws a redirect to /login if not authenticated
  return { user: ctx.user };
}

export default function ProtectedLayout() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <AuthGuard user={user}>
      <Outlet />
    </AuthGuard>
  );
}
```

Any route nested under `_protected` is automatically guarded. The login page lives outside this layout as a normal route file.

### Client-Side Providers

Two providers wrap the app root:

- **`AuthClientProvider`** — holds the Better Auth client instance. Required for `useAuth()`.
- **`AuthProvider`** — holds the current user from loader data. Required for `useCurrentUser()`.

```typescript
// root.tsx
import { AuthClientProvider } from "@cfast/auth/client";
import { authClient } from "~/auth.client";
import { Outlet } from "react-router";

export default function App() {
  return (
    <AuthClientProvider authClient={authClient}>
      <Outlet />
    </AuthClientProvider>
  );
}
```

`AuthProvider` is typically used inside layout routes (via `AuthGuard`) rather than at the root, since user data comes from loaders.

### useCurrentUser Hook

```typescript
import { useCurrentUser } from "@cfast/auth/client";

function Header() {
  const user = useCurrentUser();
  // Inside AuthGuard: returns User (non-null, type-enforced)
  // Outside AuthGuard: returns User | null
  return <span>{user?.email}</span>;
}
```

### Login Page

The consumer creates their own login route and renders `<LoginPage>`. The component accepts an `authClient` prop and a `components` prop for UI slot overrides. Default slots render plain HTML — use `@cfast/joy` for Joy UI styling.

```typescript
// routes/login.tsx
import { LoginPage } from "@cfast/auth/client";
import { joyLoginComponents } from "@cfast/joy";
import { authClient } from "~/auth.client";

export default function Login() {
  return (
    <LoginPage
      authClient={authClient}
      components={joyLoginComponents}
      title="Sign In"
      subtitle="Sign in to My App"
    />
  );
}
```

The login page shows:
1. An email input
2. A "Send Magic Link" button
3. A "Sign in with Passkey" button
4. Success/error feedback messages

### Component Slot Overrides

Override individual pieces of the login UI. Unspecified slots use the plain HTML defaults.

```typescript
import { LoginPage } from "@cfast/auth/client";
import type { LoginComponents } from "@cfast/auth/client";

const components: LoginComponents = {
  Layout: ({ children }) => <MyCustomCard>{children}</MyCustomCard>,
  EmailInput: ({ value, onChange, error }) => (
    <MyInput value={value} onChange={onChange} error={error} />
  ),
  PasskeyButton: ({ onClick, loading }) => (
    <MyButton onClick={onClick} loading={loading}>Use Passkey</MyButton>
  ),
  MagicLinkButton: ({ onClick, loading }) => (
    <MyButton onClick={onClick} loading={loading}>Email Me a Link</MyButton>
  ),
  SuccessMessage: ({ email }) => (
    <MyAlert>Check {email} for your login link</MyAlert>
  ),
  ErrorMessage: ({ error }) => (
    <MyAlert color="danger">{error}</MyAlert>
  ),
};

export default function Login() {
  return <LoginPage authClient={authClient} components={components} />;
}
```

For Joy UI, use the pre-built `joyLoginComponents` from `@cfast/joy` instead of writing custom slots.

### Redirect Flow

The full redirect cycle:

1. **User visits `/dashboard/settings` unauthenticated** — the `_protected` layout loader calls `auth.requireUser(request)` — sets a `cfast_redirect_to=/dashboard/settings` cookie — throws a redirect to `/login`.

2. **User is on `/login`** — enters email — clicks "Send Magic Link" or "Sign in with Passkey".

3. **Magic Link path:** user clicks link in email — hits `/auth/callback` (injected by plugin) — server verifies token, creates session, reads `cfast_redirect_to` cookie, clears it, redirects to `/dashboard/settings`.

4. **Passkey path:** WebAuthn ceremony completes on client — server verifies, creates session — client-side redirect reads cookie and navigates to `/dashboard/settings`.

5. **Direct visit to `/login`** (no prior redirect) — no cookie set — after login, redirects to the `afterLogin` default from config (defaults to `/`).

The `cfast_redirect_to` cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, with a 10-minute TTL.

### useAuth Hook

`useAuth()` provides auth actions from the `AuthClientProvider` context. Takes no arguments.

```typescript
import { useAuth } from "@cfast/auth/client";

const {
  signOut,            // Sign out the current user
  registerPasskey,    // Register a new passkey (WebAuthn)
  deletePasskey,      // Delete a passkey by ID
  stopImpersonating,  // Stop impersonating (admin only)
  authClient,         // Raw Better Auth client for escape-hatch usage
} = useAuth();
```

### Authentication Methods

#### Magic Email Link
```typescript
// Server: send magic link
await auth.sendMagicLink({ email: "user@example.com" });

// With custom callback URL:
await auth.sendMagicLink({ email: "user@example.com", callbackURL: "/welcome" });

// The link hits /auth/callback (injected by plugin)
// Auth handles verification and creates/updates the user + session automatically
```

#### Passkeys (WebAuthn)
```typescript
// Client: register a passkey (from a settings page, after login)
import { useAuth } from "@cfast/auth/client";

function SecuritySettings({ passkeys }) {
  // passkeys come from loader data (server query), not from the hook
  const { registerPasskey, deletePasskey } = useAuth();

  return (
    <div>
      <button onClick={() => registerPasskey()}>Add Passkey</button>
      {passkeys.map((pk) => (
        <div key={pk.id}>
          {pk.name} - {pk.createdAt}
          <button onClick={() => deletePasskey(pk.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

// Client: sign in with passkey (from the login page, handled by LoginPage component)
// The LoginPage component manages the WebAuthn ceremony internally
```

### Role Management

Roles are shared with `@cfast/permissions`. Assigning a role to a user immediately changes what they can do across the entire app:

```typescript
// Promote a user to editor
await auth.setRole(userId, "editor");

// Assign multiple roles
await auth.setRoles(userId, ["editor", "moderator"]);

// In React Router loaders, the user's roles are always available:
export async function loader({ request }) {
  const user = await auth.requireUser(request);
  // user.roles -> ["editor"]
  // This user object feeds into createDb({ user }) — it determines
  // which permission grants apply to every Operation
}
```

### Role Grant Rules

Control who can assign which roles. An editor shouldn't be able to promote someone to admin:

```typescript
export const auth = createAuth({
  permissions,
  roleGrants: {
    admin: ["admin", "editor", "user"],  // Admins can assign any role
    editor: ["user"],                     // Editors can only assign "user"
    // Users can't assign roles at all (not listed)
  },
});
```

### User Impersonation

For debugging and support. Admins can see exactly what a user sees:

```typescript
// Server: start impersonation (requires admin role by default)
await auth.impersonate(adminUserId, targetUserId);

// The admin's session now behaves as the target user
// All permission checks use the target user's roles
// An "impersonating" flag is set so the UI can show a banner

// Client: check impersonation state via useCurrentUser
const user = useCurrentUser();
// user.isImpersonating — true when admin is impersonating
// user.realUser — { id, name } of the admin doing the impersonating

// Client: stop impersonating via useAuth
const { stopImpersonating } = useAuth();
await stopImpersonating();
```

## Email Templates

Auth emails (magic links) can use custom HTML templates. The template function receives the magic link URL and email address and returns an HTML string:

```typescript
createAuth({
  // ...
  templates: {
    magicLink: ({ url, email }) =>
      `<p>Hi ${email}, <a href="${url}">click here to sign in</a>.</p>`,
  },
});
```

Templates are plain functions returning strings — no React or Node.js dependencies required, so they work in Workers.

## Package Exports

```
@cfast/auth
├── .                  → Server: createAuth, createRoleManager,
│                        createImpersonationManager, createAuthRouteHandlers, types
├── /client            → Client: AuthProvider, AuthClientProvider, AuthGuard,
│                        LoginPage, useCurrentUser, useAuth, createAuthClient,
│                        LoginComponents, UseAuthReturn, AuthClientInstance types
├── /plugin            → Route helper: authRoutes() for routes.ts
└── /schema            → Drizzle schema: auth tables for migrations
```

Server code stays out of client bundles. The `/plugin` entrypoint is only used in `routes.ts` (build-time). The `/schema` entrypoint lets `@cfast/db` include auth tables in migrations without importing the full auth package.

## Integration

The auth → db → operations flow:

```typescript
// In a React Router loader:
export async function loader({ request, context }) {
  const user = await auth.requireUser(request);

  const db = createDb({
    d1: context.env.DB,
    schema,
    permissions,
    user, // ← from auth. Determines which grants apply to every Operation.
  });

  // Operations now check permissions against this user's roles automatically
  const posts = db.query(postsTable).findMany();
  const results = await posts.run(); // permission filters applied based on user.roles
  return { user, posts: results };
}
```

Changing a user's role (via `auth.setRole`) immediately affects which Operations they can run. No cache to clear, no separate sync step — the next `createDb({ user })` call picks up the new roles.

## Schema

`@cfast/auth` adds its tables to your Drizzle schema automatically. The tables follow Better Auth conventions but are managed through cfast's migration system:

- `user` - Users with email, name, avatar
- `session` - Active sessions
- `passkey` - Registered WebAuthn credentials
- `role` - User-to-role assignments
- `impersonation_log` - Audit trail for impersonation events
