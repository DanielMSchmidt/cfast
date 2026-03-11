# Auth + Context System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `resolveGrants()` to permissions, refactor db to accept pre-resolved grants, and implement `@cfast/auth` as a thin Better Auth wrapper with `createContext()` for per-request identity + grant resolution.

**Architecture:** Three-layer change: (1) `@cfast/permissions` gets `resolveGrants()` that expands roles through hierarchy and merges grants with OR-semantics for WHERE clauses. (2) `@cfast/db` drops its dependency on `Permissions` and `role` — receives pre-resolved `Grant[]` instead. (3) `@cfast/auth` wraps Better Auth, adds role management, and provides `createContext()` / `requireUser()` that return `{ user, grants }`.

**Tech Stack:** TypeScript, Vitest, Better Auth, Drizzle ORM (SQLite/D1), Cloudflare Workers, React Router v7, MUI Joy UI

---

## Task 1: Add `resolveGrants()` to `@cfast/permissions`

**Files:**
- Modify: `packages/permissions/src/resolve-grants.ts` (create)
- Modify: `packages/permissions/src/index.ts`
- Test: `packages/permissions/src/__tests__/resolve-grants.test.ts` (create)

### Step 1: Write failing tests

Create `packages/permissions/src/__tests__/resolve-grants.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolveGrants } from "../resolve-grants";
import { definePermissions, grant } from "../index";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull(),
  published: integer("published", { mode: "boolean" }).default(false),
  flagged: integer("flagged", { mode: "boolean" }).default(false),
});

const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull(),
});

const permissions = definePermissions({
  roles: ["anonymous", "reader", "author", "moderator", "editor", "admin"] as const,
  hierarchy: {
    reader: ["anonymous"],
    author: ["reader"],
    editor: ["author"],
    admin: ["editor"],
  },
  grants: {
    anonymous: [
      grant("read", posts, {
        where: (cols: any) => sql`${cols.published} = 1`,
      }),
    ],
    reader: [
      grant("read", comments),
      grant("create", comments),
    ],
    author: [
      grant("create", posts),
      grant("update", posts, {
        where: (cols: any, user: any) => sql`${cols.authorId} = ${user.id}`,
      }),
      grant("delete", posts, {
        where: (cols: any, user: any) => sql`${cols.authorId} = ${user.id}`,
      }),
    ],
    moderator: [
      grant("update", posts, {
        where: (cols: any) => sql`${cols.flagged} = 1`,
      }),
      grant("delete", comments),
    ],
    editor: [
      grant("read", posts),  // unrestricted read (overrides anonymous WHERE)
      grant("update", posts), // unrestricted update
    ],
    admin: [
      grant("manage", "all"),
    ],
  },
});

describe("resolveGrants", () => {
  it("returns grants for a single role with no hierarchy", () => {
    const grants = resolveGrants(permissions, ["anonymous"]);
    expect(grants).toHaveLength(1);
    expect(grants[0].action).toBe("read");
    expect(grants[0].subject).toBe(posts);
    expect(grants[0].where).toBeDefined();
  });

  it("expands hierarchy and includes inherited grants", () => {
    const grants = resolveGrants(permissions, ["reader"]);
    // reader inherits anonymous: read posts (with WHERE)
    // reader own: read comments, create comments
    expect(grants).toHaveLength(3);
    const actions = grants.map((g) => `${g.action}:${(g.subject as any)._?.name ?? "all"}`);
    expect(actions).toContain("read:posts");
    expect(actions).toContain("read:comments");
    expect(actions).toContain("create:comments");
  });

  it("merges multiple roles by combining their grants", () => {
    // author + moderator (non-overlapping hierarchy)
    const grants = resolveGrants(permissions, ["author", "moderator"]);
    const actions = grants.map((g) => `${g.action}:${(g.subject as any)._?.name ?? "all"}`);
    // author has: read posts (WHERE published), read comments, create comments,
    //             create posts, update posts (WHERE authorId), delete posts (WHERE authorId)
    // moderator has: update posts (WHERE flagged), delete comments
    expect(actions).toContain("create:posts");
    expect(actions).toContain("delete:comments");
  });

  it("OR-merges WHERE clauses for same action+table across roles", () => {
    // author: update posts WHERE authorId = user.id
    // moderator: update posts WHERE flagged = 1
    // merged: single grant with OR'd WHERE
    const grants = resolveGrants(permissions, ["author", "moderator"]);
    const updatePosts = grants.filter(
      (g) => g.action === "update" && (g.subject as any)._?.name === "posts",
    );
    // Should be merged into one grant
    expect(updatePosts).toHaveLength(1);
    expect(updatePosts[0].where).toBeDefined();
  });

  it("unrestricted grant (no WHERE) overrides WHERE-restricted grants", () => {
    // editor has unrestricted "read posts" — should override anonymous "read posts WHERE published"
    const grants = resolveGrants(permissions, ["editor"]);
    const readPosts = grants.filter(
      (g) => g.action === "read" && (g.subject as any)._?.name === "posts",
    );
    expect(readPosts).toHaveLength(1);
    expect(readPosts[0].where).toBeUndefined();
  });

  it("unrestricted grant overrides WHERE-restricted when merging multiple roles", () => {
    // author: update posts WHERE authorId = user.id
    // editor (inherits author): update posts (unrestricted)
    const grants = resolveGrants(permissions, ["editor"]);
    const updatePosts = grants.filter(
      (g) => g.action === "update" && (g.subject as any)._?.name === "posts",
    );
    expect(updatePosts).toHaveLength(1);
    expect(updatePosts[0].where).toBeUndefined();
  });

  it("handles manage:all grants", () => {
    const grants = resolveGrants(permissions, ["admin"]);
    const manageAll = grants.filter((g) => g.action === "manage" && g.subject === "all");
    expect(manageAll.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty grants for unknown role", () => {
    const grants = resolveGrants(permissions, ["nonexistent"]);
    expect(grants).toHaveLength(0);
  });

  it("returns empty grants for empty roles array", () => {
    const grants = resolveGrants(permissions, []);
    expect(grants).toHaveLength(0);
  });

  it("deduplicates identical grants from overlapping hierarchy", () => {
    // editor inherits author inherits reader inherits anonymous
    // "read comments" appears once from reader
    const grants = resolveGrants(permissions, ["editor"]);
    const readComments = grants.filter(
      (g) => g.action === "read" && (g.subject as any)._?.name === "comments",
    );
    expect(readComments).toHaveLength(1);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd packages/permissions && pnpm test -- --reporter=verbose 2>&1 | head -40`
