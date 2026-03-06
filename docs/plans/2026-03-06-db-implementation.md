# @cfast/db Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the permission-aware, cached Drizzle ORM wrapper for Cloudflare D1 as specified in `packages/db/README.md`.

**Architecture:** Lazy `Operation` objects wrap Drizzle queries. Each Operation carries `.permissions` (inspectable immediately) and `.run(params)` (checks permissions, applies permission-derived WHERE clauses, executes via Drizzle prepared statements, caches reads). `createDb()` factory wires D1, schema, permissions, user, and cache config into a `Db` instance with `.query()`, `.insert()`, `.update()`, `.delete()`, `.unsafe()`, `.batch()` methods. A standalone `compose()` function merges operations.

**Tech Stack:** drizzle-orm (D1/SQLite dialect), @cfast/permissions, Cloudflare Workers Cache API + KV, vitest for testing.

**Key type decision:** `TParams` on Operation uses `Record<string, unknown>` for the initial implementation. Full type-level inference of `sql.placeholder()` names is deferred — runtime behavior is correct regardless.

---

### Task 1: Package scaffolding and test setup

**Files:**
- Modify: `packages/db/package.json`
- Create: `packages/db/src/__tests__/helpers.ts`

**Step 1: Update package.json with test dependencies**

Add vitest and drizzle-orm dev deps:

```json
{
  "peerDependencies": {
    "drizzle-orm": ">=0.35"
  },
  "dependencies": {
    "@cfast/permissions": "workspace:*"
  },
  "devDependencies": {
    "drizzle-orm": "^0.44.0",
    "tsup": "^8",
    "typescript": "^5.7",
    "vitest": "^4.0.18"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run"
  }
}
```

**Step 2: Create test helpers**

Create `packages/db/src/__tests__/helpers.ts` with mock D1, mock tables, and a test permissions config:

```typescript
import { definePermissions, grant } from "@cfast/permissions";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Real Drizzle SQLite tables for testing
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id").notNull(),
  category: text("category"),
  published: integer("published", { mode: "boolean" }).default(false),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  body: text("body").notNull(),
  authorId: text("author_id").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  userId: text("user_id").notNull(),
});

export const schema = { posts, comments, auditLogs };

export type TestUser = { id: string; role: string };

export const testPermissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  hierarchy: {
    user: ["anonymous"],
    editor: ["user"],
    admin: ["editor"],
  },
  grants: {
    anonymous: [
      grant("read", posts, {
        where: (cols: any) => sql`${cols.published} = 1`,
      }),
    ],
    user: [
      grant("create", posts),
      grant("update", posts, {
        where: (cols: any, user: any) => sql`${cols.authorId} = ${user.id}`,
      }),
      grant("create", comments),
    ],
    editor: [
      grant("read", posts),
      grant("update", posts),
      grant("delete", posts),
      grant("create", auditLogs),
    ],
    admin: [grant("manage", "all")],
  },
});

// Minimal D1 mock that records calls
export function createMockD1(): D1Database & { _calls: Array<{ sql: string; params: unknown[] }> } {
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  const mockResults = {
    results: [],
    success: true,
    meta: {},
  };

  const stmt = (sqlStr: string) => ({
    bind: (...params: unknown[]) => {
      calls.push({ sql: sqlStr, params });
      return {
        all: async () => mockResults,
        first: async () => null,
        run: async () => mockResults,
        raw: async () => [],
      };
    },
    all: async () => { calls.push({ sql: sqlStr, params: [] }); return mockResults; },
    first: async () => { calls.push({ sql: sqlStr, params: [] }); return null; },
    run: async () => { calls.push({ sql: sqlStr, params: [] }); return mockResults; },
    raw: async () => { calls.push({ sql: sqlStr, params: [] }); return []; },
  });

  return {
    _calls: calls,
    prepare: (sqlStr: string) => stmt(sqlStr),
    batch: async (stmts: any[]) => stmts.map(() => mockResults),
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as any;
}
```

**Step 3: Install deps and verify**

Run: `cd packages/db && pnpm install`

**Step 4: Commit**

```bash
git add packages/db/
git commit -m "feat(db): scaffold package with test helpers and dev deps"
```

---

### Task 2: Core types

**Files:**
- Create: `packages/db/src/types.ts`

**Step 1: Write the types file**

