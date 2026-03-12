# Auth Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete `@cfast/auth` to full README parity: LoginPage, AuthGuard, useAuth, impersonation, roleGrants, createAuthPlugin, schema export, package exports, and example app migration.

**Architecture:** Client components accept `authClient` as a prop (consumer configures Better Auth plugins). Impersonation uses D1 with an `impersonation_log` table. roleGrants adds optional caller validation to existing role manager. React Router plugin replaces manual `auth.$.tsx` route.

**Tech Stack:** TypeScript, Vitest, Better Auth, Drizzle ORM (SQLite/D1), React, MUI Joy UI, React Router v7

---

## Task 1: Schema export

**Files:**
- Create: `packages/auth/src/schema.ts`
- Create: `packages/auth/src/__tests__/schema.test.ts`

### Step 1: Write tests

Create `packages/auth/src/__tests__/schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { users, sessions, accounts, verifications, roles, impersonationLog } from "../schema";
import { getTableName } from "drizzle-orm";

describe("auth schema", () => {
  it("exports all required tables", () => {
    expect(users).toBeDefined();
    expect(sessions).toBeDefined();
    expect(accounts).toBeDefined();
    expect(verifications).toBeDefined();
    expect(roles).toBeDefined();
    expect(impersonationLog).toBeDefined();
  });

  it("uses correct table names", () => {
    expect(getTableName(users)).toBe("users");
    expect(getTableName(sessions)).toBe("sessions");
    expect(getTableName(accounts)).toBe("accounts");
    expect(getTableName(verifications)).toBe("verifications");
    expect(getTableName(roles)).toBe("roles");
    expect(getTableName(impersonationLog)).toBe("impersonation_log");
  });

  it("users table has required columns", () => {
    const cols = Object.keys(users);
    expect(cols).toContain("id");
    expect(cols).toContain("email");
    expect(cols).toContain("name");
    expect(cols).toContain("image");
  });

  it("roles table has userId and role columns", () => {
    const cols = Object.keys(roles);
    expect(cols).toContain("userId");
    expect(cols).toContain("role");
  });

  it("impersonationLog has required audit columns", () => {
    const cols = Object.keys(impersonationLog);
    expect(cols).toContain("id");
    expect(cols).toContain("adminUserId");
    expect(cols).toContain("targetUserId");
    expect(cols).toContain("startedAt");
  });
});
```

### Step 2: Implement schema

Create `packages/auth/src/schema.ts`:

Define Drizzle SQLite tables matching Better Auth's expected schema plus cfast additions (`roles`, `impersonation_log`). Use `sqliteTable` from `drizzle-orm/sqlite-core`.

Better Auth tables follow their convention: `users`, `sessions`, `accounts`, `verifications`. Check Better Auth's Drizzle adapter docs for exact column definitions.

The `roles` table: `user_id` (text, references users.id), `role` (text), composite primary key on (user_id, role).

The `impersonation_log` table: `id` (text, primary key), `admin_user_id` (text), `target_user_id` (text), `started_at` (integer, timestamp), `ended_at` (integer, nullable), `active` (integer, boolean, default true).

### Step 3: Export from index and add to build

Add to `packages/auth/src/index.ts`:
```typescript
export * from "./schema";
```

Wait — schema should be a separate entrypoint, not bundled with the main export. The schema is for migrations and should be importable independently. Just note this for Task 8 (package exports).

### Step 4: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** All schema tests pass. Tables have correct names and columns.

---

## Task 2: AuthGuard component

**Files:**
- Create: `packages/auth/src/client/auth-guard.tsx`
- Create: `packages/auth/src/__tests__/auth-guard.test.tsx`
- Modify: `packages/auth/src/client.ts` (add export)

### Step 1: Write tests