Expected: FAIL — module `../resolve-grants` not found

### Step 3: Implement `resolveGrants`

Create `packages/permissions/src/resolve-grants.ts`:

```typescript
import type { Grant, Permissions, WhereClause, DrizzleTable } from "./types";

function getGrantKey(g: Grant): string {
  const table =
    g.subject === "all"
      ? "all"
      : (g.subject as DrizzleTable)._?.name ?? "unknown";
  return `${g.action}:${table}`;
}

function getSubjectRef(g: Grant): DrizzleTable | "all" {
  return g.subject;
}

function mergeWheres(clauses: Array<WhereClause | undefined>): WhereClause | undefined {
  const defined = clauses.filter((c): c is WhereClause => c !== undefined);

  // If any grant is unrestricted (no WHERE), the merged result is unrestricted
  if (defined.length < clauses.length) return undefined;

  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];

  // OR-merge: the user can access rows matching ANY of the WHERE clauses
  return (columns, user) => {
    // Import or is deferred to avoid circular deps — the caller (db) will
    // handle the actual SQL OR. We return an array marker that db can detect.
    const results = defined.map((fn) => fn(columns, user));
    return { __orMerged: true, clauses: results } as any;
  };
}

export function resolveGrants(
  permissions: Permissions,
  roles: string[],
): Grant[] {
  // Collect all grants from all roles (already hierarchy-expanded in permissions.resolvedGrants)
  const allGrants: Grant[] = [];
  for (const role of roles) {
    const roleGrants = permissions.resolvedGrants[role] ?? [];
    allGrants.push(...roleGrants);
  }

  if (allGrants.length === 0) return [];

  // Group by action+table, then merge
  const grouped = new Map<string, { grants: Grant[]; subject: DrizzleTable | "all"; action: string }>();

  for (const g of allGrants) {
    const key = getGrantKey(g);
    const existing = grouped.get(key);
    if (existing) {
      existing.grants.push(g);
    } else {
      grouped.set(key, {
        grants: [g],
        subject: getSubjectRef(g),
        action: g.action,
      });
    }
  }

  const result: Grant[] = [];

  for (const [, group] of grouped) {
    const wheres = group.grants.map((g) => g.where);
    const mergedWhere = mergeWheres(wheres);

    result.push({
      action: group.action as Grant["action"],
      subject: group.subject,
      where: mergedWhere,
    });
  }

  return result;
}
```

### Step 4: Export from index

Add to `packages/permissions/src/index.ts`:

```typescript
export { resolveGrants } from "./resolve-grants";
```

### Step 5: Run tests to verify they pass

Run: `cd packages/permissions && pnpm test -- --reporter=verbose`
Expected: All tests PASS

### Step 6: Commit

```bash
git add packages/permissions/src/resolve-grants.ts packages/permissions/src/__tests__/resolve-grants.test.ts packages/permissions/src/index.ts
git commit -m "feat(permissions): add resolveGrants() — merge multiple roles into flat grant list"
```

---

## Task 2: Refactor `@cfast/db` to accept `Grant[]` instead of `Permissions` + `role`

**Files:**
- Modify: `packages/db/src/types.ts`
- Modify: `packages/db/src/permissions.ts`
- Modify: `packages/db/src/query-builder.ts`
- Modify: `packages/db/src/mutate-builder.ts`
- Modify: `packages/db/src/create-db.ts`
- Modify: `packages/db/src/__tests__/helpers.ts`
- Modify: `packages/db/src/__tests__/permissions.test.ts`
- Modify: `packages/db/src/__tests__/query-builder.test.ts`
- Modify: `packages/db/src/__tests__/mutate-builder.test.ts`
- Modify: `packages/db/src/__tests__/create-db.test.ts`
- Modify: `packages/db/src/__tests__/integration.test.ts`

