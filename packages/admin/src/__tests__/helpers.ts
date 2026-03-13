import { vi } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Db } from "@cfast/db";
import { introspectSchema } from "../introspect.js";
import type {
  AdminUser,
  AdminAuthConfig,
  AdminTableMeta,
  TableOverrides,
} from "../types.js";

// ---------------------------------------------------------------------------
// 1. Test schema
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
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
  views: integer("views").default(0),
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

// ---------------------------------------------------------------------------
// 2. mockAdminUser
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 3. mockAuthConfig
// ---------------------------------------------------------------------------

export function mockAuthConfig(
  overrides?: Partial<AdminAuthConfig>,
): AdminAuthConfig {
  return {
    requireUser: vi.fn().mockResolvedValue({
      user: mockAdminUser(),
      grants: [],
    }),
    hasRole: vi.fn().mockReturnValue(true),
    getRoles: vi.fn().mockResolvedValue(["user"]),
    setRole: vi.fn().mockResolvedValue(undefined),
    removeRole: vi.fn().mockResolvedValue(undefined),
    setRoles: vi.fn().mockResolvedValue(undefined),
    impersonate: vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302 })),
    stopImpersonation: vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302 })),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 4. mockDb
// ---------------------------------------------------------------------------

export function mockDb(
  data?: Record<string, Record<string, unknown>[]>,
): Db {
  const tableData = data ?? {};

  function dataForTable(table: SQLiteTable): Record<string, unknown>[] {
    const name = getTableName(table);
    return tableData[name] ?? [];
  }

  const runFn = () => vi.fn().mockResolvedValue(undefined);

  const db: Db = {
    query(table: SQLiteTable) {
      const rows = dataForTable(table);
      return {
        findMany: () => ({
          permissions: [],
          run: vi.fn().mockResolvedValue(rows),
        }),
        findFirst: () => ({
          permissions: [],
          run: vi.fn().mockResolvedValue(rows[0] ?? undefined),
        }),
        paginate: () => ({
          permissions: [],
          run: vi.fn().mockResolvedValue({
            items: rows,
            total: rows.length,
            page: 1,
            totalPages: 1,
          }),
        }),
      };
    },
    insert(_table: SQLiteTable) {
      const run = runFn();
      return {
        values: (_vals: Record<string, unknown>) => {
          const op = {
            permissions: [],
            run,
            returning: () => ({
              permissions: [],
              run: vi.fn().mockResolvedValue({}),
            }),
          };
          return op;
        },
      };
    },
    update(_table: SQLiteTable) {
      const run = runFn();
      return {
        set: (_vals: Record<string, unknown>) => ({
          where: (_cond: unknown) => {
            const op = {
              permissions: [],
              run,
              returning: () => ({
                permissions: [],
                run: vi.fn().mockResolvedValue({}),
              }),
            };
            return op;
          },
        }),
      };
    },
    delete(_table: SQLiteTable) {
      const run = runFn();
      return {
        where: (_cond: unknown) => {
          const op = {
            permissions: [],
            run,
            returning: () => ({
              permissions: [],
              run: vi.fn().mockResolvedValue({}),
            }),
          };
          return op;
        },
      };
    },
    unsafe() {
      return db;
    },
    batch(operations: unknown[]) {
      return {
        permissions: [],
        run: vi.fn().mockResolvedValue(
          operations.map(() => undefined),
        ),
      };
    },
    cache: {
      invalidate: vi.fn().mockResolvedValue(undefined),
    },
  };

  return db;
}

// ---------------------------------------------------------------------------
// 5. mockDbWithError
// ---------------------------------------------------------------------------

export function mockDbWithError(errorMessage: string): Db {
  const errorFn = () => vi.fn().mockRejectedValue(new Error(errorMessage));

  const db: Db = {
    query(table: SQLiteTable) {
      return {
        findMany: () => ({
          permissions: [],
          run: vi.fn().mockResolvedValue([]),
        }),
        findFirst: () => ({
          permissions: [],
          run: vi.fn().mockResolvedValue(undefined),
        }),
        paginate: () => ({
          permissions: [],
          run: vi.fn().mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            totalPages: 0,
          }),
        }),
      };
    },
    insert(_table: SQLiteTable) {
      const run = errorFn();
      return {
        values: (_vals: Record<string, unknown>) => ({
          permissions: [],
          run,
          returning: () => ({
            permissions: [],
            run: errorFn(),
          }),
        }),
      };
    },
    update(_table: SQLiteTable) {
      const run = errorFn();
      return {
        set: (_vals: Record<string, unknown>) => ({
          where: (_cond: unknown) => ({
            permissions: [],
            run,
            returning: () => ({
              permissions: [],
              run: errorFn(),
            }),
          }),
        }),
      };
    },
    delete(_table: SQLiteTable) {
      const run = errorFn();
      return {
        where: (_cond: unknown) => ({
          permissions: [],
          run,
          returning: () => ({
            permissions: [],
            run: errorFn(),
          }),
        }),
      };
    },
    unsafe() {
      return db;
    },
    batch(operations: unknown[]) {
      return {
        permissions: [],
        run: vi.fn().mockRejectedValue(new Error(errorMessage)),
      };
    },
    cache: {
      invalidate: vi.fn().mockResolvedValue(undefined),
    },
  };

  return db;
}

// ---------------------------------------------------------------------------
// 6. testTableMetas
// ---------------------------------------------------------------------------

export function testTableMetas(
  overrides?: Record<string, TableOverrides>,
): AdminTableMeta[] {
  return introspectSchema(testSchema, overrides);
}

// ---------------------------------------------------------------------------
// 7. formData
// ---------------------------------------------------------------------------

export function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.append(key, value);
  }
  return fd;
}

// ---------------------------------------------------------------------------
// 8. mockRequest
// ---------------------------------------------------------------------------

export function mockRequest(
  urlPath: string,
  options?: RequestInit,
): Request {
  const url = new URL(urlPath, "http://localhost");
  return new Request(url.toString(), options);
}
