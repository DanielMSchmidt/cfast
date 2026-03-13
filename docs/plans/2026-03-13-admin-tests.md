# @cfast/admin Comprehensive Unit Tests

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive unit tests for `action.ts`, `loader.ts`, and `create-admin.ts` — the untested core of `@cfast/admin`.

**Architecture:** Mock the `Db` interface (chainable builders returning promises) and `AdminAuthConfig` at the function boundary. Tests call exported functions directly with mock deps — no real D1 or Drizzle execution. Shared helpers in `__tests__/helpers.ts`.

**Tech Stack:** Vitest, drizzle-orm (schema definitions only), FormData (Web API)

---

### Task 1: Create shared test helpers

**Files:**
- Create: `packages/admin/src/__tests__/helpers.ts`

**Step 1: Write the helpers file**

```typescript
import { vi } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AdminAuthConfig, AdminUser, AdminTableMeta } from "../types.js";
import type { Db } from "@cfast/db";
import { introspectSchema } from "../introspect.js";

// --- Test schema ---

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  published: integer("published", { mode: "boolean" })
    .notNull()
    .default(false),
  views: integer("views").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
});

export const testSchema = { users, posts, session };

// --- Mock admin user ---

export function mockAdminUser(overrides?: Partial<AdminUser>): AdminUser {
  return {
    id: "admin-1",
    email: "admin@test.com",
    name: "Admin User",
    avatarUrl: null,
    roles: ["admin"],
    ...overrides,
  };
}

// --- Mock auth config ---

export function mockAuthConfig(
  overrides?: Partial<AdminAuthConfig>,
): AdminAuthConfig {
  const user = mockAdminUser();
  return {
    requireUser: vi.fn().mockResolvedValue({ user, grants: [] }),
    hasRole: vi.fn().mockReturnValue(true),
    getRoles: vi.fn().mockResolvedValue(["user"]),
    setRole: vi.fn().mockResolvedValue(undefined),
    removeRole: vi.fn().mockResolvedValue(undefined),
    setRoles: vi.fn().mockResolvedValue(undefined),
    impersonate: vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: "/" } }),
    ),
    stopImpersonation: vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: "/" } }),
    ),
    ...overrides,
  };
}

// --- Mock Db ---

/**
 * Create a mock Db where query/insert/update/delete return chainable builders.
 * Pass `data` to configure what findMany/findFirst return per table name.
 */
export function mockDb(data: Record<string, Record<string, unknown>[]> = {}): Db {
  function makeQueryBuilder(tableName: string) {
    const rows = data[tableName] ?? [];
    return {
      findMany: vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue(rows),
      }),
      findFirst: vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue(rows[0] ?? undefined),
      }),
      paginate: vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue({ items: rows, cursor: null }),
      }),
    };
  }

  const insertRun = vi.fn().mockResolvedValue(undefined);
  const updateRun = vi.fn().mockResolvedValue(undefined);
  const deleteRun = vi.fn().mockResolvedValue(undefined);

  const db: Db = {
    query: vi.fn().mockImplementation((table) => {
      const { getTableName } = require("drizzle-orm");
      const name = getTableName(table);
      return makeQueryBuilder(name);
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        permissions: [],
        run: insertRun,
        returning: vi.fn().mockReturnValue({
          permissions: [],
          run: vi.fn().mockResolvedValue({}),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          permissions: [],
          run: updateRun,
          returning: vi.fn().mockReturnValue({
            permissions: [],
            run: vi.fn().mockResolvedValue({}),
          }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        permissions: [],
        run: deleteRun,
        returning: vi.fn().mockReturnValue({
          permissions: [],
          run: vi.fn().mockResolvedValue({}),
        }),
      }),
    }),
    unsafe: vi.fn(),
    batch: vi.fn().mockReturnValue({
      permissions: [],
      run: vi.fn().mockResolvedValue([]),
    }),
    cache: {
      invalidate: vi.fn().mockResolvedValue(undefined),
    },
  };

  // unsafe() returns itself (admin uses db.unsafe() for user queries)
  (db.unsafe as ReturnType<typeof vi.fn>).mockReturnValue(db);

  return db;
}

/**
 * Create a mock Db that rejects on insert/update/delete (simulating DB errors).
 */
export function mockDbWithError(errorMessage: string): Db {
  const db = mockDb();

  // Override insert to throw
  (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
    values: vi.fn().mockReturnValue({
      permissions: [],
      run: vi.fn().mockRejectedValue(new Error(errorMessage)),
      returning: vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockRejectedValue(new Error(errorMessage)),
      }),
    }),
  });

  // Override update to throw
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockRejectedValue(new Error(errorMessage)),
        returning: vi.fn().mockReturnValue({
          permissions: [],
          run: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      }),
    }),
  });

  // Override delete to throw
  (db.delete as ReturnType<typeof vi.fn>).mockReturnValue({
    where: vi.fn().mockReturnValue({
      permissions: [],
      run: vi.fn().mockRejectedValue(new Error(errorMessage)),
      returning: vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockRejectedValue(new Error(errorMessage)),
      }),
    }),
  });

  return db;
}

// --- Helpers ---

/** Build table metas from the test schema (reuses introspect). */
export function testTableMetas(
  overrides?: Record<string, import("../types.js").TableOverrides>,
): AdminTableMeta[] {
  return introspectSchema(testSchema, overrides);
}

/** Create a FormData with the given entries. */
export function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

/** Create a mock Request with the given URL. */
export function mockRequest(
  urlPath: string,
  options?: RequestInit,
): Request {
  return new Request(new URL(urlPath, "http://localhost"), options);
}
```

