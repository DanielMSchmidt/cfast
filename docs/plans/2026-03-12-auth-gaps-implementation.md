# Auth Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all gaps between the @cfast/auth README spec and the actual implementation.

**Architecture:** Add `AuthClientProvider` context for the Better Auth client. Extend `useAuth` to provide passkey/impersonation methods from context. Add `templates` to `AuthConfig` and `sendMagicLink` to `AuthInstance`. Update README to match actual behavior where the README was wrong.

**Tech Stack:** React context, Better Auth client, TypeScript, vitest + @testing-library/react

---

### Task 1: AuthClientProvider + useAuth rewrite

**Files:**
- Create: `packages/auth/src/client/auth-client-provider.tsx`
- Delete: `packages/auth/src/client/use-auth.ts`
- Modify: `packages/auth/src/client/types.ts`
- Modify: `packages/auth/src/client.ts`
- Rewrite: `packages/auth/src/__tests__/use-auth.test.tsx`

**Step 1: Define the AuthClient type and AuthClientProviderProps in types.ts**

Add to `packages/auth/src/client/types.ts`:

```typescript
export type AuthClientInstance = {
  signOut: () => Promise<unknown>;
  passkey?: {
    addPasskey: () => Promise<{ error?: { message?: string } | null } | undefined>;
    deletePasskey: (opts: { id: string }) => Promise<{ error?: { message?: string } | null } | undefined>;
  };
  admin?: {
    stopImpersonating: () => Promise<unknown>;
  };
};

export type AuthClientProviderProps = {
  authClient: AuthClientInstance;
  children: ReactNode;
};

export type UseAuthReturn = {
  signOut: () => Promise<void>;
  registerPasskey: () => Promise<{ error?: { message?: string } | null } | undefined>;
  deletePasskey: (id: string) => Promise<{ error?: { message?: string } | null } | undefined>;
  stopImpersonating: () => Promise<void>;
  authClient: AuthClientInstance;
};
```

**Step 2: Create auth-client-provider.tsx**

```typescript
import { createContext, useContext } from "react";
import type { AuthClientInstance, AuthClientProviderProps, UseAuthReturn } from "./types";

const AuthClientContext = createContext<AuthClientInstance | null>(null);

export function AuthClientProvider({ authClient, children }: AuthClientProviderProps) {
  return (
    <AuthClientContext.Provider value={authClient}>
      {children}
    </AuthClientContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const authClient = useContext(AuthClientContext);
  if (authClient === null) {
    throw new Error("useAuth must be used within an <AuthClientProvider>");
  }

  return {
    signOut: async () => {
      await authClient.signOut();
    },
    registerPasskey: async () => {
      if (!authClient.passkey) {
        throw new Error("Passkey plugin not configured on auth client");
      }
      return authClient.passkey.addPasskey();
    },
    deletePasskey: async (id: string) => {
      if (!authClient.passkey) {
        throw new Error("Passkey plugin not configured on auth client");
      }
      return authClient.passkey.deletePasskey({ id });
    },
    stopImpersonating: async () => {
      if (!authClient.admin) {
        throw new Error("Admin plugin not configured on auth client");
      }
      await authClient.admin.stopImpersonating();
    },
    authClient,
  };
}
```

**Step 3: Delete use-auth.ts**

Remove `packages/auth/src/client/use-auth.ts`.

**Step 4: Update client.ts exports**

Replace `useAuth` export source from `./client/use-auth` to `./client/auth-client-provider`. Add `AuthClientProvider` export.

```typescript
export { AuthProvider, useCurrentUser, useLoginPath } from "./client/auth-provider";
export { AuthGuard } from "./client/auth-guard";
export { AuthClientProvider, useAuth } from "./client/auth-client-provider";
export { LoginPage } from "./client/login-page";
export { createAuthClient, magicLinkClient } from "./client/create-auth-client";
export type { AuthProviderProps, LoginComponents, LoginPageProps, AuthClientProviderProps, UseAuthReturn } from "./client/types";
export type { AuthGuardProps } from "./client/auth-guard";
```

**Step 5: Rewrite use-auth.test.tsx**

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthClientProvider, useAuth } from "../client/auth-client-provider";
import type { AuthClientInstance } from "../client/types";

