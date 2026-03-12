# Auth Gaps Design — 2026-03-12

Close the gaps between the `@cfast/auth` README spec and the actual implementation.

## Changes

### 1. AuthClientProvider + useAuth overhaul

Add `AuthClientProvider` context that holds the Better Auth client instance. Separate from `AuthProvider` (which holds user data from loaders).

```typescript
// root.tsx
<AuthClientProvider authClient={authClient}>
  <AuthProvider loginPath="/login">
    <Outlet />
  </AuthProvider>
</AuthClientProvider>
```

`useAuth()` reads from `AuthClientProvider` context and returns:
- `signOut()` — delegates to `authClient.signOut()`
- `registerPasskey()` — delegates to `authClient.passkey.addPasskey()`
- `deletePasskey(id)` — delegates to `authClient.passkey.deletePasskey({ id })`
- `stopImpersonating()` — delegates to `authClient.admin.stopImpersonating()`
- `authClient` — the raw client, for escape-hatch usage

Passkeys list is NOT included — it's server data that belongs in loaders, not a client hook.

### 2. useCurrentUser impersonation naming

- Keep `realUser` as the field name on `AuthUser` (it's correct — the real user is doing the impersonating)
- Update README: change `impersonatedUser` → `realUser`
- `stopImpersonating` is available via `useAuth()`, not `useCurrentUser()`
- Update README to show `const { stopImpersonating } = useAuth()` pattern

### 3. AuthGuard signature

Keep current implementation: `AuthGuard` takes `user` prop explicitly. Update README to show `<AuthGuard user={user}>` pattern matching actual usage.

### 4. Email templates config

Add `templates` to `AuthConfig`:
```typescript
templates?: {
  magicLink?: (props: { url: string; email: string }) => string;
};
```

Functions return HTML strings (not React components — avoids Node.js dependency on `react-email/render` in Workers). When `templates.magicLink` is provided alongside `magicLink.sendMagicLink`, the template output is available to the send function.

In `createAuth`, if user provides `email` config (provider/apiKey/etc) but no custom `magicLink.sendMagicLink`, we wire up the template automatically. If they provide both `sendMagicLink` and `templates`, the template is available as a parameter to `sendMagicLink`.

### 5. sendMagicLink on AuthInstance

Expose on `AuthInstance`:
```typescript
sendMagicLink: (params: { email: string; callbackURL?: string }) => Promise<void>
```

Delegates to Better Auth's `auth.api.signInMagicLink()`.

### 6. README updates

- Document `AuthClientProvider` setup in root
- `useAuth()` → zero args, requires `AuthClientProvider`
- Passkeys list comes from loader data, not hook
- `AuthGuard` takes `user` prop
- `impersonatedUser` → `realUser`
- `stopImpersonating` via `useAuth()` not `useCurrentUser()`
- `templates` uses `(props) => string` not React component

## Files to modify

- `packages/auth/src/client/auth-client-provider.tsx` — NEW: context + provider + `useAuth` hook
- `packages/auth/src/client/use-auth.ts` — DELETE (replaced by auth-client-provider)
- `packages/auth/src/client/types.ts` — add `AuthClientProviderProps`, update exports
- `packages/auth/src/client.ts` — update exports
- `packages/auth/src/types.ts` — add `templates` to `AuthConfig`, `sendMagicLink` to `AuthInstance`
- `packages/auth/src/create-auth.ts` — wire templates + expose `sendMagicLink`
- `packages/auth/src/__tests__/use-auth.test.tsx` — rewrite for new API
- `packages/auth/README.md` — update all documented examples
- `examples/team-blog-after/app/root.tsx` — wrap with `AuthClientProvider`
- `examples/team-blog-after/app/routes/profile.tsx` — use `useAuth()` instead of direct `authClient`