```typescript
import type { Permissions, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";

// --- Operation ---

export type Operation<TResult> = {
  permissions: PermissionDescriptor[];
  run: (params: Record<string, unknown>) => Promise<TResult>;
};

// --- Cache ---

export type CacheBackend = "cache-api" | "kv";

export type CacheConfig = {
  backend: CacheBackend;
  kv?: KVNamespace;
  ttl?: string;
  staleWhileRevalidate?: string;
  exclude?: string[];
  onHit?: (key: string, table: string) => void;
  onMiss?: (key: string, table: string) => void;
  onInvalidate?: (tables: string[]) => void;
};

export type QueryCacheOptions =
  | false
  | { ttl?: string; staleWhileRevalidate?: string; tags?: string[] };

// --- DB Config ---

export type DbConfig = {
  d1: D1Database;
  schema: Record<string, DrizzleTable>;
  permissions: Permissions;
  user: { id: string; role: string } | null;
  cache?: CacheConfig | false;
};

// --- Query options ---

export type FindManyOptions = {
  columns?: Record<string, boolean>;
  where?: any; // Drizzle SQL expression
  orderBy?: any;
  limit?: number;
  offset?: number;
  with?: Record<string, any>;
  cache?: QueryCacheOptions;
};

export type FindFirstOptions = Omit<FindManyOptions, "limit" | "offset">;

// --- Db interface ---

export type Db = {
  query: (table: DrizzleTable) => QueryBuilder;
  insert: (table: DrizzleTable) => InsertBuilder;
  update: (table: DrizzleTable) => UpdateBuilder;
  delete: (table: DrizzleTable) => DeleteBuilder;
  unsafe: () => Db;
  batch: (operations: Operation<unknown>[]) => Operation<unknown[]>;
  cache: {
    invalidate: (options: { tags?: string[]; tables?: string[] }) => Promise<void>;
  };
};

export type QueryBuilder = {
  findMany: (options?: FindManyOptions) => Operation<unknown[]>;
  findFirst: (options?: FindFirstOptions) => Operation<unknown | undefined>;
};

export type InsertBuilder = {
  values: (values: Record<string, unknown>) => InsertReturningBuilder;
};

export type InsertReturningBuilder = Operation<void> & {
  returning: () => Operation<unknown>;
};

export type UpdateBuilder = {
  set: (values: Record<string, unknown>) => UpdateWhereBuilder;
};

export type UpdateWhereBuilder = {
  where: (condition: any) => UpdateReturningBuilder;
};

export type UpdateReturningBuilder = Operation<void> & {
  returning: () => Operation<unknown>;
};

export type DeleteBuilder = {
  where: (condition: any) => DeleteReturningBuilder;
};

export type DeleteReturningBuilder = Operation<void> & {
  returning: () => Operation<unknown>;
};
```

**Step 2: Create a type smoke test**

Create `packages/db/src/__tests__/types.test.ts`:

```typescript
import { describe, it, expectTypeOf } from "vitest";
import type { Operation, Db, DbConfig } from "../types";

describe("types", () => {
  it("Operation has permissions and run", () => {
    type TestOp = Operation<string[]>;
    expectTypeOf<TestOp["permissions"]>().toBeArray();
    expectTypeOf<TestOp["run"]>().toBeFunction();
  });

  it("Db has all required methods", () => {
    expectTypeOf<Db>().toHaveProperty("query");
    expectTypeOf<Db>().toHaveProperty("insert");
    expectTypeOf<Db>().toHaveProperty("update");
    expectTypeOf<Db>().toHaveProperty("delete");
    expectTypeOf<Db>().toHaveProperty("unsafe");
    expectTypeOf<Db>().toHaveProperty("batch");
    expectTypeOf<Db>().toHaveProperty("cache");
  });
});
```

**Step 3: Run test**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/db/src/types.ts packages/db/src/__tests__/types.test.ts
git commit -m "feat(db): add core types — Operation, Db, builders, cache config"
```

---

### Task 3: Permission compilation — grants to Drizzle WHERE clauses

**Files:**
- Create: `packages/db/src/permissions.ts`
- Create: `packages/db/src/__tests__/permissions.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { resolvePermissionFilters, checkOperationPermissions } from "../permissions";
import { testPermissions, posts, comments, auditLogs } from "./helpers";
import type { TestUser } from "./helpers";

describe("resolvePermissionFilters", () => {
  it("returns where clauses for a role+table from resolved grants", () => {
    const user: TestUser = { id: "user-1", role: "anonymous" };
    const filters = resolvePermissionFilters(testPermissions, user, "read", posts);
    expect(filters).toHaveLength(1);
    // The anonymous role has a where clause on read posts
  });

  it("returns empty array when grant has no where clause (unrestricted)", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const filters = resolvePermissionFilters(testPermissions, user, "read", posts);
    // Editor has unrestricted read on posts (no where clause)
    expect(filters).toHaveLength(0);
  });

  it("returns empty array for manage all grant", () => {
    const user: TestUser = { id: "user-1", role: "admin" };
    const filters = resolvePermissionFilters(testPermissions, user, "read", posts);
    expect(filters).toHaveLength(0);
  });
});

describe("checkOperationPermissions", () => {
  it("throws ForbiddenError when role lacks permission", () => {
    const user: TestUser = { id: "user-1", role: "anonymous" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, [
        { action: "create", table: posts },
      ]),
    ).toThrow("ForbiddenError");
  });

  it("does not throw when role has permission", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, [
        { action: "create", table: posts },
      ]),
    ).not.toThrow();
  });

  it("throws when any descriptor is denied", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, [
        { action: "create", table: posts },
        { action: "delete", table: posts },
      ]),
    ).toThrow("ForbiddenError");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && pnpm test`
Expected: FAIL — module not found

**Step 3: Implement permissions.ts**

```typescript
import {
  checkPermissions,
  ForbiddenError,
  type Permissions,
  type PermissionDescriptor,
  type PermissionAction,
  type DrizzleTable,
  type Grant,
} from "@cfast/permissions";

type User = { id: string; role: string };

/**
 * Find matching grants for a role+action+table and return their where clauses.
 * Returns empty array if ANY matching grant is unrestricted (no where clause),
 * meaning the user has full access — no filter needed.
 */