function createMockAuthClient(overrides: Partial<AuthClientInstance> = {}): AuthClientInstance {
  return {
    signOut: vi.fn().mockResolvedValue({}),
    passkey: {
      addPasskey: vi.fn().mockResolvedValue({}),
      deletePasskey: vi.fn().mockResolvedValue({}),
    },
    admin: {
      stopImpersonating: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

function withProvider(authClient: AuthClientInstance) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthClientProvider authClient={authClient}>{children}</AuthClientProvider>;
  };
}

describe("useAuth", () => {
  it("throws when used outside AuthClientProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an <AuthClientProvider>"
    );
  });

  it("signOut delegates to authClient.signOut", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), { wrapper: withProvider(mockClient) });

    await act(() => result.current.signOut());
    expect(mockClient.signOut).toHaveBeenCalled();
  });

  it("registerPasskey delegates to authClient.passkey.addPasskey", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), { wrapper: withProvider(mockClient) });

    await act(() => result.current.registerPasskey());
    expect(mockClient.passkey!.addPasskey).toHaveBeenCalled();
  });

  it("registerPasskey throws when passkey plugin not configured", async () => {
    const mockClient = createMockAuthClient({ passkey: undefined });
    const { result } = renderHook(() => useAuth(), { wrapper: withProvider(mockClient) });

    await expect(act(() => result.current.registerPasskey())).rejects.toThrow(
      "Passkey plugin not configured"
    );
  });

  it("deletePasskey delegates with correct id", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), { wrapper: withProvider(mockClient) });

    await act(() => result.current.deletePasskey("pk-123"));
    expect(mockClient.passkey!.deletePasskey).toHaveBeenCalledWith({ id: "pk-123" });
  });

  it("stopImpersonating delegates to authClient.admin", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), { wrapper: withProvider(mockClient) });

    await act(() => result.current.stopImpersonating());
    expect(mockClient.admin!.stopImpersonating).toHaveBeenCalled();
  });

  it("exposes the raw authClient", () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), { wrapper: withProvider(mockClient) });

    expect(result.current.authClient).toBe(mockClient);
  });
});
```

**Step 6: Run tests**

Run: `pnpm --filter @cfast/auth test`
Expected: All tests pass

**Step 7: Commit**

```
feat(auth): add AuthClientProvider context and rewrite useAuth hook
```

---

### Task 2: Add templates to AuthConfig and sendMagicLink to AuthInstance

**Files:**
- Modify: `packages/auth/src/types.ts`
- Modify: `packages/auth/src/create-auth.ts`
- Modify: `packages/auth/src/__tests__/create-auth.test.ts`

**Step 1: Add templates to AuthConfig and sendMagicLink to AuthInstance in types.ts**

Add `templates` to `AuthConfig`:
```typescript
templates?: {
  magicLink?: (props: { url: string; email: string }) => string;
};
```

Add `sendMagicLink` to `AuthInstance`:
```typescript
sendMagicLink: (params: { email: string; callbackURL?: string }) => Promise<void>;
```

**Step 2: Implement sendMagicLink in create-auth.ts**

After the `betterAuth()` call, add sendMagicLink to the returned object:
```typescript
sendMagicLink: async (params: { email: string; callbackURL?: string }) => {
  await auth.api.signInMagicLink({
    body: {
      email: params.email,
      callbackURL: params.callbackURL ?? config.redirects?.afterLogin ?? "/",
    },
  });
},
```

**Step 3: Add test for sendMagicLink**

Add test to create-auth.test.ts verifying `sendMagicLink` calls `auth.api.signInMagicLink` with correct params.

**Step 4: Add test for templates config acceptance**

Verify `createAuth` accepts a `templates` config without error.

**Step 5: Run tests**

Run: `pnpm --filter @cfast/auth test`

**Step 6: Commit**

```
feat(auth): add templates config and sendMagicLink to AuthInstance
```

---

### Task 3: Update README to match implementation

**Files:**
- Modify: `packages/auth/README.md`

**Step 1: Update all README sections**

- Protecting Routes: show `<AuthGuard user={user}>` with `user` prop
- Client-Side Provider: show `AuthClientProvider` wrapping app with `authClient` prop
- useAuth: show zero-arg `useAuth()` returning `{ signOut, registerPasskey, deletePasskey, stopImpersonating }`
- Passkeys section: show passkeys coming from loader data, `useAuth()` for registerPasskey
- Impersonation: change `impersonatedUser` to `realUser`, show `stopImpersonating` from `useAuth()`
- Email Templates: change from React component to `(props) => string`
- Package Exports: add `AuthClientProvider` to `/client` exports
- Add `sendMagicLink` to server API section

**Step 2: Commit**

```
docs(auth): update README to match implemented API
```

---

### Task 4: Update example app

**Files:**
- Modify: `examples/team-blog-after/app/root.tsx`
- Modify: `examples/team-blog-after/app/routes/profile.tsx`

**Step 1: Wrap root.tsx with AuthClientProvider**

Import `AuthClientProvider` from `@cfast/auth/client` and `authClient` from `~/auth.client`. Wrap the `<Outlet />` in `App`:

```typescript
import { AuthClientProvider } from "@cfast/auth/client";
import { authClient } from "~/auth.client";

export default function App() {
  return (
    <AuthClientProvider authClient={authClient}>
      <Outlet />
    </AuthClientProvider>
  );
}
```

**Step 2: Update profile.tsx to use useAuth()**

Replace direct `authClient.passkey.*` calls with `useAuth()`:

```typescript
import { useAuth } from "@cfast/auth/client";

// Inside component:
const { registerPasskey, deletePasskey } = useAuth();

// handleAddPasskey:
const result = await registerPasskey();

// handleDeletePasskey:
const result = await deletePasskey(passkeyId);
```

Remove the `authClient` import from profile.tsx.

**Step 3: Run typecheck**

Run: `pnpm typecheck`

**Step 4: Commit**

```
refactor(example): use AuthClientProvider and useAuth hook in team-blog-after
```

---

### Task 5: Run full validation

**Step 1:** Run `pnpm --filter @cfast/auth test`
**Step 2:** Run `pnpm typecheck`
**Step 3:** Run `pnpm --filter @cfast/auth build`