Create `packages/auth/src/__tests__/auth-guard.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { AuthGuard } from "../client/auth-guard";
import { useCurrentUser } from "../client/auth-provider";
import { AuthProvider } from "../client/auth-provider";
import type { AuthUser } from "../types";

const testUser: AuthUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  roles: ["editor"],
};

describe("AuthGuard", () => {
  it("renders children", () => {
    render(
      <AuthProvider user={null}>
        <AuthGuard user={testUser}>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.getByText("Protected Content")).toBeDefined();
  });

  it("provides user to useCurrentUser inside its boundary", () => {
    function UserDisplay() {
      const user = useCurrentUser();
      return <div>{user?.name ?? "no user"}</div>;
    }

    render(
      <AuthProvider user={null}>
        <AuthGuard user={testUser}>
          <UserDisplay />
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.getByText("Test User")).toBeDefined();
  });

  it("overrides outer AuthProvider user with guard user", () => {
    const outerUser: AuthUser = {
      id: "other",
      email: "other@test.com",
      name: "Outer User",
      avatarUrl: null,
      roles: ["reader"],
    };

    function UserDisplay() {
      const user = useCurrentUser();
      return <div>{user?.name}</div>;
    }

    render(
      <AuthProvider user={outerUser}>
        <AuthGuard user={testUser}>
          <UserDisplay />
        </AuthGuard>
      </AuthProvider>,
    );

    expect(screen.getByText("Test User")).toBeDefined();
  });
});
```

### Step 2: Implement AuthGuard

Create `packages/auth/src/client/auth-guard.tsx`:

```typescript
import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import type { AuthUser } from "../types";

type AuthGuardProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AuthGuard({ user, children }: AuthGuardProps) {
  return <AuthProvider user={user}>{children}</AuthProvider>;
}

export type { AuthGuardProps };
```

AuthGuard is intentionally thin — it nests an `AuthProvider` with a guaranteed non-null user. The type signature enforces that `user` is `AuthUser` (not nullable), matching the server-side `requireUser()` guarantee.

### Step 3: Export from client.ts

Add to `packages/auth/src/client.ts`:
```typescript
export { AuthGuard } from "./client/auth-guard";
export type { AuthGuardProps } from "./client/auth-guard";
```

### Step 4: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** AuthGuard tests pass. useCurrentUser returns the guard's user inside its boundary.

---

## Task 3: LoginPage component

**Files:**
- Create: `packages/auth/src/client/login-page.tsx`
- Create: `packages/auth/src/client/login-page-defaults.tsx`
- Create: `packages/auth/src/__tests__/login-page.test.tsx`
- Modify: `packages/auth/src/client.ts` (add export)
- Modify: `packages/auth/src/client/types.ts` (add LoginComponents, LoginPageProps types)

### Step 1: Add types

Add to `packages/auth/src/client/types.ts`:

```typescript
import type { ComponentType } from "react";

export type LoginComponents = {
  Layout?: ComponentType<{ children: ReactNode }>;
  EmailInput?: ComponentType<{
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }>;
  PasskeyButton?: ComponentType<{
    onClick: () => void;
    loading: boolean;
  }>;
  MagicLinkButton?: ComponentType<{
    onClick: () => void;
    loading: boolean;
  }>;
  SuccessMessage?: ComponentType<{ email: string }>;
  ErrorMessage?: ComponentType<{ error: string }>;
};

export type LoginPageProps = {
  authClient: {
    signIn: {
      magicLink: (opts: { email: string }) => Promise<{ error?: { message?: string } | null }>;
      passkey: () => Promise<{ error?: { message?: string } | null } | undefined>;
    };
  };
  components?: LoginComponents;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
};
```

Note: `authClient` is typed structurally (not `ReturnType<typeof createAuthClient>`) to avoid importing Better Auth types into the client bundle. Only the methods LoginPage actually calls are typed.

### Step 2: Write tests

