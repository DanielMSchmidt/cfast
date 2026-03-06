# @cfast/permissions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the isomorphic permissions package — types, `grant()`, `definePermissions()`, `checkPermissions()`, `ForbiddenError`, and role hierarchy resolution.

**Architecture:** Pure TypeScript with drizzle-orm as a peer dependency (types only — no SQL compilation here). The `where` clause functions are stored but never evaluated — `@cfast/db` handles that. `checkPermissions()` does structural checking only (does a matching grant exist?), not row-level enforcement. The package is isomorphic (~3KB) with a `/client` entrypoint that re-exports types safely.

**Tech Stack:** TypeScript, drizzle-orm (peer dep for types), vitest for tests, tsup for bundling.

---

### Task 1: Project Setup — Add vitest, Create File Structure

**Files:**
- Modify: `packages/permissions/package.json`
- Create: `packages/permissions/src/__tests__/.gitkeep` (placeholder — tests created in later tasks)

**Step 1: Add vitest and test script to package.json**

In `packages/permissions/package.json`, add `"test": "vitest run"` to scripts and `"vitest": "^4.0.18"` to devDependencies:

```json
{
  "name": "@cfast/permissions",
  "version": "0.0.1",
  "description": "Isomorphic, composable permission system with Drizzle-native row-level access control",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./client": {
      "import": "./dist/client.js",
      "types": "./dist/client.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/client.ts --format esm --dts",
    "dev": "tsup src/index.ts src/client.ts --format esm --dts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "peerDependencies": {
    "drizzle-orm": ">=0.35"
  },
  "devDependencies": {
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  }
}
```

**Step 2: Install dependencies**

Run: `cd /Users/danielschmidt/fun/cfast && pnpm install`
Expected: Clean install, no errors.

**Step 3: Verify test runner works**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS (passWithNoTests is true in root vitest config).

**Step 4: Commit**

```bash
git add packages/permissions/package.json pnpm-lock.yaml
git commit -m "chore(permissions): add vitest for testing"
```

---

### Task 2: Types

**Files:**
- Create: `packages/permissions/src/types.ts`
- Test: `packages/permissions/src/__tests__/types.test.ts`

**Step 1: Write type tests**

Create `packages/permissions/src/__tests__/types.test.ts`:

```typescript
import { describe, it, expectTypeOf } from "vitest";
import type {
  PermissionAction,
  CrudAction,
  Grant,
  PermissionDescriptor,
  PermissionCheckResult,
} from "../types";

describe("types", () => {
  it("PermissionAction includes manage and all CRUD actions", () => {
    expectTypeOf<PermissionAction>().toEqualTypeOf<
      "read" | "create" | "update" | "delete" | "manage"
    >();
  });

  it("CrudAction excludes manage", () => {
    expectTypeOf<CrudAction>().toEqualTypeOf<
      "read" | "create" | "update" | "delete"
    >();
  });

  it("Grant has action, subject, and optional where", () => {
    expectTypeOf<Grant>().toHaveProperty("action");
    expectTypeOf<Grant>().toHaveProperty("subject");
  });

  it("PermissionDescriptor has action and table", () => {
    expectTypeOf<PermissionDescriptor>().toHaveProperty("action");
    expectTypeOf<PermissionDescriptor>().toHaveProperty("table");
  });

  it("PermissionCheckResult has permitted, denied, and reasons", () => {
    expectTypeOf<PermissionCheckResult>().toHaveProperty("permitted");
    expectTypeOf<PermissionCheckResult>().toHaveProperty("denied");
    expectTypeOf<PermissionCheckResult>().toHaveProperty("reasons");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: FAIL — cannot find module `../types`.

**Step 3: Write types implementation**

Create `packages/permissions/src/types.ts`:

```typescript
import type { Table, SQL } from "drizzle-orm";

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export type CrudAction = Exclude<PermissionAction, "manage">;

export const CRUD_ACTIONS: readonly CrudAction[] = ["read", "create", "update", "delete"] as const;

export type WhereClause<TUser = unknown> = (
  columns: Record<string, unknown>,
  user: TUser,
) => SQL | undefined;

export type Grant<TUser = unknown> = {
  action: PermissionAction;
  subject: Table | "all";
  where?: WhereClause<TUser>;
};

export type PermissionDescriptor = {
  action: PermissionAction;
  table: Table;
};

export type PermissionCheckResult = {
  permitted: boolean;
  denied: PermissionDescriptor[];
  reasons: string[];
};