**Step 2: Verify helpers compile**

Run: `cd /Users/danielschmidt/fun/cfast/.claude/worktrees/imperative-rolling-quasar && pnpm --filter @cfast/admin exec tsc --noEmit`
Expected: No type errors (or only pre-existing ones)

**Step 3: Commit**

```bash
git add packages/admin/src/__tests__/helpers.ts
git commit -m "test(admin): add shared test helpers for mock Db, auth, and schema"
```

---

### Task 2: Write action tests — CRUD operations

**Files:**
- Create: `packages/admin/src/__tests__/action.test.ts`
- Reference: `packages/admin/src/action.ts`

**Step 1: Write the test file with CRUD tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAdminAction } from "../action.js";
import {
  testSchema,
  testTableMetas,
  mockAuthConfig,
  mockAdminUser,
  mockDb,
  mockDbWithError,
  formData,
} from "./helpers.js";
import type { AdminConfig, AdminActionResult } from "../types.js";

function makeConfig(overrides?: Partial<AdminConfig>): AdminConfig {
  return {
    db: vi.fn().mockReturnValue(mockDb()),
    auth: mockAuthConfig(),
    schema: testSchema,
    ...overrides,
  };
}

async function callAction(
  config: AdminConfig,
  fd: FormData,
): Promise<AdminActionResult | Response> {
  const tableMetas = testTableMetas();
  const action = createAdminAction(config, tableMetas);
  const body = new URLSearchParams();
  fd.forEach((value, key) => body.set(key, String(value)));
  const request = new Request("http://localhost/admin", {
    method: "POST",
    body: fd,
  });
  return action(request);
}