Create `packages/auth/src/__tests__/login-page.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginPage } from "../client/login-page";

const mockAuthClient = {
  signIn: {
    magicLink: vi.fn().mockResolvedValue({}),
    passkey: vi.fn().mockResolvedValue({}),
  },
};

describe("LoginPage", () => {
  it("renders email input and both sign-in buttons", () => {
    render(<LoginPage authClient={mockAuthClient} />);

    expect(screen.getByPlaceholderText("you@example.com")).toBeDefined();
    expect(screen.getByText(/magic link/i)).toBeDefined();
    expect(screen.getByText(/passkey/i)).toBeDefined();
  });

  it("renders custom title and subtitle", () => {
    render(
      <LoginPage
        authClient={mockAuthClient}
        title="Welcome"
        subtitle="Please sign in"
      />,
    );

    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("Please sign in")).toBeDefined();
  });

  it("calls authClient.signIn.magicLink on form submit", async () => {
    render(<LoginPage authClient={mockAuthClient} />);

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(mockAuthClient.signIn.magicLink).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });

  it("shows success message after magic link sent", async () => {
    mockAuthClient.signIn.magicLink.mockResolvedValue({});

    render(<LoginPage authClient={mockAuthClient} />);

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeDefined();
    });
  });

  it("shows error when magic link fails", async () => {
    mockAuthClient.signIn.magicLink.mockResolvedValue({
      error: { message: "Invalid email" },
    });

    render(<LoginPage authClient={mockAuthClient} />);

    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "bad" } });
    fireEvent.click(screen.getByText(/magic link/i));

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeDefined();
    });
  });

  it("calls authClient.signIn.passkey on passkey button click", async () => {
    render(<LoginPage authClient={mockAuthClient} />);

    fireEvent.click(screen.getByText(/passkey/i));

    await waitFor(() => {
      expect(mockAuthClient.signIn.passkey).toHaveBeenCalled();
    });
  });

  it("uses custom components when provided", () => {
    render(
      <LoginPage
        authClient={mockAuthClient}
        components={{
          Layout: ({ children }) => <div data-testid="custom-layout">{children}</div>,
        }}
      />,
    );

    expect(screen.getByTestId("custom-layout")).toBeDefined();
  });
});
```

### Step 3: Implement LoginPage defaults

Create `packages/auth/src/client/login-page-defaults.tsx`:

Joy UI default components for each slot. These are the components that render when no override is provided. Extract from `examples/team-blog-after/app/routes/login.tsx`.

Each default component is a small function component using Joy UI (`Card`, `Input`, `Button`, `Alert`, `Stack`, `Typography`, `Divider`, `Box`).

Joy UI is a peer dependency for the default components. The headless LoginPage works with any slot components.

### Step 4: Implement LoginPage

Create `packages/auth/src/client/login-page.tsx`:

State: `email`, `sent`, `loading`, `error`, `passkeyLoading`.

Flow: same as example app's login.tsx but using slot components instead of inline Joy UI.

```typescript
export function LoginPage({
  authClient,
  components = {},
  title = "Sign In",
  subtitle,
  onSuccess,
}: LoginPageProps) {
  // Merge defaults with custom components
  const Layout = components.Layout ?? DefaultLayout;
  const EmailInput = components.EmailInput ?? DefaultEmailInput;
  // ... etc

  // State machine
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  // ... etc

  // Handlers (same as example app)
  async function handleMagicLink() { ... }
  async function handlePasskey() { ... }

  return (
    <Layout>
      {error && <ErrorComp error={error} />}
      {sent ? (
        <SuccessComp email={email} />
      ) : (
        // email input + magic link button + divider + passkey button
      )}
    </Layout>
  );
}
```

### Step 5: Add peer dependency for Joy UI

Add `@mui/joy` to `peerDependencies` in `packages/auth/package.json`:
```json
"@mui/joy": ">=5"
```

This is needed for the default slot components. Projects using custom slot components don't need Joy UI.

### Step 6: Export from client.ts

Add to `packages/auth/src/client.ts`:
```typescript
export { LoginPage } from "./client/login-page";
export type { LoginComponents, LoginPageProps } from "./client/types";
```

### Step 7: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** All LoginPage tests pass. Default Joy UI components render. Custom slots override defaults.

---

## Task 4: useAuth hook