This is a refactor — existing tests must keep passing with the new API.

### Step 1: Update `DbConfig` type in `types.ts`

Change `packages/db/src/types.ts`:

```typescript
// Before:
import type { Permissions, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";

// ...
export type DbConfig = {
  d1: D1Database;
  schema: Record<string, DrizzleTable>;
  permissions: Permissions;
  user: { id: string; role: string } | null;
  cache?: CacheConfig | false;
};

// After:
import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";

// ...
export type DbConfig = {
  d1: D1Database;
  schema: Record<string, DrizzleTable>;
  grants: Grant[];
  user: { id: string } | null;
  cache?: CacheConfig | false;
};
```

### Step 2: Rewrite `permissions.ts` to work with `Grant[]` directly

Replace `packages/db/src/permissions.ts`:

```typescript
import { ForbiddenError } from "@cfast/permissions";
import type {
  Grant,
  PermissionDescriptor,
  PermissionAction,
  DrizzleTable,
  WhereClause,
} from "@cfast/permissions";

type User = { id: string };

function grantMatchesAction(
  grantAction: PermissionAction,
  requiredAction: PermissionAction,
): boolean {
  if (grantAction === requiredAction) return true;
  if (grantAction === "manage") return true;
  return false;
}

function grantMatchesTable(
  grantSubject: DrizzleTable | "all",
  requiredTable: DrizzleTable,
): boolean {
  if (grantSubject === "all") return true;
  return grantSubject === requiredTable;
}

function hasGrantFor(
  grants: Grant[],
  action: PermissionAction,
  table: DrizzleTable,
): boolean {
  return grants.some(
    (g) =>
      grantMatchesAction(g.action, action) &&
      grantMatchesTable(g.subject, table),
  );
}

function getTableName(table: DrizzleTable): string {
  return table._?.name ?? "unknown";
}

export function resolvePermissionFilters(
  grants: Grant[],
  user: User,
  action: PermissionAction,
  table: DrizzleTable,
): Array<(columns: Record<string, unknown>, user: User) => unknown> {
  const matching = grants.filter((g) => {
    const actionMatch = grantMatchesAction(g.action, action);
    const tableMatch = grantMatchesTable(g.subject, table);
    return actionMatch && tableMatch;
  });

  if (matching.length === 0) return [];

  // If any matching grant has no where clause, access is unrestricted
  if (matching.some((g) => !g.where)) return [];

  return matching
    .filter((g): g is Grant & { where: NonNullable<Grant["where"]> } => !!g.where)
    .map((g) => g.where as (columns: Record<string, unknown>, user: User) => unknown);
}

export function checkOperationPermissions(
  grants: Grant[],
  descriptors: PermissionDescriptor[],
): void {
  if (descriptors.length === 0) return;

  const denied: PermissionDescriptor[] = [];
  const reasons: string[] = [];

  for (const descriptor of descriptors) {
    let permitted: boolean;

    if (descriptor.action === "manage") {
      // Check if grants have manage for this table, or all 4 CRUD actions
      const hasManage = hasGrantFor(grants, "manage", descriptor.table);
      const hasAllCrud = (["read", "create", "update", "delete"] as const).every(
        (a) => hasGrantFor(grants, a, descriptor.table),
      );
      permitted = hasManage || hasAllCrud;
    } else {
      permitted = hasGrantFor(grants, descriptor.action, descriptor.table);
    }

    if (!permitted) {
      denied.push(descriptor);
      reasons.push(
        `Cannot ${descriptor.action} on '${getTableName(descriptor.table)}'`,
      );
    }
  }

  if (denied.length > 0) {
    const first = denied[0];
    throw new ForbiddenError({
      action: first.action,
      table: first.table,
      role: "unknown", // No longer role-based — ForbiddenError still needs role field
      descriptors: denied,
    });
  }
}
```

Note: `ForbiddenError` still expects a `role` field. We pass `"unknown"` for now — Task 2b will update ForbiddenError to make `role` optional.

### Step 3: Update `query-builder.ts` — replace `permissions: Permissions` + `user: User` with `grants: Grant[]` + `user: User`

Change `packages/db/src/query-builder.ts`:

```typescript
import { drizzle } from "drizzle-orm/d1";
import { and, or } from "drizzle-orm";
import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import { resolvePermissionFilters, checkOperationPermissions } from "./permissions";
import type { Operation, FindManyOptions, FindFirstOptions } from "./types";

type User = { id: string };

type QueryBuilderConfig = {
  d1: D1Database;
  schema: Record<string, unknown>;
  grants: Grant[];
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
};

// ... getTableKey stays the same ...

function buildPermissionFilter(
  config: QueryBuilderConfig,
  table: DrizzleTable,
): unknown {
  if (config.unsafe || !config.user) return undefined;
  const filters = resolvePermissionFilters(config.grants, config.user, "read", table);
  if (filters.length === 0) return undefined;

  const columns = table as Record<string, unknown>;
  const clauses = filters.map((fn) => fn(columns, config.user!));
  return clauses.length === 1 ? clauses[0] : or(...(clauses as [any, ...any[]]));
}

// Rest of createQueryBuilder stays the same but:
// - Replace checkOperationPermissions(config.permissions, config.user, permissions)
//   with checkOperationPermissions(config.grants, permissions)
```