describe("createAdminAction", () => {
  describe("auth guard", () => {
    it("throws 403 when user lacks required role", async () => {
      const auth = mockAuthConfig({
        hasRole: vi.fn().mockReturnValue(false),
      });
      const config = makeConfig({ auth });

      try {
        await callAction(config, formData({ _action: "create", _table: "posts" }));
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        expect((err as Response).status).toBe(403);
      }
    });

    it("uses custom requiredRole when configured", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth, requiredRole: "super-admin" });
      await callAction(config, formData({ _action: "create", _table: "posts", title: "Hi" }));

      expect(auth.hasRole).toHaveBeenCalledWith(
        expect.objectContaining({ id: "admin-1" }),
        "super-admin",
      );
    });
  });

  describe("missing _action", () => {
    it("returns error when _action is missing", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({}));
      expect(result).toEqual({ error: "Missing _action field." });
    });

    it("returns error for unknown action", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({ _action: "fly" }));
      expect(result).toEqual({ error: 'Unknown action: "fly".' });
    });
  });

  describe("create action", () => {
    it("returns error when _table is missing", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({ _action: "create" }));
      expect(result).toEqual({ error: "Missing _table field." });
    });

    it("returns error when table not found", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "create", _table: "nonexistent" }),
      );
      expect(result).toEqual({ error: 'Table "nonexistent" not found.' });
    });

    it("inserts a record and returns success", async () => {
      const db = mockDb();
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const result = await callAction(
        config,
        formData({
          _action: "create",
          _table: "posts",
          title: "Hello World",
          content: "Body text",
          author_id: "user-1",
        }),
      );
      expect(result).toHaveProperty("success");
      expect(db.insert).toHaveBeenCalled();
    });

    it("skips primary key columns in form values", async () => {
      const db = mockDb();
      const insertValues = vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn(),
      });
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: insertValues });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

      await callAction(
        config,
        formData({
          _action: "create",
          _table: "posts",
          id: "should-be-ignored",
          title: "Test",
          author_id: "u1",
        }),
      );

      const passedValues = insertValues.mock.calls[0][0];
      expect(passedValues).not.toHaveProperty("id");
      expect(passedValues).toHaveProperty("title", "Test");
    });

    it("coerces boolean fields", async () => {
      const db = mockDb();
      const insertValues = vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn(),
      });
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: insertValues });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

      await callAction(
        config,
        formData({
          _action: "create",
          _table: "posts",
          title: "Test",
          author_id: "u1",
          published: "true",
        }),
      );

      const passedValues = insertValues.mock.calls[0][0];
      expect(passedValues.published).toBe(true);
    });

    it("coerces number fields", async () => {
      const db = mockDb();
      const insertValues = vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn(),
      });
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: insertValues });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

      await callAction(
        config,
        formData({
          _action: "create",
          _table: "posts",
          title: "Test",
          author_id: "u1",
          views: "42",
        }),
      );

      const passedValues = insertValues.mock.calls[0][0];
      expect(passedValues.views).toBe(42);
    });

    it("sets null for empty optional fields", async () => {
      const db = mockDb();
      const insertValues = vi.fn().mockReturnValue({
        permissions: [],
        run: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn(),
      });
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: insertValues });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });

      await callAction(
        config,
        formData({
          _action: "create",
          _table: "posts",
          title: "Test",
          author_id: "u1",
          content: "",
        }),
      );

      const passedValues = insertValues.mock.calls[0][0];
      // content has a default so it's not required — empty string → null
      expect(passedValues.content).toBe(null);
    });

    it("returns error on db failure", async () => {
      const db = mockDbWithError("UNIQUE constraint failed");
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const result = await callAction(
        config,
        formData({
          _action: "create",
          _table: "posts",
          title: "Test",
          author_id: "u1",
        }),
      );
      expect(result).toEqual({ error: "UNIQUE constraint failed" });
    });
  });

  describe("update action", () => {
    it("returns error when _table is missing", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({ _action: "update", _id: "1" }));
      expect(result).toEqual({ error: "Missing _table field." });
    });

    it("returns error when _id is missing", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({ _action: "update", _table: "posts" }));
      expect(result).toEqual({ error: "Missing _id field." });
    });

    it("returns error when table not found", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "update", _table: "nope", _id: "1" }),
      );
      expect(result).toEqual({ error: 'Table "nope" not found.' });
    });

    it("updates a record and returns success", async () => {
      const db = mockDb();
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const result = await callAction(
        config,
        formData({
          _action: "update",
          _table: "posts",
          _id: "post-1",
          title: "Updated Title",
        }),
      );
      expect(result).toHaveProperty("success");
      expect(db.update).toHaveBeenCalled();
    });

    it("returns error on db failure", async () => {
      const db = mockDbWithError("disk I/O error");
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const result = await callAction(
        config,
        formData({
          _action: "update",
          _table: "posts",
          _id: "post-1",
          title: "Updated",
        }),
      );
      expect(result).toEqual({ error: "disk I/O error" });
    });
  });

  describe("delete action", () => {
    it("returns error when _table is missing", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({ _action: "delete", _id: "1" }));
      expect(result).toEqual({ error: "Missing _table field." });
    });

    it("returns error when _id is missing", async () => {
      const config = makeConfig();
      const result = await callAction(config, formData({ _action: "delete", _table: "posts" }));
      expect(result).toEqual({ error: "Missing _id field." });
    });

    it("deletes a record and returns success", async () => {
      const db = mockDb();
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const result = await callAction(
        config,
        formData({
          _action: "delete",
          _table: "posts",
          _id: "post-1",
        }),
      );
      expect(result).toHaveProperty("success");
      expect(db.delete).toHaveBeenCalled();
    });

    it("returns error on db failure", async () => {
      const db = mockDbWithError("foreign key constraint");
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const result = await callAction(
        config,
        formData({
          _action: "delete",
          _table: "posts",
          _id: "post-1",
        }),
      );
      expect(result).toEqual({ error: "foreign key constraint" });
    });
  });

  describe("setRole action", () => {
    it("returns error when _id is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "setRole", role: "editor" }),
      );
      expect(result).toEqual({ error: "Missing _id field." });
    });

    it("returns error when role is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "setRole", _id: "user-1" }),
      );
      expect(result).toEqual({ error: "Missing role field." });
    });

    it("sets role and returns success", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth });
      const result = await callAction(
        config,
        formData({ _action: "setRole", _id: "user-1", role: "editor" }),
      );
      expect(result).toHaveProperty("success");
      expect(auth.setRole).toHaveBeenCalledWith("user-1", "editor");
    });

    it("returns error when auth.setRole throws", async () => {
      const auth = mockAuthConfig({
        setRole: vi.fn().mockRejectedValue(new Error("role already assigned")),
      });
      const config = makeConfig({ auth });
      const result = await callAction(
        config,
        formData({ _action: "setRole", _id: "user-1", role: "admin" }),
      );
      expect(result).toEqual({ error: "role already assigned" });
    });
  });

  describe("removeRole action", () => {
    it("returns error when _id is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "removeRole", role: "editor" }),
      );
      expect(result).toEqual({ error: "Missing _id field." });
    });

    it("returns error when role is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "removeRole", _id: "user-1" }),
      );
      expect(result).toEqual({ error: "Missing role field." });
    });

    it("removes role and returns success", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth });
      const result = await callAction(
        config,
        formData({ _action: "removeRole", _id: "user-1", role: "editor" }),
      );
      expect(result).toHaveProperty("success");
      expect(auth.removeRole).toHaveBeenCalledWith("user-1", "editor");
    });
  });

  describe("impersonate action", () => {
    it("calls auth.impersonate with admin and target ids", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth });
      const result = await callAction(
        config,
        formData({ _action: "impersonate", _id: "target-user" }),
      );
      expect(result).toBeInstanceOf(Response);
      expect(auth.impersonate).toHaveBeenCalledWith(
        "admin-1",
        "target-user",
        expect.any(Request),
      );
    });

    it("throws 400 when _id is missing", async () => {
      const config = makeConfig();
      try {
        await callAction(config, formData({ _action: "impersonate" }));
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        expect((err as Response).status).toBe(400);
      }
    });
  });

  describe("stopImpersonation action", () => {
    it("calls auth.stopImpersonation", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth });
      const result = await callAction(
        config,
        formData({ _action: "stopImpersonation" }),
      );
      expect(result).toBeInstanceOf(Response);
      expect(auth.stopImpersonation).toHaveBeenCalled();
    });
  });

  describe("custom action", () => {
    it("returns error when _table is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "custom", _actionName: "archive", _id: "1" }),
      );
      expect(result).toEqual({ error: "Missing _table field." });
    });

    it("returns error when _actionName is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "custom", _table: "posts", _id: "1" }),
      );
      expect(result).toEqual({ error: "Missing _actionName field." });
    });

    it("returns error when _id is missing", async () => {
      const config = makeConfig();
      const result = await callAction(
        config,
        formData({ _action: "custom", _table: "posts", _actionName: "archive" }),
      );
      expect(result).toEqual({ error: "Missing _id field." });
    });

    it("returns error when table has no custom actions", async () => {
      const config = makeConfig();
      const tableMetas = testTableMetas();
      const action = createAdminAction(config, tableMetas);
      const request = new Request("http://localhost/admin", {
        method: "POST",
        body: formData({ _action: "custom", _table: "posts", _actionName: "archive", _id: "1" }),
      });
      const result = await action(request);
      expect(result).toEqual({
        error: 'No custom actions defined for table "posts".',
      });
    });

    it("executes custom row action and returns success", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const tableMetas = testTableMetas({
        posts: {
          actions: {
            row: [{ label: "archive", action: handler }],
          },
        },
      });
      const config = makeConfig();
      const action = createAdminAction(config, tableMetas);
      const fd = formData({
        _action: "custom",
        _table: "posts",
        _actionName: "archive",
        _id: "post-1",
      });
      const request = new Request("http://localhost/admin", {
        method: "POST",
        body: fd,
      });
      const result = await action(request);
      expect(result).toHaveProperty("success");
      expect(handler).toHaveBeenCalledWith("post-1", expect.any(FormData));
    });

    it("returns error when custom action not found", async () => {
      const tableMetas = testTableMetas({
        posts: {
          actions: {
            row: [{ label: "archive", action: vi.fn() }],
          },
        },
      });
      const config = makeConfig();
      const action = createAdminAction(config, tableMetas);
      const request = new Request("http://localhost/admin", {
        method: "POST",
        body: formData({
          _action: "custom",
          _table: "posts",
          _actionName: "nonexistent",
          _id: "1",
        }),
      });
      const result = await action(request);
      expect(result).toEqual({
        error: 'Action "nonexistent" not found for table "posts".',
      });
    });

    it("returns error when custom action throws", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("action failed"));
      const tableMetas = testTableMetas({
        posts: {
          actions: {
            row: [{ label: "archive", action: handler }],
          },
        },
      });
      const config = makeConfig();
      const action = createAdminAction(config, tableMetas);
      const request = new Request("http://localhost/admin", {
        method: "POST",
        body: formData({
          _action: "custom",
          _table: "posts",
          _actionName: "archive",
          _id: "post-1",
        }),
      });
      const result = await action(request);
      expect(result).toEqual({ error: "action failed" });
    });
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/danielschmidt/fun/cfast/.claude/worktrees/imperative-rolling-quasar && pnpm --filter @cfast/admin test`
Expected: All action tests pass

**Step 3: Commit**

```bash
git add packages/admin/src/__tests__/action.test.ts
git commit -m "test(admin): add comprehensive action tests — CRUD, roles, impersonation, custom actions"
```

---

### Task 3: Write loader tests

**Files:**
- Create: `packages/admin/src/__tests__/loader.test.ts`
- Reference: `packages/admin/src/loader.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, vi } from "vitest";
import { createAdminLoader } from "../loader.js";
import {
  testSchema,
  testTableMetas,
  mockAuthConfig,
  mockAdminUser,
  mockDb,
} from "./helpers.js";
import type { AdminConfig, AdminLoaderData } from "../types.js";