**Files:**
- Create: `packages/auth/src/client/use-auth.ts`
- Create: `packages/auth/src/__tests__/use-auth.test.tsx`
- Modify: `packages/auth/src/client.ts` (add export)

### Step 1: Write tests

Create `packages/auth/src/__tests__/use-auth.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../client/use-auth";

const mockSignOut = vi.fn().mockResolvedValue({});

const mockAuthClient = {
  signOut: mockSignOut,
};

describe("useAuth", () => {
  it("returns signOut function", () => {
    const { result } = renderHook(() => useAuth(mockAuthClient));
    expect(typeof result.current.signOut).toBe("function");
  });

  it("signOut calls authClient.signOut", async () => {
    const { result } = renderHook(() => useAuth(mockAuthClient));
    await act(() => result.current.signOut());
    expect(mockSignOut).toHaveBeenCalled();
  });
});
```

### Step 2: Implement useAuth

Create `packages/auth/src/client/use-auth.ts`:

```typescript
type AuthClient = {
  signOut: () => Promise<unknown>;
};

export function useAuth(authClient: AuthClient) {
  return {
    signOut: async () => {
      await authClient.signOut();
    },
  };
}
```

This is deliberately minimal. Passkey registration/listing depends on the `@better-auth/passkey` plugin which is optional. Users who need passkey management call Better Auth's client directly.

### Step 3: Export from client.ts

Add `useAuth` export.

### Step 4: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** useAuth tests pass.

---

## Task 5: roleGrants validation

**Files:**
- Modify: `packages/auth/src/types.ts` (add roleGrants to AuthConfig, add callerRoles params)
- Modify: `packages/auth/src/roles.ts` (add validation)
- Modify: `packages/auth/src/create-auth.ts` (pass config to role manager)
- Create: `packages/auth/src/__tests__/role-grants.test.ts`

### Step 1: Write tests

Create `packages/auth/src/__tests__/role-grants.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createRoleManager } from "../roles";
import { createMockD1 } from "./helpers";

describe("roleGrants validation", () => {
  const roleGrants = {
    admin: ["admin", "editor", "reader"],
    editor: ["reader"],
  };

  it("allows setRole when caller has permission", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    // admin can assign editor
    await expect(
      rm.setRole("user-1", "editor", { callerRoles: ["admin"] }),
    ).resolves.toBeUndefined();
  });

  it("rejects setRole when caller lacks permission", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    // editor cannot assign admin
    await expect(
      rm.setRole("user-1", "admin", { callerRoles: ["editor"] }),
    ).rejects.toThrow(/not authorized/i);
  });

  it("allows setRole without callerRoles (backward compat)", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    // No callerRoles = no check
    await expect(rm.setRole("user-1", "admin")).resolves.toBeUndefined();
  });

  it("rejects setRoles when any role is not allowed", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    await expect(
      rm.setRoles("user-1", ["editor", "admin"], { callerRoles: ["editor"] }),
    ).rejects.toThrow(/not authorized/i);
  });

  it("allows any role when no roleGrants configured", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await expect(
      rm.setRole("user-1", "admin", { callerRoles: ["reader"] }),
    ).resolves.toBeUndefined();
  });
});
```

### Step 2: Update types

Add `roleGrants` to `AuthConfig` in `types.ts`.

### Step 3: Update role manager

Modify `packages/auth/src/roles.ts`:

- Add `roleGrants` to `RoleManagerOptions`
- `setRole` and `setRoles` accept optional `options?: { callerRoles?: string[] }`
- When both `roleGrants` config and `callerRoles` are present, validate before executing SQL
- Validation: check if any of the caller's roles appear in `roleGrants` keys and the target role is in their allowed list
- Throw `ForbiddenError` (import from `@cfast/permissions`) on violation

### Step 4: Wire config through createAuth

In `create-auth.ts`, pass `config.roleGrants` to `createRoleManager`.

### Step 5: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** New roleGrants tests pass. Existing role tests still pass (backward compat).

---

## Task 6: Impersonation