### Step 4: Update `mutate-builder.ts` — same pattern as query-builder

Replace `permissions: Permissions` and `user: { id: string; role: string }` with `grants: Grant[]` and `user: { id: string }`. Update all calls to `resolvePermissionFilters` and `checkOperationPermissions` to use the new signatures.

### Step 5: Update `create-db.ts` — pass `grants` instead of `permissions`

The config destructuring changes from `config.permissions` to `config.grants`, and `config.user` is `{ id: string } | null` instead of `{ id: string; role: string } | null`. Pass `grants` to each builder config instead of `permissions`.

### Step 6: Update test helpers

Change `packages/db/src/__tests__/helpers.ts`:

```typescript
import { definePermissions, grant, resolveGrants } from "@cfast/permissions";

// ... tables stay the same ...

export type TestUser = { id: string };  // no more role field

export const testPermissions = definePermissions({
  // ... same as before ...
});

// Pre-resolve grants for test roles
export function grantsForRole(role: string): Grant[] {
  return resolveGrants(testPermissions, [role]);
}
```

### Step 7: Update all test files

Each test file that creates a `Db` via `createDb` needs to change from:

```typescript
createDb({ d1, schema, permissions: testPermissions, user: { id: "u1", role: "user" } })
```

to:

```typescript
createDb({ d1, schema, grants: grantsForRole("user"), user: { id: "u1" } })
```

### Step 8: Run all db tests

Run: `cd packages/db && pnpm test -- --reporter=verbose`
Expected: All tests PASS

### Step 9: Run full monorepo typecheck

Run: `pnpm typecheck`
Expected: Clean (the example app will fail — that's Task 6)

### Step 10: Commit

```bash
git add packages/db/
git commit -m "refactor(db): accept pre-resolved Grant[] instead of Permissions + role"
```

---

## Task 2b: Update `ForbiddenError` to make `role` optional

**Files:**
- Modify: `packages/permissions/src/errors.ts`
- Test: `packages/permissions/src/__tests__/errors.test.ts`

### Step 1: Make `role` optional in `ForbiddenError`

In `packages/permissions/src/errors.ts`, change `ForbiddenErrorOptions`:

```typescript
type ForbiddenErrorOptions = {
  action: PermissionAction;
  table: DrizzleTable;
  role?: string;  // optional now
  descriptors?: PermissionDescriptor[];
};
```

Update the constructor message to handle missing role:

```typescript
constructor(options: ForbiddenErrorOptions) {
  const tableName = getTableName(options.table);
  const msg = options.role
    ? `Role '${options.role}' cannot ${options.action} on '${tableName}'`
    : `Cannot ${options.action} on '${tableName}'`;
  super(msg);
  this.name = "ForbiddenError";
  this.action = options.action;
  this.table = options.table;
  this.role = options.role ?? "unknown";
  this.descriptors = options.descriptors ?? [];
}
```

### Step 2: Update db's permissions.ts to stop passing `role: "unknown"`

In `packages/db/src/permissions.ts`, remove the hardcoded `role: "unknown"`:

```typescript
throw new ForbiddenError({
  action: first.action,
  table: first.table,
  descriptors: denied,
});
```

### Step 3: Run tests

Run: `cd packages/permissions && pnpm test && cd ../db && pnpm test`
Expected: All PASS

### Step 4: Commit

```bash
git add packages/permissions/src/errors.ts packages/db/src/permissions.ts
git commit -m "refactor(permissions): make ForbiddenError.role optional"
```

---

## Task 3: Scaffold `@cfast/auth` server — `createAuth` and `createContext`

**Files:**
- Modify: `packages/auth/package.json` (add dependencies)
- Create: `packages/auth/src/index.ts`
- Create: `packages/auth/src/types.ts`
- Create: `packages/auth/src/create-auth.ts`
- Create: `packages/auth/src/context.ts`
- Create: `packages/auth/src/roles.ts`
- Test: `packages/auth/src/__tests__/context.test.ts`
- Test: `packages/auth/src/__tests__/roles.test.ts`

### Step 1: Add dependencies to `packages/auth/package.json`

```json
{
  "dependencies": {
    "@cfast/permissions": "workspace:*"
  },
  "peerDependencies": {
    "better-auth": ">=1",
    "drizzle-orm": ">=0.35"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260305.1",
    "better-auth": "^1.2.0",
    "drizzle-orm": "^0.44.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

Run: `pnpm install`

### Step 2: Define types

Create `packages/auth/src/types.ts`:

```typescript
import type { Grant, Permissions } from "@cfast/permissions";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  isImpersonating?: boolean;
  realUser?: { id: string; name: string };
};

