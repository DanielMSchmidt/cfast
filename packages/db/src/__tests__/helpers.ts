import { definePermissions, grant, resolveGrants } from "@cfast/permissions";
import type { Grant } from "@cfast/permissions";
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

// Minimal D1 mock that records calls
export function createMockD1(): D1Database & { _calls: Array<{ sql: string; params: unknown[] }> } {
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  const mockResults = {
    results: [] as unknown[],
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
