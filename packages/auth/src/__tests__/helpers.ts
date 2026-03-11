import { definePermissions, grant } from "@cfast/permissions";

// Minimal D1 mock that records calls and can return configurable results
export function createMockD1(): D1Database & { _calls: Array<{ sql: string; params: unknown[] }> } {
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  let nextResults: unknown[] = [];

  const mockResults = () => ({
    results: nextResults,
    success: true,
    meta: {},
  });

  const stmt = (sqlStr: string) => ({
    bind: (...params: unknown[]) => {
      calls.push({ sql: sqlStr, params });
      return {
        all: async () => mockResults(),
        first: async () => null,
        run: async () => mockResults(),
        raw: async () => [],
      };
    },
    all: async () => { calls.push({ sql: sqlStr, params: [] }); return mockResults(); },
    first: async () => { calls.push({ sql: sqlStr, params: [] }); return null; },
    run: async () => { calls.push({ sql: sqlStr, params: [] }); return mockResults(); },
    raw: async () => { calls.push({ sql: sqlStr, params: [] }); return []; },
  });

  return {
    _calls: calls,
    prepare: (sqlStr: string) => stmt(sqlStr),
    batch: async (stmts: unknown[]) => stmts.map(() => mockResults()),
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as any;
}

// Simple test permissions for auth tests
export const testPermissions = definePermissions({
  roles: ["anonymous", "user", "admin"] as const,
  grants: {
    anonymous: [],
    user: [grant("read", "all")],
    admin: [grant("manage", "all")],
  },
});