export type PermissionsConfig<
  TRoles extends readonly string[],
  TUser = unknown,
> = {
  roles: TRoles;
  grants: Record<TRoles[number], Grant<TUser>[]>;
  hierarchy?: Partial<Record<TRoles[number], TRoles[number][]>>;
};

export type Permissions<
  TRoles extends readonly string[] = readonly string[],
  TUser = unknown,
> = {
  roles: TRoles;
  grants: Record<TRoles[number], Grant<TUser>[]>;
  resolvedGrants: Record<TRoles[number], Grant<TUser>[]>;
};
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/permissions/src/types.ts packages/permissions/src/__tests__/types.test.ts
git commit -m "feat(permissions): add core type definitions"
```

---

### Task 3: ForbiddenError

**Files:**
- Create: `packages/permissions/src/errors.ts`
- Test: `packages/permissions/src/__tests__/errors.test.ts`

**Step 1: Write failing tests**

Create `packages/permissions/src/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ForbiddenError } from "../errors";

// Minimal fake table for testing
const posts = { _: { name: "posts" } } as any;

describe("ForbiddenError", () => {
  it("is an instance of Error", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it("has a descriptive message", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
    });
    expect(err.message).toBe("Role 'user' cannot delete on 'posts'");
  });

  it("exposes action, table, and role properties", () => {
    const err = new ForbiddenError({
      action: "update",
      table: posts,
      role: "editor",
    });
    expect(err.action).toBe("update");
    expect(err.table).toBe(posts);
    expect(err.role).toBe("editor");
  });

  it("optionally carries descriptors", () => {
    const descriptors = [
      { action: "update" as const, table: posts },
      { action: "create" as const, table: posts },
    ];
    const err = new ForbiddenError({
      action: "update",
      table: posts,
      role: "user",
      descriptors,
    });
    expect(err.descriptors).toEqual(descriptors);
  });

  it("defaults descriptors to empty array", () => {
    const err = new ForbiddenError({
      action: "read",
      table: posts,
      role: "anonymous",
    });
    expect(err.descriptors).toEqual([]);
  });

  it("has a name of ForbiddenError", () => {
    const err = new ForbiddenError({
      action: "read",
      table: posts,
      role: "anonymous",
    });
    expect(err.name).toBe("ForbiddenError");
  });

  it("is JSON-serializable", () => {
    const err = new ForbiddenError({
      action: "delete",
      table: posts,
      role: "user",
    });
    const json = JSON.parse(JSON.stringify(err.toJSON()));
    expect(json.action).toBe("delete");
    expect(json.table).toBe("posts");
    expect(json.role).toBe("user");
    expect(json.message).toBe("Role 'user' cannot delete on 'posts'");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: FAIL — cannot find module `../errors`.

**Step 3: Write implementation**

Create `packages/permissions/src/errors.ts`:

```typescript
import type { Table } from "drizzle-orm";
import type { PermissionAction, PermissionDescriptor } from "./types";

function getTableName(table: Table): string {
  return (table as any)._?.name ?? "unknown";
}

type ForbiddenErrorOptions = {
  action: PermissionAction;
  table: Table;
  role: string;
  descriptors?: PermissionDescriptor[];
};

export class ForbiddenError extends Error {
  readonly action: PermissionAction;
  readonly table: Table;
  readonly role: string;
  readonly descriptors: PermissionDescriptor[];

  constructor(options: ForbiddenErrorOptions) {
    const tableName = getTableName(options.table);
    super(`Role '${options.role}' cannot ${options.action} on '${tableName}'`);
    this.name = "ForbiddenError";
    this.action = options.action;
    this.table = options.table;
    this.role = options.role;
    this.descriptors = options.descriptors ?? [];
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      table: getTableName(this.table),
      role: this.role,
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/permissions/src/errors.ts packages/permissions/src/__tests__/errors.test.ts
git commit -m "feat(permissions): add ForbiddenError class"
```

---

### Task 4: grant() Function

**Files:**
- Create: `packages/permissions/src/grant.ts`
- Test: `packages/permissions/src/__tests__/grant.test.ts`

**Step 1: Write failing tests**

Create `packages/permissions/src/__tests__/grant.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { grant } from "../grant";

// Minimal fake tables
const posts = { _: { name: "posts" } } as any;
const comments = { _: { name: "comments" } } as any;

describe("grant", () => {
  it("creates a grant with action and subject", () => {
    const g = grant("read", posts);
    expect(g.action).toBe("read");
    expect(g.subject).toBe(posts);
    expect(g.where).toBeUndefined();
  });

  it("creates a grant with a where clause", () => {
    const whereFn = (row: any) => row.published;
    const g = grant("read", posts, { where: whereFn });
    expect(g.action).toBe("read");
    expect(g.subject).toBe(posts);
    expect(g.where).toBe(whereFn);
  });

  it("creates a grant with 'all' subject", () => {
    const g = grant("manage", "all");
    expect(g.action).toBe("manage");
    expect(g.subject).toBe("all");
  });

  it("accepts all CRUD actions", () => {
    expect(grant("read", posts).action).toBe("read");
    expect(grant("create", posts).action).toBe("create");
    expect(grant("update", posts).action).toBe("update");
    expect(grant("delete", posts).action).toBe("delete");
    expect(grant("manage", posts).action).toBe("manage");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: FAIL — cannot find module `../grant`.

**Step 3: Write implementation**

Create `packages/permissions/src/grant.ts`:

```typescript
import type { Table } from "drizzle-orm";
import type { PermissionAction, Grant, WhereClause } from "./types";

type GrantOptions<TUser = unknown> = {
  where?: WhereClause<TUser>;
};

export function grant<TUser = unknown>(
  action: PermissionAction,
  subject: Table | "all",
  options?: GrantOptions<TUser>,
): Grant<TUser> {
  return {
    action,
    subject,
    where: options?.where,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/permissions/src/grant.ts packages/permissions/src/__tests__/grant.test.ts
git commit -m "feat(permissions): add grant() factory function"
```

---

### Task 5: definePermissions() — Basic (No Hierarchy)

**Files:**
- Create: `packages/permissions/src/define-permissions.ts`
- Test: `packages/permissions/src/__tests__/define-permissions.test.ts`

**Step 1: Write failing tests for basic usage**

Create `packages/permissions/src/__tests__/define-permissions.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { definePermissions } from "../define-permissions";
import { grant } from "../grant";

const posts = { _: { name: "posts" } } as any;
const comments = { _: { name: "comments" } } as any;

describe("definePermissions", () => {
  describe("basic (no hierarchy)", () => {
    it("returns roles and grants", () => {
      const perms = definePermissions({
        roles: ["anonymous", "user"] as const,
        grants: {
          anonymous: [grant("read", posts)],
          user: [grant("read", posts), grant("create", posts)],
        },
      });

      expect(perms.roles).toEqual(["anonymous", "user"]);
      expect(perms.grants.anonymous).toHaveLength(1);
      expect(perms.grants.user).toHaveLength(2);
    });

    it("resolvedGrants equals grants when there is no hierarchy", () => {
      const perms = definePermissions({
        roles: ["anonymous", "user"] as const,
        grants: {
          anonymous: [grant("read", posts)],
          user: [grant("create", posts)],
        },
      });

      expect(perms.resolvedGrants.anonymous).toEqual(perms.grants.anonymous);
      expect(perms.resolvedGrants.user).toEqual(perms.grants.user);
    });

    it("handles empty grants for a role", () => {
      const perms = definePermissions({
        roles: ["anonymous", "admin"] as const,
        grants: {
          anonymous: [],
          admin: [grant("manage", "all")],
        },
      });

      expect(perms.resolvedGrants.anonymous).toEqual([]);
      expect(perms.resolvedGrants.admin).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: FAIL — cannot find module `../define-permissions`.

**Step 3: Write implementation**

Create `packages/permissions/src/define-permissions.ts`:

```typescript
import type { Grant, Permissions, PermissionsConfig } from "./types";

export function definePermissions<
  TRoles extends readonly string[],
  TUser = unknown,
>(config: PermissionsConfig<TRoles, TUser>): Permissions<TRoles, TUser> {
  const { roles, grants, hierarchy } = config;

  const resolvedGrants = resolveHierarchy(roles, grants, hierarchy);

  return {
    roles,
    grants,
    resolvedGrants,
  };
}

function resolveHierarchy<TRoles extends readonly string[], TUser>(
  roles: TRoles,
  grants: Record<string, Grant<TUser>[]>,
  hierarchy?: Partial<Record<string, string[]>>,
): Record<string, Grant<TUser>[]> {
  if (!hierarchy) {
    return { ...grants };
  }

  const resolved: Record<string, Grant<TUser>[]> = {};
  const resolving = new Set<string>();

  function resolve(role: string): Grant<TUser>[] {
    if (resolved[role]) return resolved[role];

    if (resolving.has(role)) {
      throw new Error(`Circular role hierarchy detected: '${role}' inherits from itself`);
    }

    resolving.add(role);

    const own = grants[role] ?? [];
    const parents = hierarchy?.[role] ?? [];

    const inherited = parents.flatMap((parent) => resolve(parent));

    resolved[role] = [...inherited, ...own];
    resolving.delete(role);

    return resolved[role];
  }

  for (const role of roles) {
    resolve(role as string);
  }

  return resolved;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/permissions/src/define-permissions.ts packages/permissions/src/__tests__/define-permissions.test.ts
git commit -m "feat(permissions): add definePermissions() with basic grants"
```

---

### Task 6: definePermissions() — Role Hierarchy

**Files:**
- Modify: `packages/permissions/src/__tests__/define-permissions.test.ts`

**Step 1: Add hierarchy tests**

Append to `packages/permissions/src/__tests__/define-permissions.test.ts`:

```typescript
  describe("with hierarchy", () => {
    it("inherits grants from parent roles", () => {
      const perms = definePermissions({
        roles: ["anonymous", "user", "admin"] as const,
        hierarchy: {
          user: ["anonymous"],
          admin: ["user"],
        },
        grants: {
          anonymous: [grant("read", posts)],
          user: [grant("create", posts)],
          admin: [grant("manage", "all")],
        },
      });

      // anonymous: just own grants
      expect(perms.resolvedGrants.anonymous).toHaveLength(1);

      // user: anonymous(1) + own(1) = 2
      expect(perms.resolvedGrants.user).toHaveLength(2);
      expect(perms.resolvedGrants.user[0].action).toBe("read"); // inherited
      expect(perms.resolvedGrants.user[1].action).toBe("create"); // own

      // admin: anonymous(1) + user(1) + own(1) = 3
      expect(perms.resolvedGrants.admin).toHaveLength(3);
    });

    it("inherits from multiple parents", () => {
      const perms = definePermissions({
        roles: ["reader", "writer", "editor"] as const,
        hierarchy: {
          editor: ["reader", "writer"],
        },
        grants: {
          reader: [grant("read", posts)],
          writer: [grant("create", posts)],
          editor: [grant("update", posts)],
        },
      });

      // editor: reader(1) + writer(1) + own(1) = 3
      expect(perms.resolvedGrants.editor).toHaveLength(3);
    });

    it("throws on circular hierarchy", () => {
      expect(() =>
        definePermissions({
          roles: ["a", "b"] as const,
          hierarchy: {
            a: ["b"],
            b: ["a"],
          },
          grants: {
            a: [],
            b: [],
          },
        }),
      ).toThrow("Circular role hierarchy");
    });

    it("handles deep chains", () => {
      const perms = definePermissions({
        roles: ["a", "b", "c", "d"] as const,
        hierarchy: {
          b: ["a"],
          c: ["b"],
          d: ["c"],
        },
        grants: {
          a: [grant("read", posts)],
          b: [grant("create", posts)],
          c: [grant("update", posts)],
          d: [grant("delete", posts)],
        },
      });

      expect(perms.resolvedGrants.d).toHaveLength(4);
    });
  });
```

**Step 2: Run tests to verify they pass**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS (hierarchy logic was already implemented in Task 5).

**Step 3: Commit**

```bash
git add packages/permissions/src/__tests__/define-permissions.test.ts
git commit -m "test(permissions): add role hierarchy tests"
```

---

### Task 7: checkPermissions()

**Files:**
- Create: `packages/permissions/src/check.ts`
- Test: `packages/permissions/src/__tests__/check.test.ts`

**Step 1: Write failing tests**

Create `packages/permissions/src/__tests__/check.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { checkPermissions } from "../check";
import { definePermissions } from "../define-permissions";
import { grant } from "../grant";

const posts = { _: { name: "posts" } } as any;
const comments = { _: { name: "comments" } } as any;
const auditLogs = { _: { name: "audit_logs" } } as any;

const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  hierarchy: {
    user: ["anonymous"],
    editor: ["user"],
    admin: ["editor"],
  },
  grants: {
    anonymous: [grant("read", posts)],
    user: [grant("create", posts), grant("create", comments)],
    editor: [grant("update", posts), grant("delete", posts)],
    admin: [grant("manage", "all")],
  },
});

describe("checkPermissions", () => {
  it("permits when role has the exact grant", () => {
    const result = checkPermissions("user", permissions, [
      { action: "create", table: posts },
    ]);
    expect(result.permitted).toBe(true);
    expect(result.denied).toEqual([]);
    expect(result.reasons).toEqual([]);
  });

  it("denies when role lacks the grant", () => {
    const result = checkPermissions("anonymous", permissions, [
      { action: "create", table: posts },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(1);
    expect(result.denied[0].action).toBe("create");
    expect(result.reasons).toHaveLength(1);
  });

  it("checks all descriptors — all must pass", () => {
    const result = checkPermissions("user", permissions, [
      { action: "create", table: posts },
      { action: "create", table: comments },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("fails if any descriptor is denied", () => {
    const result = checkPermissions("user", permissions, [
      { action: "create", table: posts },
      { action: "delete", table: posts }, // user can't delete
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(1);
    expect(result.denied[0].action).toBe("delete");
  });

  it("respects role hierarchy — inherited grants work", () => {
    // user inherits "read" from anonymous
    const result = checkPermissions("user", permissions, [
      { action: "read", table: posts },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("manage grants match any CRUD action", () => {
    const result = checkPermissions("admin", permissions, [
      { action: "read", table: posts },
      { action: "create", table: posts },
      { action: "update", table: comments },
      { action: "delete", table: auditLogs },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("'all' subject matches any table", () => {
    const result = checkPermissions("admin", permissions, [
      { action: "create", table: auditLogs },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("returns reasons for each denied descriptor", () => {
    const result = checkPermissions("anonymous", permissions, [
      { action: "create", table: posts },
      { action: "delete", table: comments },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(2);
    expect(result.reasons).toHaveLength(2);
    expect(result.reasons[0]).toContain("anonymous");
    expect(result.reasons[0]).toContain("create");
    expect(result.reasons[0]).toContain("posts");
  });

  it("permits empty descriptors array", () => {
    const result = checkPermissions("anonymous", permissions, []);
    expect(result.permitted).toBe(true);
    expect(result.denied).toEqual([]);
  });

  it("handles manage descriptor by checking for manage grant", () => {
    const result = checkPermissions("admin", permissions, [
      { action: "manage", table: posts },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("denies manage descriptor when role only has specific CRUD grants", () => {
    const result = checkPermissions("editor", permissions, [
      { action: "manage", table: posts },
    ]);
    // editor has update + delete + inherited read + create, but not "manage" explicitly
    // however, having all 4 CRUD actions on a table should satisfy a "manage" descriptor
    expect(result.permitted).toBe(true);
  });

  it("denies manage descriptor when role has only partial CRUD", () => {
    const result = checkPermissions("anonymous", permissions, [
      { action: "manage", table: posts },
    ]);
    // anonymous only has "read" on posts
    expect(result.permitted).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: FAIL — cannot find module `../check`.

**Step 3: Write implementation**

Create `packages/permissions/src/check.ts`:

```typescript
import type { Table } from "drizzle-orm";
import type {
  Grant,
  PermissionAction,
  PermissionCheckResult,
  PermissionDescriptor,
  Permissions,
  CrudAction,
} from "./types";
import { CRUD_ACTIONS } from "./types";

function getTableName(table: Table): string {
  return (table as any)._?.name ?? "unknown";
}

function grantMatchesAction(grantAction: PermissionAction, requiredAction: PermissionAction): boolean {
  if (grantAction === requiredAction) return true;
  if (grantAction === "manage") return true;
  return false;
}

function grantMatchesTable(grantSubject: Table | "all", requiredTable: Table): boolean {
  if (grantSubject === "all") return true;
  return grantSubject === requiredTable;
}

function hasGrantFor(
  grants: Grant[],
  action: PermissionAction,
  table: Table,
): boolean {
  return grants.some(
    (g) => grantMatchesAction(g.action, action) && grantMatchesTable(g.subject, table),
  );
}

function hasManagePermission(grants: Grant[], table: Table): boolean {
  // Explicit manage grant
  if (hasGrantFor(grants, "manage", table)) return true;

  // All 4 CRUD actions present
  return CRUD_ACTIONS.every((action) => hasGrantFor(grants, action, table));
}

export function checkPermissions(
  role: string,
  permissions: Permissions,
  descriptors: PermissionDescriptor[],
): PermissionCheckResult {
  const grants = permissions.resolvedGrants[role] ?? [];

  const denied: PermissionDescriptor[] = [];
  const reasons: string[] = [];

  for (const descriptor of descriptors) {
    let permitted: boolean;

    if (descriptor.action === "manage") {
      permitted = hasManagePermission(grants, descriptor.table);
    } else {
      permitted = hasGrantFor(grants, descriptor.action, descriptor.table);
    }

    if (!permitted) {
      denied.push(descriptor);
      reasons.push(
        `Role '${role}' cannot ${descriptor.action} on '${getTableName(descriptor.table)}'`,
      );
    }
  }

  return {
    permitted: denied.length === 0,
    denied,
    reasons,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/permissions/src/check.ts packages/permissions/src/__tests__/check.test.ts
git commit -m "feat(permissions): add checkPermissions() with structural checking"
```

---

### Task 8: Barrel Exports (index.ts + client.ts)

**Files:**
- Modify: `packages/permissions/src/index.ts`
- Create: `packages/permissions/src/client.ts`

**Step 1: Write index.ts**

Replace `packages/permissions/src/index.ts`:

```typescript
export { definePermissions } from "./define-permissions";
export { grant } from "./grant";
export { checkPermissions } from "./check";
export { ForbiddenError } from "./errors";
export type {
  PermissionAction,
  CrudAction,
  Grant,
  WhereClause,
  PermissionDescriptor,
  PermissionCheckResult,
  Permissions,
  PermissionsConfig,
} from "./types";
export { CRUD_ACTIONS } from "./types";
```

**Step 2: Write client.ts**

Create `packages/permissions/src/client.ts` — re-exports only what's safe for client bundles (no where-clause related code that references Drizzle SQL internals):

```typescript
export { ForbiddenError } from "./errors";
export type {
  PermissionAction,
  CrudAction,
  PermissionDescriptor,
  PermissionCheckResult,
} from "./types";
```

**Step 3: Build the package**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm build`
Expected: Builds successfully, outputs `dist/index.js`, `dist/index.d.ts`, `dist/client.js`, `dist/client.d.ts`.

**Step 4: Type-check**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm typecheck`
Expected: No type errors.

**Step 5: Run all tests one final time**

Run: `cd /Users/danielschmidt/fun/cfast/packages/permissions && pnpm test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add packages/permissions/src/index.ts packages/permissions/src/client.ts
git commit -m "feat(permissions): add barrel exports for server and client entrypoints"
```

---

### Task 9: README Sync — Verify Examples Match Implementation

**Files:**
- Modify: `packages/permissions/README.md`

**Step 1: Run the readme-sync agent**

Run the `readme-sync` agent from `.claude/agents/` against the permissions package to verify all code examples in the README compile and match the actual API.

**Step 2: Check specific examples**

Verify these README examples against the implementation:

1. The `definePermissions()` example (line ~27) — ensure the `grants` record type matches `PermissionsConfig`. The `where` callbacks like `(post) => post.published === true` are plain JS expressions, but the hierarchy section uses `eq(post.published, true)`. Standardize to whichever the implementation actually accepts (the where clause is opaque to this package — it stores functions, doesn't evaluate them — so both are technically valid, but examples should be consistent).

2. The `checkPermissions()` example (line ~155) — ensure the function signature matches: `checkPermissions(role: string, permissions, descriptors)`, not `checkPermissions(user, permissions, descriptors)`. The README currently says `checkPermissions(user, permissions, descriptors)` but our implementation takes a role string. Update the README if needed.

3. The `ForbiddenError` example (line ~226) — ensure all properties (`action`, `table`, `role`, `message`, `descriptors`) match the implementation.

4. The `PermissionDescriptor` type example — ensure it matches the actual exported type.

**Step 3: Fix any discrepancies**

Update README examples to match the actual implementation. Common fixes:
- `checkPermissions(currentUser, ...)` → `checkPermissions("user", ...)` if the function takes a role string
- Ensure all import paths are correct (`"@cfast/permissions"` not `"@cfast/permissions/server"`)
- Ensure the `Permissions` type description matches the actual shape

**Step 4: Commit**

```bash
git add packages/permissions/README.md
git commit -m "docs(permissions): sync README examples with implementation"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Project setup (vitest) | `package.json` |
| 2 | Core types | `src/types.ts` |
| 3 | ForbiddenError | `src/errors.ts` |
| 4 | grant() factory | `src/grant.ts` |
| 5 | definePermissions() basic | `src/define-permissions.ts` |
| 6 | Role hierarchy tests | tests only |
| 7 | checkPermissions() | `src/check.ts` |
| 8 | Barrel exports + build | `src/index.ts`, `src/client.ts` |
| 9 | README sync | `README.md` |

Total: 9 tasks, ~5 source files, ~5 test files, ~3KB output.