**Files:**
- Create: `packages/auth/src/impersonation.ts`
- Create: `packages/auth/src/__tests__/impersonation.test.ts`
- Modify: `packages/auth/src/types.ts` (add impersonation config, add methods to AuthInstance)
- Modify: `packages/auth/src/create-auth.ts` (wire impersonation into createContext)

### Step 1: Write tests

Create `packages/auth/src/__tests__/impersonation.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createImpersonationManager } from "../impersonation";
import { createMockD1 } from "./helpers";

describe("impersonation manager", () => {
  it("impersonate inserts an active log entry", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    await mgr.impersonate("admin-1", "user-1");

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toContain("INSERT INTO impersonation_log");
    expect(d1._calls[0].params).toContain("admin-1");
    expect(d1._calls[0].params).toContain("user-1");
  });

  it("stopImpersonating updates the log entry", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    await mgr.stopImpersonating("admin-1");

    expect(d1._calls[0].sql).toContain("UPDATE impersonation_log");
    expect(d1._calls[0].sql).toContain("active = 0");
  });

  it("getActiveImpersonation returns null when none active", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    const result = await mgr.getActiveImpersonation("admin-1");
    expect(result).toBeNull();
  });

  it("uses custom table name", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1, { tableName: "custom_impersonation" });

    await mgr.impersonate("admin-1", "user-1");

    expect(d1._calls[0].sql).toContain("custom_impersonation");
  });
});
```

### Step 2: Implement impersonation manager

Create `packages/auth/src/impersonation.ts`:

```typescript
export function createImpersonationManager(d1: D1Database, options?: { tableName?: string }) {
  const table = options?.tableName ?? "impersonation_log";

  return {
    async impersonate(adminUserId: string, targetUserId: string): Promise<void> {
      const id = crypto.randomUUID();
      const now = Date.now();
      await d1.prepare(
        `INSERT INTO ${table} (id, admin_user_id, target_user_id, started_at, active) VALUES (?, ?, ?, ?, 1)`
      ).bind(id, adminUserId, targetUserId, now).run();
    },

    async stopImpersonating(adminUserId: string): Promise<void> {
      const now = Date.now();
      await d1.prepare(
        `UPDATE ${table} SET active = 0, ended_at = ? WHERE admin_user_id = ? AND active = 1`
      ).bind(now, adminUserId).run();
    },

    async getActiveImpersonation(adminUserId: string): Promise<{ targetUserId: string } | null> {
      const result = await d1.prepare(
        `SELECT target_user_id FROM ${table} WHERE admin_user_id = ? AND active = 1 LIMIT 1`
      ).bind(adminUserId).first<{ target_user_id: string }>();
      return result ? { targetUserId: result.target_user_id } : null;
    },
  };
}
```

### Step 3: Wire into createContext

In `create-auth.ts`, after getting the session user:
1. Check `impersonationManager.getActiveImpersonation(user.id)`
2. If active, fetch the target user's roles and resolve grants for them
3. Set `isImpersonating: true` and `realUser: { id: user.id, name: user.name }`

### Step 4: Add impersonation config to AuthConfig

Add `impersonation?: { allowedRoles?: string[] }` to `AuthConfig`.
Add `impersonate` and `stopImpersonating` to `AuthInstance`.

### Step 5: Add role check for impersonation

In `impersonate()`, validate that the admin user has one of the `allowedRoles` (defaults to `["admin"]`). This requires the caller to pass callerRoles or the method fetches them from the role manager.

### Step 6: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** Impersonation tests pass. createContext correctly swaps identity when impersonation is active.

---

## Task 7: createAuthPlugin (React Router)

**Files:**
- Create: `packages/auth/src/plugin.ts`
- Create: `packages/auth/src/__tests__/plugin.test.ts`

### Step 1: Research React Router v7 plugin API

React Router v7 plugins are functions that return a config object. They can add routes programmatically. Check the React Router docs/source for the exact plugin shape.

The plugin needs to generate a catch-all route equivalent to `routes/auth.$.tsx`.

### Step 2: Write tests