export type AuthContext = {
  user: AuthUser | null;
  grants: Grant[];
};

export type AuthenticatedContext = {
  user: AuthUser;
  grants: Grant[];
};

export type AuthConfig = {
  permissions: Permissions;
  passkeys?: {
    rpName: string;
    rpId: string;
  };
  session?: {
    expiresIn?: string;
  };
  redirects?: {
    afterLogin?: string;
    loginPath?: string;
  };
  anonymousRoles?: string[];
  defaultRoles?: string[];
};

export type AuthEnvConfig = {
  DB: D1Database;
  APP_URL: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_FROM?: string;
  CACHE?: KVNamespace;
};

export type AuthInstance = {
  createContext: (request: Request) => Promise<AuthContext>;
  requireUser: (request: Request) => Promise<AuthenticatedContext>;
  api: any; // Better Auth API — fully typed by better-auth
  setRole: (userId: string, role: string) => Promise<void>;
  setRoles: (userId: string, roles: string[]) => Promise<void>;
  getRoles: (userId: string) => Promise<string[]>;
  impersonate: (adminUserId: string, targetUserId: string) => Promise<void>;
  stopImpersonation: (sessionId: string) => Promise<void>;
};
```

### Step 3: Write failing tests for role management

Create `packages/auth/src/__tests__/roles.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoleManager } from "../roles";

// Mock D1
function createMockDb() {
  const rows: Array<{ userId: string; role: string }> = [];

  return {
    _rows: rows,
    prepare: vi.fn((sql: string) => ({
      bind: (...params: unknown[]) => ({
        all: async () => ({
          results: rows.filter((r) => r.userId === params[0]),
        }),
        run: async () => {
          if (sql.includes("INSERT")) {
            rows.push({ userId: params[0] as string, role: params[1] as string });
          } else if (sql.includes("DELETE") && params.length === 2) {
            const idx = rows.findIndex(
              (r) => r.userId === params[0] && r.role === params[1],
            );
            if (idx >= 0) rows.splice(idx, 1);
          } else if (sql.includes("DELETE")) {
            const toRemove = rows
              .map((r, i) => (r.userId === params[0] ? i : -1))
              .filter((i) => i >= 0)
              .reverse();
            for (const i of toRemove) rows.splice(i, 1);
          }
          return { success: true };
        },
      }),
    })),
  };
}

describe("createRoleManager", () => {
  let db: ReturnType<typeof createMockDb>;
  let roles: ReturnType<typeof createRoleManager>;

  beforeEach(() => {
    db = createMockDb();
    roles = createRoleManager(db as any);
  });

  it("getRoles returns empty array for user with no roles", async () => {
    const result = await roles.getRoles("user-1");
    expect(result).toEqual([]);
  });

  it("setRole adds a role", async () => {
    await roles.setRole("user-1", "editor");
    const result = await roles.getRoles("user-1");
    expect(result).toContain("editor");
  });

  it("setRoles replaces all roles", async () => {
    await roles.setRole("user-1", "editor");
    await roles.setRoles("user-1", ["admin", "moderator"]);
    const result = await roles.getRoles("user-1");
    expect(result).toEqual(["admin", "moderator"]);
  });
});
```

### Step 4: Implement role manager

Create `packages/auth/src/roles.ts`:

```typescript
export function createRoleManager(d1: D1Database) {
  return {
    async getRoles(userId: string): Promise<string[]> {
      const result = await d1
        .prepare("SELECT role FROM cfast_roles WHERE user_id = ?")
        .bind(userId)
        .all();
      return (result.results as Array<{ role: string }>).map((r) => r.role);
    },

    async setRole(userId: string, role: string): Promise<void> {
      await d1
        .prepare(
          "INSERT OR IGNORE INTO cfast_roles (user_id, role) VALUES (?, ?)",
        )
        .bind(userId, role)
        .run();
    },

    async setRoles(userId: string, roles: string[]): Promise<void> {
      await d1
        .prepare("DELETE FROM cfast_roles WHERE user_id = ?")
        .bind(userId)
        .run();
      for (const role of roles) {
        await d1
          .prepare("INSERT INTO cfast_roles (user_id, role) VALUES (?, ?)")
          .bind(userId, role)
          .run();
      }
    },

    async removeRole(userId: string, role: string): Promise<void> {
      await d1
        .prepare("DELETE FROM cfast_roles WHERE user_id = ? AND role = ?")
        .bind(userId, role)
        .run();
    },
  };
}
```

### Step 5: Run tests

Run: `cd packages/auth && pnpm test -- --reporter=verbose`
Expected: All PASS

### Step 6: Commit

```bash
git add packages/auth/
git commit -m "feat(auth): add role manager with D1 storage"
```

---

## Task 4: Implement `createAuth` and `createContext`

**Files:**
- Create: `packages/auth/src/create-auth.ts`
- Modify: `packages/auth/src/index.ts`
- Test: `packages/auth/src/__tests__/create-auth.test.ts`

### Step 1: Write failing tests for createContext

Create `packages/auth/src/__tests__/create-auth.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { definePermissions, grant } from "@cfast/permissions";
import { createAuth } from "../create-auth";