function makeConfig(overrides?: Partial<AdminConfig>): AdminConfig {
  return {
    db: vi.fn().mockReturnValue(mockDb()),
    auth: mockAuthConfig(),
    schema: testSchema,
    ...overrides,
  };
}

async function callLoader(
  config: AdminConfig,
  urlPath: string,
): Promise<AdminLoaderData> {
  const tableMetas = testTableMetas();
  const loader = createAdminLoader(config, tableMetas);
  const request = new Request(new URL(urlPath, "http://localhost"));
  return loader(request);
}

describe("createAdminLoader", () => {
  describe("auth guard", () => {
    it("throws redirect when user lacks required role", async () => {
      const auth = mockAuthConfig({
        hasRole: vi.fn().mockReturnValue(false),
      });
      const config = makeConfig({ auth });

      try {
        await callLoader(config, "/admin");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Response);
        const res = err as Response;
        expect(res.status).toBe(302);
        expect(res.headers.get("Location")).toBe("/");
      }
    });

    it("uses custom requiredRole", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth, requiredRole: "super-admin" });
      await callLoader(config, "/admin");

      expect(auth.hasRole).toHaveBeenCalledWith(
        expect.objectContaining({ id: "admin-1" }),
        "super-admin",
      );
    });

    it("calls auth.requireUser with the request", async () => {
      const auth = mockAuthConfig();
      const config = makeConfig({ auth });
      await callLoader(config, "/admin");
      expect(auth.requireUser).toHaveBeenCalledWith(expect.any(Request));
    });
  });

  describe("dashboard view", () => {
    it("returns dashboard view when no params", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin");
      expect(data.view).toBe("dashboard");
    });

    it("returns dashboard for explicit ?view=dashboard", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=dashboard");
      expect(data.view).toBe("dashboard");
    });

    it("includes user info in dashboard", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin");
      expect(data.user).toMatchObject({ id: "admin-1", email: "admin@test.com" });
    });

    it("includes tables list (excluding users table)", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin");
      expect(data.view).toBe("dashboard");
      if (data.view !== "dashboard") return;
      // users table is filtered from sidebar list
      const tableNames = data.tables.map((t) => t.name);
      expect(tableNames).not.toContain("users");
      expect(tableNames).toContain("posts");
    });

    it("includes stats for each table", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin");
      if (data.view !== "dashboard") return;
      expect(data.stats.length).toBeGreaterThan(0);
    });

    it("includes recent items from first table", async () => {
      const db = mockDb({ posts: [{ id: "p1", title: "Hello" }] });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin");
      if (data.view !== "dashboard") return;
      expect(data.recentItems.length).toBeGreaterThan(0);
    });
  });

  describe("dashboard with configured widgets", () => {
    it("uses configured count widgets", async () => {
      const db = mockDb({
        posts: [{ id: "1" }, { id: "2" }],
      });
      const config = makeConfig({
        db: vi.fn().mockReturnValue(db),
        dashboard: {
          widgets: [{ type: "count", table: "posts", label: "Total Posts" }],
        },
      });
      const data = await callLoader(config, "/admin");
      if (data.view !== "dashboard") return;
      expect(data.stats).toEqual([{ label: "Total Posts", value: 2 }]);
    });

    it("uses configured recent widgets", async () => {
      const db = mockDb({
        posts: [{ id: "p1", title: "First" }],
      });
      const config = makeConfig({
        db: vi.fn().mockReturnValue(db),
        dashboard: {
          widgets: [
            { type: "recent", table: "posts", label: "Recent Posts", limit: 3 },
          ],
        },
      });
      const data = await callLoader(config, "/admin");
      if (data.view !== "dashboard") return;
      expect(data.recentItems).toHaveLength(1);
      expect(data.recentItems[0].label).toBe("Recent Posts");
    });

    it("skips widgets for unknown tables", async () => {
      const config = makeConfig({
        dashboard: {
          widgets: [{ type: "count", table: "nonexistent", label: "X" }],
        },
      });
      const data = await callLoader(config, "/admin");
      if (data.view !== "dashboard") return;
      expect(data.stats).toEqual([]);
    });
  });

  describe("list view", () => {
    it("returns list view for table param", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts");
      expect(data.view).toBe("list");
      if (data.view !== "list") return;
      expect(data.tableName).toBe("posts");
      expect(data.tableLabel).toBe("Posts");
    });

    it("returns error for unknown table", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=nonexistent");
      expect(data.view).toBe("error");
      if (data.view !== "error") return;
      expect(data.message).toContain("nonexistent");
    });

    it("includes pagination data", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts&page=2");
      if (data.view !== "list") return;
      expect(data.page).toBe(2);
      expect(data.totalPages).toBeGreaterThanOrEqual(1);
    });

    it("includes sort data", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts&sort=title&dir=asc");
      if (data.view !== "list") return;
      expect(data.sort).toEqual({ column: "title", direction: "asc" });
    });

    it("uses default sort when no sort param", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts");
      if (data.view !== "list") return;
      expect(data.sort.column).toBe("id"); // default PK desc
      expect(data.sort.direction).toBe("desc");
    });

    it("passes search to response", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts&search=hello");
      if (data.view !== "list") return;
      expect(data.search).toBe("hello");
    });

    it("includes column metadata", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts");
      if (data.view !== "list") return;
      expect(data.columns.length).toBeGreaterThan(0);
      expect(data.columns.find((c) => c.name === "title")).toBeDefined();
    });

    it("includes items from db query", async () => {
      const db = mockDb({
        posts: [
          { id: "p1", title: "First" },
          { id: "p2", title: "Second" },
        ],
      });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=posts");
      if (data.view !== "list") return;
      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
    });
  });

  describe("detail view", () => {
    it("returns detail view for table + id", async () => {
      const db = mockDb({
        posts: [{ id: "p1", title: "Found Post" }],
      });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=posts&id=p1");
      expect(data.view).toBe("detail");
      if (data.view !== "detail") return;
      expect(data.tableName).toBe("posts");
      expect(data.item).toMatchObject({ id: "p1", title: "Found Post" });
    });

    it("returns error when record not found", async () => {
      const db = mockDb({ posts: [] });
      // Override findFirst to return undefined
      (db.query as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        findMany: vi.fn().mockReturnValue({ permissions: [], run: vi.fn().mockResolvedValue([]) }),
        findFirst: vi.fn().mockReturnValue({ permissions: [], run: vi.fn().mockResolvedValue(undefined) }),
      }));
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=posts&id=missing");
      expect(data.view).toBe("error");
      if (data.view !== "error") return;
      expect(data.message).toContain("missing");
    });

    it("returns error for unknown table", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=nope&id=1");
      expect(data.view).toBe("error");
    });
  });

  describe("create view", () => {
    it("returns create view with columns metadata", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=posts&mode=create");
      expect(data.view).toBe("create");
      if (data.view !== "create") return;
      expect(data.tableName).toBe("posts");
      expect(data.columns.length).toBeGreaterThan(0);
    });

    it("returns error for unknown table", async () => {
      const config = makeConfig();
      const data = await callLoader(config, "/admin?view=nope&mode=create");
      expect(data.view).toBe("error");
    });
  });

  describe("edit view", () => {
    it("returns edit view with record and columns", async () => {
      const db = mockDb({
        posts: [{ id: "p1", title: "Edit Me" }],
      });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=posts&id=p1&mode=edit");
      expect(data.view).toBe("edit");
      if (data.view !== "edit") return;
      expect(data.item).toMatchObject({ id: "p1", title: "Edit Me" });
      expect(data.columns.length).toBeGreaterThan(0);
    });

    it("returns error when record not found", async () => {
      const db = mockDb();
      (db.query as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        findMany: vi.fn().mockReturnValue({ permissions: [], run: vi.fn().mockResolvedValue([]) }),
        findFirst: vi.fn().mockReturnValue({ permissions: [], run: vi.fn().mockResolvedValue(undefined) }),
      }));
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=posts&id=nope&mode=edit");
      expect(data.view).toBe("error");
    });
  });

  describe("user list view", () => {
    it("returns user list view", async () => {
      const db = mockDb({
        users: [
          { id: "u1", email: "a@test.com", name: "Alice", avatar_url: null, created_at: "2026-01-01" },
        ],
      });
      const auth = mockAuthConfig({
        getRoles: vi.fn().mockResolvedValue(["user"]),
      });
      const config = makeConfig({ auth, db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=_users");
      expect(data.view).toBe("users");
      if (data.view !== "users") return;
      expect(data.items).toHaveLength(1);
      expect(data.items[0].email).toBe("a@test.com");
      expect(data.items[0].roles).toEqual(["user"]);
    });

    it("includes assignableRoles from config", async () => {
      const db = mockDb({ users: [] });
      const config = makeConfig({
        db: vi.fn().mockReturnValue(db),
        users: { assignableRoles: ["admin", "editor"] },
      });
      const data = await callLoader(config, "/admin?view=_users");
      if (data.view !== "users") return;
      expect(data.assignableRoles).toEqual(["admin", "editor"]);
    });

    it("defaults assignableRoles to empty array", async () => {
      const db = mockDb({ users: [] });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=_users");
      if (data.view !== "users") return;
      expect(data.assignableRoles).toEqual([]);
    });

    it("passes search and page to response", async () => {
      const db = mockDb({ users: [] });
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=_users&page=3&search=bob");
      if (data.view !== "users") return;
      expect(data.page).toBe(3);
      expect(data.search).toBe("bob");
    });

    it("returns error when users table not in schema", async () => {
      const config = makeConfig({
        schema: { posts: testSchema.posts },
      });
      const data = await callLoader(config, "/admin?view=_users");
      expect(data.view).toBe("error");
      if (data.view !== "error") return;
      expect(data.message).toContain("Users table not found");
    });
  });

  describe("user detail view", () => {
    it("returns user detail with roles", async () => {
      const db = mockDb({
        users: [{ id: "u1", email: "a@test.com", name: "Alice", avatar_url: null }],
      });
      const auth = mockAuthConfig({
        getRoles: vi.fn().mockResolvedValue(["admin", "editor"]),
      });
      const config = makeConfig({ auth, db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=_users&id=u1");
      expect(data.view).toBe("user-detail");
      if (data.view !== "user-detail") return;
      expect(data.targetUser.roles).toEqual(["admin", "editor"]);
    });

    it("returns error when user not found", async () => {
      const db = mockDb();
      (db.query as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        findMany: vi.fn().mockReturnValue({ permissions: [], run: vi.fn().mockResolvedValue([]) }),
        findFirst: vi.fn().mockReturnValue({ permissions: [], run: vi.fn().mockResolvedValue(undefined) }),
      }));
      const config = makeConfig({ db: vi.fn().mockReturnValue(db) });
      const data = await callLoader(config, "/admin?view=_users&id=missing");
      expect(data.view).toBe("error");
      if (data.view !== "error") return;
      expect(data.message).toContain("missing");
    });

    it("returns error when users table not in schema", async () => {
      const config = makeConfig({
        schema: { posts: testSchema.posts },
      });
      const data = await callLoader(config, "/admin?view=_users&id=u1");
      expect(data.view).toBe("error");
    });

    it("includes assignableRoles", async () => {
      const db = mockDb({
        users: [{ id: "u1", email: "a@test.com", name: "Alice", avatar_url: null }],
      });
      const config = makeConfig({
        db: vi.fn().mockReturnValue(db),
        users: { assignableRoles: ["editor", "viewer"] },
      });
      const data = await callLoader(config, "/admin?view=_users&id=u1");
      if (data.view !== "user-detail") return;
      expect(data.assignableRoles).toEqual(["editor", "viewer"]);
    });
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/danielschmidt/fun/cfast/.claude/worktrees/imperative-rolling-quasar && pnpm --filter @cfast/admin test`
Expected: All loader tests pass

**Step 3: Commit**

```bash
git add packages/admin/src/__tests__/loader.test.ts
git commit -m "test(admin): add comprehensive loader tests — views, auth guard, pagination, users"
```

---

### Task 4: Write create-admin factory tests

**Files:**
- Create: `packages/admin/src/__tests__/create-admin.test.ts`
- Reference: `packages/admin/src/create-admin.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, vi } from "vitest";
import { createAdmin } from "../create-admin.js";
import { testSchema, mockAuthConfig, mockDb } from "./helpers.js";
import type { AdminConfig } from "../types.js";

function makeConfig(overrides?: Partial<AdminConfig>): AdminConfig {
  return {
    db: vi.fn().mockReturnValue(mockDb()),
    auth: mockAuthConfig(),
    schema: testSchema,
    ...overrides,
  };
}

describe("createAdmin", () => {
  it("returns loader, action, and Component", () => {
    const config = makeConfig();
    const admin = createAdmin(config);

    expect(admin).toHaveProperty("loader");
    expect(admin).toHaveProperty("action");
    expect(admin).toHaveProperty("Component");
    expect(typeof admin.loader).toBe("function");
    expect(typeof admin.action).toBe("function");
    expect(typeof admin.Component).toBe("function");
  });

  it("filters auto-excluded auth tables from introspection", async () => {
    const config = makeConfig();
    const admin = createAdmin(config);
    // session table is in testSchema but should be auto-excluded
    // Verify by loading dashboard — tables list should not include "session"
    const request = new Request("http://localhost/admin");
    const data = await admin.loader(request);
    if (data.view !== "dashboard") return;
    const tableNames = data.tables.map((t) => t.name);
    expect(tableNames).not.toContain("session");
  });

  it("applies table overrides during introspection", async () => {
    const config = makeConfig({
      tables: { posts: { label: "Articles" } },
    });
    const admin = createAdmin(config);
    const request = new Request("http://localhost/admin?view=posts");
    const data = await admin.loader(request);
    if (data.view !== "list") return;
    expect(data.tableLabel).toBe("Articles");
  });

  it("loader and action share the same auth config", async () => {
    const auth = mockAuthConfig();
    const config = makeConfig({ auth });
    const admin = createAdmin(config);

    // Call both
    await admin.loader(new Request("http://localhost/admin"));
    await admin.action(
      new Request("http://localhost/admin", {
        method: "POST",
        body: new URLSearchParams({ _action: "create", _table: "posts", title: "Hi" }),
      }),
    );

    // auth.requireUser should have been called twice
    expect(auth.requireUser).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/danielschmidt/fun/cfast/.claude/worktrees/imperative-rolling-quasar && pnpm --filter @cfast/admin test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/admin/src/__tests__/create-admin.test.ts
git commit -m "test(admin): add create-admin factory tests"
```

---

### Task 5: Final verification

**Step 1: Run full admin test suite**

Run: `cd /Users/danielschmidt/fun/cfast/.claude/worktrees/imperative-rolling-quasar && pnpm --filter @cfast/admin test`
Expected: All tests pass (existing introspect + utils + new action + loader + create-admin)

**Step 2: Run typecheck**

Run: `cd /Users/danielschmidt/fun/cfast/.claude/worktrees/imperative-rolling-quasar && pnpm --filter @cfast/admin typecheck`
Expected: No type errors

**Step 3: Commit any fixes, then final commit if needed**
