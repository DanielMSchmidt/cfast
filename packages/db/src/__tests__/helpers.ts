import { definePermissions, grant, resolveGrants } from "@cfast/permissions";
import type { Grant, LookupDb } from "@cfast/permissions";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createLookupCache, type LookupCache } from "../utils";

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

export type TestUser = { id: string };

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

export function grantsForRole(role: string): Grant[] {
  return resolveGrants(testPermissions, [role]);
}

/**
 * Builds the boilerplate `lookupCache` + `getLookupDb` fields that
 * `createQueryBuilder` / `createInsertBuilder` / etc. now require.
 *
 * Most existing tests pass no `with`-lookup grants so the LookupDb is never
 * actually invoked; we throw on access to make accidental usage loud.
 */
export function lookupTestConfig(): {
  lookupCache: LookupCache;
  getLookupDb: () => LookupDb;
} {
  return {
    lookupCache: createLookupCache(),
    getLookupDb: () => {
      throw new Error(
        "lookupTestConfig: getLookupDb invoked but no `with` lookups were declared in this test",
      );
    },
  };
}

// Minimal D1 mock that records prepare() calls and batch() invocations.
export function createMockD1(): D1Database & {
  _calls: Array<{ sql: string; params: unknown[] }>;
  _batches: Array<Array<{ sql: string; params: unknown[] }>>;
} {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const batches: Array<Array<{ sql: string; params: unknown[] }>> = [];

  const mockResults = {
    results: [] as unknown[],
    success: true,
    meta: { changes: 1 },
  };

  // Each prepared statement remembers its SQL and the bound parameters so the
  // batch() call below can capture them when the statement is included in a
  // native batch.
  const stmt = (sqlStr: string) => {
    const handle: { sql: string; params: unknown[] } = { sql: sqlStr, params: [] };
    return {
      _handle: handle,
      bind: (...params: unknown[]) => {
        handle.params = params;
        calls.push({ sql: sqlStr, params });
        return {
          _handle: handle,
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
    };
  };

  return {
    _calls: calls,
    _batches: batches,
    prepare: (sqlStr: string) => stmt(sqlStr),
    batch: async (stmts: any[]) => {
      const snapshot = stmts.map((s: any) => {
        const h = s?._handle as { sql: string; params: unknown[] } | undefined;
        return h ? { sql: h.sql, params: h.params } : { sql: "<unknown>", params: [] };
      });
      batches.push(snapshot);
      return stmts.map(() => mockResults);
    },
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as any;
}