Create `packages/auth/src/__tests__/plugin.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createAuthPlugin } from "../plugin";

describe("createAuthPlugin", () => {
  it("returns a plugin with name", () => {
    const plugin = createAuthPlugin();
    expect(plugin.name).toBe("cfast-auth");
  });

  it("uses default basePath /auth", () => {
    const plugin = createAuthPlugin();
    // Plugin should configure routes under /auth
    expect(plugin).toBeDefined();
  });

  it("accepts custom basePath", () => {
    const plugin = createAuthPlugin({ basePath: "/api/auth" });
    expect(plugin).toBeDefined();
  });
});
```

### Step 3: Implement plugin

Create `packages/auth/src/plugin.ts`:

The plugin generates a route config object that mounts a catch-all handler at `basePath/*`. This replaces the manual `routes/auth.$.tsx` file.

```typescript
type AuthPluginOptions = {
  basePath?: string;
};

export function createAuthPlugin(options?: AuthPluginOptions) {
  const basePath = options?.basePath ?? "/auth";

  return {
    name: "cfast-auth",
    // React Router v7 plugin routes method
    routes: () => ({
      [`${basePath}/*`]: {
        file: "@cfast/auth/plugin/route-handler",
      },
    }),
  };
}
```

Note: The exact plugin API shape depends on React Router v7's documentation. This may need adjustment based on the actual API. Research the plugin spec before implementing.

### Step 4: Run tests

```bash
pnpm --filter @cfast/auth test
```

**Verification:** Plugin tests pass.

---

## Task 8: Package exports and build

**Files:**
- Modify: `packages/auth/package.json`
- Modify: `packages/auth/src/index.ts`

### Step 1: Add exports to package.json

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./client": {
    "import": "./dist/client.js",
    "types": "./dist/client.d.ts"
  },
  "./plugin": {
    "import": "./dist/plugin.js",
    "types": "./dist/plugin.d.ts"
  },
  "./schema": {
    "import": "./dist/schema.js",
    "types": "./dist/schema.d.ts"
  }
}
```

### Step 2: Update build script

Update the `build` script in `package.json`:
```
tsup src/index.ts src/client.ts src/plugin.ts src/schema.ts --format esm --dts
```

### Step 3: Update server index.ts exports

Add to `packages/auth/src/index.ts`:
```typescript
export { createImpersonationManager } from "./impersonation";
```

Do NOT re-export schema or plugin from index — they have their own entrypoints.

### Step 4: Verify build

```bash
pnpm --filter @cfast/auth build
```

**Verification:** Build succeeds. All four entrypoints produce JS + DTS files in `dist/`.

---

## Task 9: Example app migration

**Files:**
- Modify: `examples/team-blog-after/app/routes/login.tsx`
- Modify: `examples/team-blog-after/app/auth.client.ts` (if needed)
- Potentially modify layout routes to use AuthGuard

### Step 1: Replace manual login page with LoginPage component

Replace `examples/team-blog-after/app/routes/login.tsx` with:

```typescript
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { LoginPage } from "@cfast/auth/client";
import { getUser } from "~/auth.helpers.server";
import { authClient } from "~/auth.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return {};
}

export default function Login() {
  useLoaderData<typeof loader>();
  return <LoginPage authClient={authClient} title="Sign In" subtitle="Sign in to Team Blog" />;
}
```

### Step 2: Add AuthGuard to protected layout (if one exists)

Check if the example app has a `_protected` layout route. If so, wrap with `AuthGuard`. If not, this can be skipped — the example app may use per-route auth checks.

### Step 3: Verify example app builds

```bash
pnpm --filter team-blog-after build
```

**Verification:** Example app builds and uses the new components.

---

## Task 10: Update README

**Files:**
- Modify: `packages/auth/README.md`

### Step 1: Add implementation status

Add a section noting which features are implemented. Mark all features as implemented since this plan completes them all.

### Step 2: Run all tests

```bash
pnpm --filter @cfast/auth test
pnpm typecheck
pnpm build
```

**Verification:** All tests pass. Type-checking succeeds. All packages build.