const posts = { _: { name: "posts" } } as any;

const permissions = definePermissions({
  roles: ["anonymous", "reader", "admin"] as const,
  hierarchy: {
    admin: ["reader"],
  },
  grants: {
    anonymous: [grant("read", posts)],
    reader: [grant("create", posts)],
    admin: [grant("manage", "all")],
  },
});

describe("createAuth", () => {
  it("returns a factory function", () => {
    const factory = createAuth({ permissions });
    expect(typeof factory).toBe("function");
  });
});

describe("createContext", () => {
  it("returns anonymous grants when no session", async () => {
    const factory = createAuth({
      permissions,
      anonymousRoles: ["anonymous"],
    });

    // Mock env with D1 that returns no session
    const mockEnv = {
      DB: createNoSessionMockD1(),
      APP_URL: "http://localhost",
    };

    const auth = factory(mockEnv as any);
    const ctx = await auth.createContext(new Request("http://localhost/"));

    expect(ctx.user).toBeNull();
    expect(ctx.grants.length).toBeGreaterThan(0);
    expect(ctx.grants[0].action).toBe("read");
  });
});

// Minimal mock that simulates "no session found"
function createNoSessionMockD1() {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({ success: true }),
      }),
    }),
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  };
}
```

### Step 2: Implement `createAuth`

Create `packages/auth/src/create-auth.ts`:

```typescript
import { resolveGrants } from "@cfast/permissions";
import type { Permissions, Grant } from "@cfast/permissions";
import { createRoleManager } from "./roles";
import type { AuthConfig, AuthEnvConfig, AuthInstance, AuthContext, AuthenticatedContext, AuthUser } from "./types";