export function resolvePermissionFilters(
  permissions: Permissions,
  user: User,
  action: PermissionAction,
  table: DrizzleTable,
): Array<(columns: Record<string, unknown>, user: User) => unknown> {
  const grants = permissions.resolvedGrants[user.role] ?? [];

  const matching = grants.filter((g) => {
    const actionMatch = g.action === action || g.action === "manage";
    const tableMatch = g.subject === "all" || g.subject === table;
    return actionMatch && tableMatch;
  });

  if (matching.length === 0) return [];

  // If any matching grant has no where clause, access is unrestricted
  if (matching.some((g) => !g.where)) return [];

  // Return all where clause functions
  return matching
    .filter((g): g is Grant & { where: NonNullable<Grant["where"]> } => !!g.where)
    .map((g) => g.where as (columns: Record<string, unknown>, user: User) => unknown);
}

/**
 * Check that a user's role satisfies all permission descriptors.
 * Throws ForbiddenError on first failure.
 */
export function checkOperationPermissions(
  permissions: Permissions,
  user: User | null,
  descriptors: PermissionDescriptor[],
): void {
  if (descriptors.length === 0) return;

  const role = user?.role ?? "anonymous";
  const result = checkPermissions(role, permissions, descriptors);

  if (!result.permitted) {
    const first = result.denied[0];
    throw new ForbiddenError({
      action: first.action,
      table: first.table,
      role,
      descriptors: result.denied,
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/permissions.ts packages/db/src/__tests__/permissions.test.ts
git commit -m "feat(db): permission compilation — resolve grants to WHERE clauses"
```

---

### Task 4: Query builder — db.query(table).findMany/findFirst

**Files:**
- Create: `packages/db/src/query-builder.ts`
- Create: `packages/db/src/__tests__/query-builder.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { createQueryBuilder } from "../query-builder";
import { testPermissions, posts, schema, createMockD1 } from "./helpers";
import type { TestUser } from "./helpers";

describe("QueryBuilder", () => {
  const mockD1 = createMockD1();

  describe("findMany", () => {
    it("returns an Operation with correct permissions", () => {
      const user: TestUser = { id: "user-1", role: "editor" };
      const qb = createQueryBuilder({
        d1: mockD1,
        schema,
        permissions: testPermissions,
        user,
        table: posts,
        unsafe: false,
      });

      const op = qb.findMany();
      expect(op.permissions).toEqual([{ action: "read", table: posts }]);
      expect(typeof op.run).toBe("function");
    });

    it("returns empty permissions when unsafe", () => {
      const user: TestUser = { id: "user-1", role: "editor" };
      const qb = createQueryBuilder({
        d1: mockD1,
        schema,
        permissions: testPermissions,
        user,
        table: posts,
        unsafe: true,
      });

      const op = qb.findMany();
      expect(op.permissions).toEqual([]);
    });
  });

  describe("findFirst", () => {
    it("returns an Operation with correct permissions", () => {
      const user: TestUser = { id: "user-1", role: "user" };
      const qb = createQueryBuilder({
        d1: mockD1,
        schema,
        permissions: testPermissions,
        user,
        table: posts,
        unsafe: false,
      });

      const op = qb.findFirst();
      expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && pnpm test`
Expected: FAIL

**Step 3: Implement query-builder.ts**

Uses `drizzle(d1)` to create a Drizzle instance, builds the query using Drizzle's relational query API, injects permission WHERE clauses at `.run()` time.

```typescript
import { drizzle } from "drizzle-orm/d1";
import { sql, and, or } from "drizzle-orm";
import type { Permissions, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import { resolvePermissionFilters, checkOperationPermissions } from "./permissions";
import type { Operation, FindManyOptions, FindFirstOptions, QueryCacheOptions } from "./types";

type User = { id: string; role: string };

type QueryBuilderConfig = {
  d1: D1Database;
  schema: Record<string, any>;
  permissions: Permissions;
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
  cacheConfig?: { exclude?: string[] };
};

function getTableKey(schema: Record<string, any>, table: DrizzleTable): string | undefined {
  for (const [key, val] of Object.entries(schema)) {
    if (val === table) return key;
  }
  return undefined;
}

function buildPermissionFilter(
  config: QueryBuilderConfig,
  action: "read",
  table: DrizzleTable,
): any {
  if (config.unsafe || !config.user) return undefined;
  const filters = resolvePermissionFilters(config.permissions, config.user, action, table);
  if (filters.length === 0) return undefined;

  // Get the table's columns from the Drizzle table object
  const columns = (table as any);
  const clauses = filters.map((fn) => fn(columns, config.user!));
  return clauses.length === 1 ? clauses[0] : or(...clauses);
}

export function createQueryBuilder(config: QueryBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const tableKey = getTableKey(config.schema, config.table);

  return {
    findMany(options?: FindManyOptions): Operation<unknown[]> {
      const permissions: PermissionDescriptor[] = config.unsafe
        ? []
        : [{ action: "read" as const, table: config.table }];

      return {
        permissions,
        async run(params: Record<string, unknown>): Promise<unknown[]> {
          if (!config.unsafe) {
            checkOperationPermissions(config.permissions, config.user, permissions);
          }

          if (!tableKey) throw new Error(`Table not found in schema`);

          const permFilter = buildPermissionFilter(config, "read", config.table);
          const userWhere = options?.where;
          const combinedWhere = permFilter && userWhere
            ? and(userWhere, permFilter)
            : permFilter ?? userWhere;

          const query = (db.query as any)[tableKey].findMany({
            ...options,
            where: combinedWhere,
          });

          return query.execute(params);
        },
      };
    },

    findFirst(options?: FindFirstOptions): Operation<unknown | undefined> {
      const permissions: PermissionDescriptor[] = config.unsafe
        ? []
        : [{ action: "read" as const, table: config.table }];

      return {
        permissions,
        async run(params: Record<string, unknown>): Promise<unknown | undefined> {
          if (!config.unsafe) {
            checkOperationPermissions(config.permissions, config.user, permissions);
          }

          if (!tableKey) throw new Error(`Table not found in schema`);

          const permFilter = buildPermissionFilter(config, "read", config.table);
          const userWhere = options?.where;
          const combinedWhere = permFilter && userWhere
            ? and(userWhere, permFilter)
            : permFilter ?? userWhere;

          const query = (db.query as any)[tableKey].findFirst({
            ...options,
            where: combinedWhere,
          });

          return query.execute(params);
        },
      };
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/query-builder.ts packages/db/src/__tests__/query-builder.test.ts
git commit -m "feat(db): query builder — db.query(table).findMany/findFirst"
```

---

### Task 5: Mutation builders — insert, update, delete

**Files:**
- Create: `packages/db/src/mutate-builder.ts`
- Create: `packages/db/src/__tests__/mutate-builder.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "../mutate-builder";
import { testPermissions, posts, schema, createMockD1 } from "./helpers";
import type { TestUser } from "./helpers";

describe("InsertBuilder", () => {
  it("returns Operation with create permission", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: false,
    });

    const op = builder.values({ title: "Hello" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
  });

  it("returning() returns Operation with create permission", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: false,
    });

    const op = builder.values({ title: "Hello" }).returning();
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
  });
});

describe("UpdateBuilder", () => {
  it("returns Operation with update permission", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: false,
    });

    const op = builder.set({ published: true }).where(undefined);
    expect(op.permissions).toEqual([{ action: "update", table: posts }]);
  });
});

describe("DeleteBuilder", () => {
  it("returns Operation with delete permission", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: false,
    });

    const op = builder.where(undefined);
    expect(op.permissions).toEqual([{ action: "delete", table: posts }]);
  });

  it("empty permissions when unsafe", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: true,
    });

    const op = builder.where(undefined);
    expect(op.permissions).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && pnpm test`
Expected: FAIL

**Step 3: Implement mutate-builder.ts**

```typescript
import { drizzle } from "drizzle-orm/d1";
import { and, or } from "drizzle-orm";
import type { Permissions, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import { resolvePermissionFilters, checkOperationPermissions } from "./permissions";
import type { Operation } from "./types";

type User = { id: string; role: string };

type MutateBuilderConfig = {
  d1: D1Database;
  schema: Record<string, any>;
  permissions: Permissions;
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
  onMutate?: (tableName: string) => void;
};

function makePermissions(
  config: MutateBuilderConfig,
  action: "create" | "update" | "delete",
): PermissionDescriptor[] {
  return config.unsafe ? [] : [{ action, table: config.table }];
}

function buildMutatePermissionFilter(
  config: MutateBuilderConfig,
  action: "update" | "delete",
): any {
  if (config.unsafe || !config.user) return undefined;
  const filters = resolvePermissionFilters(config.permissions, config.user, action, config.table);
  if (filters.length === 0) return undefined;
  const columns = config.table as any;
  const clauses = filters.map((fn) => fn(columns, config.user!));
  return clauses.length === 1 ? clauses[0] : or(...clauses);
}

export function createInsertBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const permissions = makePermissions(config, "create");
  const tableName = (config.table as any)._.name;

  return {
    values(values: Record<string, unknown>) {
      const base: Operation<void> & { returning: () => Operation<unknown> } = {
        permissions,
        async run(params: Record<string, unknown>): Promise<void> {
          if (!config.unsafe) {
            checkOperationPermissions(config.permissions, config.user, permissions);
          }
          await db.insert(config.table as any).values(values).run();
          config.onMutate?.(tableName);
        },
        returning() {
          return {
            permissions,
            async run(params: Record<string, unknown>): Promise<unknown> {
              if (!config.unsafe) {
                checkOperationPermissions(config.permissions, config.user, permissions);
              }
              const result = await db
                .insert(config.table as any)
                .values(values)
                .returning()
                .get();
              config.onMutate?.(tableName);
              return result;
            },
          };
        },
      };
      return base;
    },
  };
}

export function createUpdateBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const permissions = makePermissions(config, "update");
  const tableName = (config.table as any)._.name;

  return {
    set(values: Record<string, unknown>) {
      return {
        where(condition: any) {
          const base: Operation<void> & { returning: () => Operation<unknown> } = {
            permissions,
            async run(params: Record<string, unknown>): Promise<void> {
              if (!config.unsafe) {
                checkOperationPermissions(config.permissions, config.user, permissions);
              }
              const permFilter = buildMutatePermissionFilter(config, "update");
              const combinedWhere = permFilter && condition
                ? and(condition, permFilter)
                : permFilter ?? condition;

              await db
                .update(config.table as any)
                .set(values)
                .where(combinedWhere)
                .run();
              config.onMutate?.(tableName);
            },
            returning() {
              return {
                permissions,
                async run(params: Record<string, unknown>): Promise<unknown> {
                  if (!config.unsafe) {
                    checkOperationPermissions(config.permissions, config.user, permissions);
                  }
                  const permFilter = buildMutatePermissionFilter(config, "update");
                  const combinedWhere = permFilter && condition
                    ? and(condition, permFilter)
                    : permFilter ?? condition;

                  const result = await db
                    .update(config.table as any)
                    .set(values)
                    .where(combinedWhere)
                    .returning()
                    .get();
                  config.onMutate?.(tableName);
                  return result;
                },
              };
            },
          };
          return base;
        },
      };
    },
  };
}

export function createDeleteBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const permissions = makePermissions(config, "delete");
  const tableName = (config.table as any)._.name;

  return {
    where(condition: any) {
      const base: Operation<void> & { returning: () => Operation<unknown> } = {
        permissions,
        async run(params: Record<string, unknown>): Promise<void> {
          if (!config.unsafe) {
            checkOperationPermissions(config.permissions, config.user, permissions);
          }
          const permFilter = buildMutatePermissionFilter(config, "delete");
          const combinedWhere = permFilter && condition
            ? and(condition, permFilter)
            : permFilter ?? condition;

          await db
            .delete(config.table as any)
            .where(combinedWhere)
            .run();
          config.onMutate?.(tableName);
        },
        returning() {
          return {
            permissions,
            async run(params: Record<string, unknown>): Promise<unknown> {
              if (!config.unsafe) {
                checkOperationPermissions(config.permissions, config.user, permissions);
              }
              const permFilter = buildMutatePermissionFilter(config, "delete");
              const combinedWhere = permFilter && condition
                ? and(condition, permFilter)
                : permFilter ?? condition;

              const result = await db
                .delete(config.table as any)
                .where(combinedWhere)
                .returning()
                .get();
              config.onMutate?.(tableName);
              return result;
            },
          };
        },
      };
      return base;
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/mutate-builder.ts packages/db/src/__tests__/mutate-builder.test.ts
git commit -m "feat(db): mutation builders — insert, update, delete with permission WHERE injection"
```

---

### Task 6: compose() function

**Files:**
- Create: `packages/db/src/compose.ts`
- Create: `packages/db/src/__tests__/compose.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { compose } from "../compose";
import type { Operation } from "../types";

const posts = { _: { name: "posts" } } as any;
const auditLogs = { _: { name: "audit_logs" } } as any;

function mockOp<T>(perms: any[], result: T): Operation<T> {
  return {
    permissions: perms,
    run: async () => result,
  };
}

describe("compose", () => {
  it("merges permissions from all operations", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "updated");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "logged");

    const composed = compose([op1, op2], (run1, run2) => {
      run1({});
      run2({});
    });

    expect(composed.permissions).toEqual([
      { action: "update", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("deduplicates identical permission descriptors", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "a");
    const op2 = mockOp([{ action: "update", table: posts }], "b");

    const composed = compose([op1, op2], (run1, run2) => {
      run1({});
      run2({});
    });

    expect(composed.permissions).toHaveLength(1);
  });

  it("run() calls the executor with run functions", async () => {
    const op1 = mockOp([{ action: "update", table: posts }], "updated");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "logged");

    const composed = compose([op1, op2], async (run1, run2) => {
      const r1 = await run1({});
      const r2 = await run2({});
      return [r1, r2];
    });

    const result = await composed.run({});
    expect(result).toEqual(["updated", "logged"]);
  });

  it("supports async executors", async () => {
    const op1 = mockOp([], 42);

    const composed = compose([op1], async (run1) => {
      const val = await run1({});
      return val * 2;
    });

    const result = await composed.run({});
    expect(result).toBe(84);
  });

  it("is nestable — compose of composed operations", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "a");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "b");

    const inner = compose([op1, op2], (r1, r2) => {
      r1({});
      r2({});
    });

    const op3 = mockOp([{ action: "delete", table: posts }], "c");

    const outer = compose([inner, op3], (rInner, r3) => {
      rInner({});
      r3({});
    });

    // update+create from inner, delete from op3, but update+delete dedup to unique
    expect(outer.permissions).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && pnpm test`
Expected: FAIL

**Step 3: Implement compose.ts**

```typescript
import type { PermissionDescriptor } from "@cfast/permissions";
import type { Operation } from "./types";

function deduplicateDescriptors(
  descriptors: PermissionDescriptor[],
): PermissionDescriptor[] {
  const seen = new Set<string>();
  const result: PermissionDescriptor[] = [];

  for (const d of descriptors) {
    const key = `${d.action}:${(d.table as any)._?.name ?? "unknown"}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d);
    }
  }

  return result;
}

type RunFn = (params: Record<string, unknown>) => Promise<unknown>;

export function compose<TOps extends Operation<unknown>[], TResult>(
  operations: [...TOps],
  executor: (...runs: { [K in keyof TOps]: TOps[K]["run"] }[number] extends RunFn ? RunFn[] : never) => TResult | Promise<TResult>,
): Operation<TResult>;

export function compose(
  operations: Operation<unknown>[],
  executor: (...runs: Array<(params: Record<string, unknown>) => Promise<unknown>>) => unknown,
): Operation<unknown> {
  const allPermissions = deduplicateDescriptors(
    operations.flatMap((op) => op.permissions),
  );

  return {
    permissions: allPermissions,
    async run(_params: Record<string, unknown>) {
      // Execute via the executor, passing each operation's .run
      const runs = operations.map((op) => op.run);
      return executor(...runs);
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/compose.ts packages/db/src/__tests__/compose.test.ts
git commit -m "feat(db): compose() — merge operations with deduplicated permissions"
```

---

### Task 7: Cache layer

**Files:**
- Create: `packages/db/src/cache.ts`
- Create: `packages/db/src/__tests__/cache.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { createCacheManager } from "../cache";

describe("CacheManager", () => {
  describe("key generation", () => {
    it("generates different keys for different roles", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      const key1 = cache.generateKey("SELECT * FROM posts", "anonymous", 1);
      const key2 = cache.generateKey("SELECT * FROM posts", "editor", 1);
      expect(key1).not.toBe(key2);
    });

    it("generates different keys for different table versions", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      const key1 = cache.generateKey("SELECT * FROM posts", "user", 1);
      const key2 = cache.generateKey("SELECT * FROM posts", "user", 2);
      expect(key1).not.toBe(key2);
    });
  });

  describe("table versions", () => {
    it("starts at version 0", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      expect(cache.getTableVersion("posts")).toBe(0);
    });

    it("increments on invalidation", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      cache.invalidateTable("posts");
      expect(cache.getTableVersion("posts")).toBe(1);
    });
  });

  describe("excluded tables", () => {
    it("isExcluded returns true for excluded tables", () => {
      const cache = createCacheManager({
        backend: "cache-api",
        exclude: ["sessions", "auditLogs"],
      });
      expect(cache.isExcluded("sessions")).toBe(true);
      expect(cache.isExcluded("posts")).toBe(false);
    });
  });

  describe("TTL parsing", () => {
    it("parses seconds", () => {
      const cache = createCacheManager({ backend: "cache-api", ttl: "30s" });
      expect(cache.getTtlSeconds()).toBe(30);
    });

    it("parses minutes", () => {
      const cache = createCacheManager({ backend: "cache-api", ttl: "5m" });
      expect(cache.getTtlSeconds()).toBe(300);
    });

    it("defaults to 60s when no TTL specified", () => {
      const cache = createCacheManager({ backend: "cache-api" });
      expect(cache.getTtlSeconds()).toBe(60);
    });
  });

  describe("observability hooks", () => {
    it("calls onInvalidate when tables are invalidated", () => {
      const onInvalidate = vi.fn();
      const cache = createCacheManager({
        backend: "cache-api",
        onInvalidate,
      });
      cache.invalidateTable("posts");
      expect(onInvalidate).toHaveBeenCalledWith(["posts"]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && pnpm test`
Expected: FAIL

**Step 3: Implement cache.ts**

```typescript
import type { CacheConfig, QueryCacheOptions } from "./types";

function parseTtl(ttl: string): number {
  const match = ttl.match(/^(\d+)(s|m|h)$/);
  if (!match) return 60;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    default: return 60;
  }
}

export type CacheManager = {
  generateKey: (sql: string, role: string, tableVersion: number) => string;
  getTableVersion: (table: string) => number;
  invalidateTable: (table: string) => void;
  invalidateTags: (tags: string[]) => Promise<void>;
  isExcluded: (table: string) => boolean;
  getTtlSeconds: (override?: string) => number;
  get: (key: string, tableName: string) => Promise<unknown | undefined>;
  set: (key: string, value: unknown, tableName: string, options?: QueryCacheOptions) => Promise<void>;
  onHit?: CacheConfig["onHit"];
  onMiss?: CacheConfig["onMiss"];
};

export function createCacheManager(config: CacheConfig): CacheManager {
  const tableVersions = new Map<string, number>();
  const tagToKeys = new Map<string, Set<string>>();
  const defaultTtl = config.ttl ?? "60s";
  const excludedTables = new Set(config.exclude ?? []);

  return {
    generateKey(sql: string, role: string, tableVersion: number): string {
      // Simple string-based key (no async crypto needed for cache keys)
      return `cfast:${role}:v${tableVersion}:${simpleHash(sql)}`;
    },

    getTableVersion(table: string): number {
      return tableVersions.get(table) ?? 0;
    },

    invalidateTable(table: string): void {
      const current = tableVersions.get(table) ?? 0;
      tableVersions.set(table, current + 1);
      config.onInvalidate?.([table]);
    },

    async invalidateTags(tags: string[]): Promise<void> {
      // For Cache API: we rely on table version bumps
      // For KV: delete keys associated with tags
      if (config.backend === "kv" && config.kv) {
        for (const tag of tags) {
          const keys = tagToKeys.get(tag);
          if (keys) {
            for (const key of keys) {
              await config.kv.delete(key);
            }
            tagToKeys.delete(tag);
          }
        }
      }
    },

    isExcluded(table: string): boolean {
      return excludedTables.has(table);
    },

    getTtlSeconds(override?: string): number {
      return parseTtl(override ?? defaultTtl);
    },

    async get(key: string, tableName: string): Promise<unknown | undefined> {
      if (config.backend === "cache-api") {
        const cache = await caches.open("cfast-db");
        const response = await cache.match(new Request(`https://cfast-cache/${key}`));
        if (response) {
          config.onHit?.(key, tableName);
          return response.json();
        }
        config.onMiss?.(key, tableName);
        return undefined;
      }

      if (config.backend === "kv" && config.kv) {
        const value = await config.kv.get(key, "json");
        if (value !== null) {
          config.onHit?.(key, tableName);
          return value;
        }
        config.onMiss?.(key, tableName);
        return undefined;
      }

      return undefined;
    },

    async set(key: string, value: unknown, tableName: string, options?: QueryCacheOptions): Promise<void> {
      if (options === false) return;
      const ttl = this.getTtlSeconds(
        typeof options === "object" ? options?.ttl : undefined,
      );

      if (config.backend === "cache-api") {
        const cache = await caches.open("cfast-db");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${ttl}`,
        };

        if (typeof options === "object" && options?.staleWhileRevalidate) {
          const swr = parseTtl(options.staleWhileRevalidate);
          headers["Cache-Control"] = `max-age=${ttl}, stale-while-revalidate=${swr}`;
        }

        await cache.put(
          new Request(`https://cfast-cache/${key}`),
          new Response(JSON.stringify(value), { headers }),
        );

        // Track tags
        if (typeof options === "object" && options?.tags) {
          for (const tag of options.tags) {
            if (!tagToKeys.has(tag)) tagToKeys.set(tag, new Set());
            tagToKeys.get(tag)!.add(key);
          }
        }
      }

      if (config.backend === "kv" && config.kv) {
        await config.kv.put(key, JSON.stringify(value), {
          expirationTtl: ttl,
        });

        if (typeof options === "object" && options?.tags) {
          for (const tag of options.tags) {
            if (!tagToKeys.has(tag)) tagToKeys.set(tag, new Set());
            tagToKeys.get(tag)!.add(key);
          }
        }
      }
    },

    onHit: config.onHit,
    onMiss: config.onMiss,
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return (hash >>> 0).toString(36);
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/db/src/cache.ts packages/db/src/__tests__/cache.test.ts
git commit -m "feat(db): cache layer — Cache API + KV backends, table versioning, tag invalidation"
```

---

### Task 8: createDb() factory — wire everything together

**Files:**
- Create: `packages/db/src/create-db.ts`
- Create: `packages/db/src/__tests__/create-db.test.ts`
- Modify: `packages/db/src/index.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { testPermissions, posts, auditLogs, schema, createMockD1 } from "./helpers";
import type { TestUser } from "./helpers";

describe("createDb", () => {
  it("returns a Db instance with all methods", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "editor" },
    });

    expect(typeof db.query).toBe("function");
    expect(typeof db.insert).toBe("function");
    expect(typeof db.update).toBe("function");
    expect(typeof db.delete).toBe("function");
    expect(typeof db.unsafe).toBe("function");
    expect(typeof db.batch).toBe("function");
    expect(db.cache).toBeDefined();
  });

  it("db.query(table) returns a query builder", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "editor" },
    });

    const qb = db.query(posts);
    expect(typeof qb.findMany).toBe("function");
    expect(typeof qb.findFirst).toBe("function");
  });

  it("db.query(table).findMany() returns Operation with permissions", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "editor" },
    });

    const op = db.query(posts).findMany();
    expect(op.permissions).toEqual([{ action: "read", table: posts }]);
  });

  it("db.insert(table).values() returns Operation with permissions", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "user" },
    });

    const op = db.insert(posts).values({ title: "Hello" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
  });

  it("db.unsafe() returns a Db with empty permissions on operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "anonymous" },
    });

    const unsafeDb = db.unsafe();
    const op = unsafeDb.query(posts).findMany();
    expect(op.permissions).toEqual([]);
  });

  it("db.batch() merges permissions from all operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "editor" },
    });

    const op1 = db.insert(posts).values({ title: "Post 1" });
    const op2 = db.insert(auditLogs).values({ action: "create" });

    const batchOp = db.batch([op1, op2]);
    expect(batchOp.permissions).toEqual([
      { action: "create", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("accepts cache: false to disable caching", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: null,
      cache: false,
    });

    expect(typeof db.query).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && pnpm test`
Expected: FAIL

**Step 3: Implement create-db.ts**

```typescript
import type { DrizzleTable, Permissions, PermissionDescriptor } from "@cfast/permissions";
import { createQueryBuilder } from "./query-builder";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "./mutate-builder";
import { createCacheManager, type CacheManager } from "./cache";
import type { Db, DbConfig, Operation } from "./types";

function deduplicateDescriptors(
  descriptors: PermissionDescriptor[],
): PermissionDescriptor[] {
  const seen = new Set<string>();
  const result: PermissionDescriptor[] = [];
  for (const d of descriptors) {
    const key = `${d.action}:${(d.table as any)._?.name ?? "unknown"}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d);
    }
  }
  return result;
}

export function createDb(config: DbConfig): Db {
  const isUnsafe = false;
  return buildDb(config, isUnsafe);
}

function buildDb(config: DbConfig, isUnsafe: boolean): Db {
  const cacheManager: CacheManager | null =
    config.cache === false
      ? null
      : createCacheManager(config.cache ?? { backend: "cache-api" });

  const onMutate = (tableName: string) => {
    cacheManager?.invalidateTable(tableName);
  };

  return {
    query(table: DrizzleTable) {
      return createQueryBuilder({
        d1: config.d1,
        schema: config.schema,
        permissions: config.permissions,
        user: config.user,
        table,
        unsafe: isUnsafe,
        cacheConfig: cacheManager
          ? { exclude: config.cache && typeof config.cache === "object" ? config.cache.exclude : undefined }
          : undefined,
      });
    },

    insert(table: DrizzleTable) {
      return createInsertBuilder({
        d1: config.d1,
        schema: config.schema as any,
        permissions: config.permissions,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      });
    },

    update(table: DrizzleTable) {
      return createUpdateBuilder({
        d1: config.d1,
        schema: config.schema as any,
        permissions: config.permissions,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      });
    },

    delete(table: DrizzleTable) {
      return createDeleteBuilder({
        d1: config.d1,
        schema: config.schema as any,
        permissions: config.permissions,
        user: config.user,
        table,
        unsafe: isUnsafe,
        onMutate,
      });
    },

    unsafe() {
      return buildDb(config, true);
    },

    batch(operations: Operation<unknown>[]): Operation<unknown[]> {
      const allPermissions = deduplicateDescriptors(
        operations.flatMap((op) => op.permissions),
      );

      return {
        permissions: allPermissions,
        async run(params: Record<string, unknown>) {
          // Run all operations, collecting results
          const results: unknown[] = [];
          for (const op of operations) {
            results.push(await op.run(params));
          }
          return results;
        },
      };
    },

    cache: {
      async invalidate(options: { tags?: string[]; tables?: string[] }) {
        if (!cacheManager) return;
        if (options.tags) {
          await cacheManager.invalidateTags(options.tags);
        }
        if (options.tables) {
          for (const table of options.tables) {
            cacheManager.invalidateTable(table);
          }
        }
      },
    },
  };
}
```

**Step 4: Update index.ts with public exports**

```typescript
export { createDb } from "./create-db";
export { compose } from "./compose";
export type {
  Operation,
  Db,
  DbConfig,
  CacheConfig,
  QueryCacheOptions,
  FindManyOptions,
  FindFirstOptions,
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder,
} from "./types";
```

**Step 5: Run test to verify it passes**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 6: Run build to verify it compiles**

Run: `cd packages/db && pnpm build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add packages/db/src/
git commit -m "feat(db): createDb() factory wiring all components together"
```

---

### Task 9: Integration tests — permission enforcement end-to-end

**Files:**
- Create: `packages/db/src/__tests__/integration.test.ts`

**Step 1: Write integration tests**

These test the full flow: createDb → build operation → check .permissions → .run() permission enforcement.

```typescript
import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { compose } from "../compose";
import { testPermissions, posts, auditLogs, schema, createMockD1 } from "./helpers";

describe("integration: permission enforcement", () => {
  it("anonymous cannot create posts", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "anon", role: "anonymous" },
      cache: false,
    });

    const op = db.insert(posts).values({ title: "Hack" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
    await expect(op.run({})).rejects.toThrow("ForbiddenError");
  });

  it("user can create posts", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "user" },
      cache: false,
    });

    const op = db.insert(posts).values({ title: "Hello" });
    // Should not throw (D1 mock will handle the actual SQL)
    await expect(op.run({})).resolves.not.toThrow();
  });

  it("unsafe bypasses all permission checks", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "anon", role: "anonymous" },
      cache: false,
    });

    const op = db.unsafe().insert(posts).values({ title: "System" });
    expect(op.permissions).toEqual([]);
    await expect(op.run({})).resolves.not.toThrow();
  });

  it("compose merges permissions and allows inspection", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "editor-1", role: "editor" },
      cache: false,
    });

    const updateOp = db.update(posts).set({ published: true }).where(undefined);
    const auditOp = db.insert(auditLogs).values({ action: "publish" });

    const workflow = compose([updateOp, auditOp], async (doUpdate, doAudit) => {
      await doUpdate({});
      await doAudit({});
      return { done: true };
    });

    expect(workflow.permissions).toEqual([
      { action: "update", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("batch merges permissions from all operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "editor-1", role: "editor" },
      cache: false,
    });

    const op1 = db.insert(posts).values({ title: "Post 1" });
    const op2 = db.insert(auditLogs).values({ action: "create" });

    const batchOp = db.batch([op1, op2]);
    expect(batchOp.permissions).toHaveLength(2);
  });
});
```

**Step 2: Run tests**

Run: `cd packages/db && pnpm test`
Expected: PASS

**Step 3: Run full project typecheck**

Run: `pnpm typecheck`
Expected: PASS (or at least packages/db passes)

**Step 4: Commit**

```bash
git add packages/db/src/__tests__/integration.test.ts
git commit -m "test(db): integration tests — permission enforcement end-to-end"
```

---

### Task 10: Final verification — build, typecheck, lint

**Step 1:** Run `cd packages/db && pnpm build` — must succeed
**Step 2:** Run `cd packages/db && pnpm typecheck` — must succeed
**Step 3:** Run `cd packages/db && pnpm test` — all tests pass
**Step 4:** Run `pnpm build` from root — full monorepo build succeeds

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore(db): fix build/typecheck issues"
```