export function createAuth(config: AuthConfig): (env: AuthEnvConfig) => AuthInstance {
  const { permissions, anonymousRoles = ["anonymous"], defaultRoles = ["reader"] } = config;
  const loginPath = config.redirects?.loginPath ?? "/login";

  // Pre-resolve anonymous grants (pure computation, no env needed)
  const anonymousGrants = resolveGrants(permissions, anonymousRoles);

  return function initAuth(env: AuthEnvConfig): AuthInstance {
    const roleManager = createRoleManager(env.DB);

    // Lazy Better Auth init — import dynamically to avoid issues when
    // better-auth isn't installed (e.g., in unit tests for other packages)
    let _betterAuth: any;
    function getBetterAuth() {
      if (!_betterAuth) {
        // Better Auth setup is deferred to the implementation step
        // For now, this is a placeholder that will be wired in Task 5
        throw new Error("Better Auth not yet initialized");
      }
      return _betterAuth;
    }

    async function resolveUserContext(
      sessionUser: { id: string; email: string; name: string; image?: string | null },
      sessionId: string,
    ): Promise<{ user: AuthUser; grants: Grant[] }> {
      const roles = await roleManager.getRoles(sessionUser.id);
      const effectiveRoles = roles.length > 0 ? roles : defaultRoles;

      // Check for impersonation
      let user: AuthUser;
      if (env.CACHE) {
        const impersonationTarget = await env.CACHE.get(`impersonation:${sessionId}`);
        if (impersonationTarget) {
          // TODO: resolve impersonated user — requires user lookup
          // For now, skip impersonation
        }
      }

      user = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        avatarUrl: sessionUser.image ?? null,
        roles: effectiveRoles,
      };

      const grants = resolveGrants(permissions, effectiveRoles);
      return { user, grants };
    }

    return {
      async createContext(request: Request): Promise<AuthContext> {
        try {
          const betterAuth = getBetterAuth();
          const session = await betterAuth.api.getSession({ headers: request.headers });

          if (!session?.user) {
            return { user: null, grants: anonymousGrants };
          }

          return resolveUserContext(session.user, session.session.id);
        } catch {
          // If Better Auth fails (not initialized, etc.), return anonymous
          return { user: null, grants: anonymousGrants };
        }
      },

      async requireUser(request: Request): Promise<AuthenticatedContext> {
        const ctx = await this.createContext(request);
        if (!ctx.user) {
          // Set redirect cookie and throw redirect
          const url = new URL(request.url);
          const redirectTo = url.pathname + url.search;
          throw new Response(null, {
            status: 302,
            headers: {
              Location: loginPath,
              "Set-Cookie": `cfast_redirect_to=${encodeURIComponent(redirectTo)}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
            },
          });
        }
        return ctx as AuthenticatedContext;
      },

      api: null, // Placeholder until Better Auth is wired

      setRole: (userId, role) => roleManager.setRole(userId, role),
      setRoles: (userId, roles) => roleManager.setRoles(userId, roles),
      getRoles: (userId) => roleManager.getRoles(userId),

      async impersonate(adminUserId: string, targetUserId: string) {
        if (!env.CACHE) throw new Error("KV CACHE binding required for impersonation");
        // Store impersonation mapping keyed by admin's session
        // Implementation depends on session lookup — deferred to Better Auth wiring
      },

      async stopImpersonation(sessionId: string) {
        if (!env.CACHE) throw new Error("KV CACHE binding required for impersonation");
        await env.CACHE.delete(`impersonation:${sessionId}`);
      },
    };
  };
}
```

### Step 3: Update `packages/auth/src/index.ts`

```typescript
export { createAuth } from "./create-auth";
export { createRoleManager } from "./roles";
export type {
  AuthUser,
  AuthContext,
  AuthenticatedContext,
  AuthConfig,
  AuthEnvConfig,
  AuthInstance,
} from "./types";
```

### Step 4: Run tests

Run: `cd packages/auth && pnpm test -- --reporter=verbose`
Expected: All PASS

### Step 5: Commit

```bash
git add packages/auth/
git commit -m "feat(auth): createAuth factory with createContext and requireUser"
```

---

## Task 5: Wire Better Auth into `createAuth`

**Files:**
- Modify: `packages/auth/src/create-auth.ts`
- Create: `packages/auth/src/better-auth-config.ts`

This task wires the actual Better Auth setup. It needs an integration test environment with D1, so unit test coverage is limited. Focus on getting the config right and verifying the example app works.

### Step 1: Create Better Auth config builder

Create `packages/auth/src/better-auth-config.ts`:

```typescript
import type { AuthConfig, AuthEnvConfig } from "./types";

export function buildBetterAuthConfig(authConfig: AuthConfig, env: AuthEnvConfig) {
  return {
    baseURL: env.APP_URL,
    database: env.DB,
    session: {
      expiresIn: parseExpiresIn(authConfig.session?.expiresIn ?? "30d"),
    },
    passkeys: authConfig.passkeys
      ? {
          rpName: authConfig.passkeys.rpName,
          rpID: authConfig.passkeys.rpId,
          origin: env.APP_URL,
        }
      : undefined,
  };
}

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60 * 60 * 24 * 30; // default 30d in seconds
  const num = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 60 * 60;
    case "d": return num * 60 * 60 * 24;
    default: return num;
  }
}
```

### Step 2: Update `create-auth.ts` to use Better Auth

Replace the `getBetterAuth` placeholder with actual Better Auth initialization. Import `betterAuth` from `better-auth`, `drizzleAdapter` from `better-auth/adapters/drizzle`, and the plugins (`magicLink`, `passkey`). Create the Better Auth instance in `initAuth()` using the env config.

The key integration point:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// In initAuth():
_betterAuth = betterAuth({
  baseURL: env.APP_URL,
  database: drizzleAdapter(drizzle(env.DB), { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  plugins: [
    // magicLink, passkey — configured from authConfig
  ],
  session: { expiresIn: parseExpiresIn(config.session?.expiresIn ?? "30d") },
});
```

### Step 3: Run typecheck

Run: `pnpm typecheck`
Expected: Clean for packages/auth

### Step 4: Commit

```bash
git add packages/auth/
git commit -m "feat(auth): wire Better Auth with D1 adapter and plugins"
```

---

## Task 6: Migrate example app to new auth context system

**Files:**
- Modify: `examples/team-blog-after/workers/app.ts`
- Modify: `examples/team-blog-after/app/permissions.ts` (add anonymous role)
- Delete or modify: `examples/team-blog-after/app/auth.helpers.server.ts`
- Delete or modify: `examples/team-blog-after/app/db/cfast.server.ts`
- Modify: `examples/team-blog-after/app/auth.server.ts`
- Modify: All route files that use `getUser` / `createCfDb`

### Step 1: Add anonymous role to permissions

In `examples/team-blog-after/app/permissions.ts`, add `"anonymous"` to roles and define its grants:

```typescript
const appRoles = ["anonymous", "reader", "author", "editor", "admin"] as const;

export const permissions = definePermissions<AuthUser>()({
  roles: appRoles,
  hierarchy: {
    reader: ["anonymous"],
    author: ["reader"],
    editor: ["author"],
    admin: ["editor"],
  },
  grants: (grant) => ({
    anonymous: [
      grant("read", posts, { where: () => eq(posts.published, true) }),
    ],
    reader: [
      // ... existing reader grants ...
    ],
    // ... rest stays the same ...
  }),
});
```

### Step 2: Update auth.server.ts to use `createAuth` from `@cfast/auth`

```typescript
import { createAuth } from "@cfast/auth";
import { permissions } from "./permissions";

export const createAppAuth = createAuth({
  permissions,
  passkeys: {
    rpName: "Team Blog",
    rpId: "localhost",
  },
  session: { expiresIn: "30d" },
  redirects: {
    afterLogin: "/",
    loginPath: "/login",
  },
  anonymousRoles: ["anonymous"],
  defaultRoles: ["reader"],
});
```

### Step 3: Update workers/app.ts

```typescript
import { createRequestHandler } from "react-router";
import { env } from "../app/env";
import { createAppAuth } from "../app/auth.server";
import { createDb } from "@cfast/db";
import * as schema from "../app/db/schema";

declare module "react-router" {
  export interface AppLoadContext {
    env: Env;
    user: AuthUser | null;
    db: Db;
    auth: AuthInstance;
    executionCtx: ExecutionContext;
  }
}

type Env = ReturnType<typeof env.get>;

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, rawEnv: Record<string, unknown>, ctx: ExecutionContext) {
    env.init(rawEnv);
    const e = env.get();
    const auth = createAppAuth(e);
    const { user, grants } = await auth.createContext(request);
    const db = createDb({
      d1: e.DB,
      schema: schema as unknown as Record<string, any>,
      grants,
      user: user ? { id: user.id } : null,
      cache: false,
    });

    return requestHandler(request, { env: e, user, db, auth, executionCtx: ctx });
  },
};
```

### Step 4: Update route files

In each route file, replace:

```typescript
const env = context.cloudflare.env;
const user = await getUser(request, env);
const cfDb = createCfDb(env.DB, user);
```

with:

```typescript
const { db, user } = context;
```

This is a mechanical replacement across all route files. The `db` and `user` are already available from context.

### Step 5: Delete obsolete files

- `examples/team-blog-after/app/auth.helpers.server.ts` — replaced by `@cfast/auth`
- `examples/team-blog-after/app/db/cfast.server.ts` — replaced by context wiring

Keep `hasRole` / `hasAnyRole` helpers — move to `permissions.ts` (they're already there).

### Step 6: Run typecheck and dev server

Run: `pnpm typecheck`
Run: `cd examples/team-blog-after && pnpm dev`

Verify the app starts and basic routes work.

### Step 7: Commit

```bash
git add examples/team-blog-after/
git commit -m "feat(example): migrate team-blog-after to @cfast/auth context system"
```

---

## Task 7: Auth client components

**Files:**
- Create: `packages/auth/src/client.ts`
- Create: `packages/auth/src/components/auth-provider.tsx`
- Create: `packages/auth/src/components/auth-guard.tsx`
- Create: `packages/auth/src/components/login-page.tsx`
- Create: `packages/auth/src/components/use-current-user.ts`

These are React components. They are thin wrappers:

- `AuthProvider` — React context that holds `AuthUser | null` from loader data
- `AuthGuard` — layout wrapper, reads user from parent loader (just passes through)
- `useCurrentUser()` — reads from AuthProvider context
- `LoginPage` — renders email input + magic link + passkey buttons using Better Auth's client SDK. Component slot overrides.

### Step 1: Implement AuthProvider and useCurrentUser

```typescript
// packages/auth/src/components/auth-provider.tsx
import { createContext, useContext, type ReactNode } from "react";
import type { AuthUser } from "../types";

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useCurrentUser(): AuthUser | null {
  return useContext(AuthContext);
}
```

### Step 2: Implement AuthGuard

```typescript
// packages/auth/src/components/auth-guard.tsx
import type { ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  // AuthGuard is a layout component. The actual guard logic is in the
  // layout loader (calling auth.requireUser). On the client, it just
  // renders children — the server already verified authentication.
  return <>{children}</>;
}
```

### Step 3: Implement LoginPage (basic)

LoginPage uses Better Auth's client-side SDK. The initial implementation renders a simple email input + two buttons. Slot overrides come later.

### Step 4: Update package.json exports and tsup config

Add `./client` export pointing to `dist/client.js`.

### Step 5: Run typecheck

Run: `pnpm typecheck`

### Step 6: Commit

```bash
git add packages/auth/
git commit -m "feat(auth): add client components — AuthProvider, AuthGuard, useCurrentUser, LoginPage"
```

---

## Task 8: React Router plugin

**Files:**
- Create: `packages/auth/src/plugin.ts`

The plugin mounts Better Auth's API routes at `/auth/*`. This is a React Router v7 server plugin that handles all requests to `/auth/callback`, `/auth/passkey/*`, etc.

### Step 1: Implement plugin

```typescript
// packages/auth/src/plugin.ts
import type { AuthInstance } from "./types";

export function createAuthPlugin(auth: AuthInstance) {
  return {
    name: "cfast-auth",
    // React Router plugin API — intercepts /auth/* routes
    // and delegates to Better Auth's handler
  };
}
```

### Step 2: Add `./plugin` export to package.json

### Step 3: Commit

```bash
git add packages/auth/
git commit -m "feat(auth): add React Router plugin for auth routes"
```

---

## Summary

| Task | Package | What | Estimated Steps |
|------|---------|------|-----------------|
| 1 | permissions | `resolveGrants()` with OR-merge | 6 |
| 2 | db | Refactor to accept `Grant[]` | 10 |
| 2b | permissions + db | Make `ForbiddenError.role` optional | 4 |
| 3 | auth | Scaffold types, roles, createAuth, createContext | 6 |
| 4 | auth | Wire Better Auth | 4 |
| 5 | auth | Migrate example app | 7 |
| 6 | auth | Client components | 6 |
| 7 | auth | React Router plugin | 3 |

**Critical path:** Tasks 1 → 2 → 2b → 3 → 4 → 5 (sequential — each depends on the previous).
Tasks 6 and 7 can be done in parallel after Task 4.
