import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createImpersonationManager,
  __resetImpersonationWarningCacheForTests,
} from "../impersonation";
import { createMockD1 } from "./helpers";

describe("impersonation manager", () => {
  it("impersonate inserts a log entry", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    await mgr.impersonate("admin-1", "user-1");

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toContain("INSERT INTO impersonation_logs");
    expect(d1._calls[0].params).toContain("admin-1");
    expect(d1._calls[0].params).toContain("user-1");
  });

  it("stopImpersonating sets ended_at on active entries", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    await mgr.stopImpersonating("admin-1");

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toContain("UPDATE impersonation_logs");
    expect(d1._calls[0].sql).toContain("ended_at");
    expect(d1._calls[0].sql).toContain("ended_at IS NULL");
  });

  it("getActiveImpersonation returns null when none active", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    const result = await mgr.getActiveImpersonation("admin-1");

    expect(result).toBeNull();
    expect(d1._calls[0].sql).toContain("ended_at IS NULL");
  });

  it("uses custom table name", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1, {
      tableName: "custom_impersonation",
    });

    await mgr.impersonate("admin-1", "user-1");

    expect(d1._calls[0].sql).toContain("custom_impersonation");
  });

  it("impersonate generates a unique id", async () => {
    const d1 = createMockD1();
    const mgr = createImpersonationManager(d1);

    await mgr.impersonate("admin-1", "user-1");

    // First param should be a UUID-like string
    const id = d1._calls[0].params[0] as string;
    expect(id).toBeDefined();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

/**
 * Regression tests for cfast #172: when a consumer upgrades from
 * `@cfast/auth@0.2.x` to `0.3.x` without running the new migration,
 * the `impersonation_logs` table does not exist and the D1 query for
 * the active impersonation throws `D1_ERROR: no such table: impersonation_logs`.
 * The auth context bootstrap calls `getActiveImpersonation()` on every
 * authenticated request, so that error translated into a 500 on
 * literally every protected route in production apps.
 *
 * The contract now is:
 *   - `getActiveImpersonation()` detects the missing-table error and
 *     returns `null` (the "no admin is impersonating anyone" safe default).
 *   - A one-time warning is logged pointing the operator at the
 *     migration they need to run.
 *   - Unrelated errors still propagate (e.g. a genuine connection failure).
 *   - `impersonate()` / `stopImpersonating()` still throw — silently
 *     swallowing a write would pretend the audit row was recorded.
 */
describe("impersonation manager — missing table fallback (cfast #172)", () => {
  beforeEach(() => {
    __resetImpersonationWarningCacheForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Builds a mock D1 whose `.prepare().bind().first()` throws the exact
   * error shape Cloudflare D1 raises for a missing table, so the fallback
   * is exercised against a realistic failure mode rather than a synthetic
   * `Error("no such table")` stub.
   */
  function createD1ThrowingMissingTable(
    tableName: string,
    message = `D1_ERROR: no such table: ${tableName}`,
  ): D1Database {
    const err = new Error(message);
    return {
      prepare: (_sql: string) => ({
        bind: (..._params: unknown[]) => ({
          first: async () => {
            throw err;
          },
          all: async () => {
            throw err;
          },
          run: async () => {
            throw err;
          },
          raw: async () => {
            throw err;
          },
        }),
      }),
      batch: async () => [],
      dump: async () => new ArrayBuffer(0),
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as D1Database;
  }

  it("getActiveImpersonation returns null instead of throwing when the table is missing", async () => {
    const d1 = createD1ThrowingMissingTable("impersonation_logs");
    const mgr = createImpersonationManager(d1);

    const result = await mgr.getActiveImpersonation("admin-1");

    expect(result).toBeNull();
  });

  it("logs a one-time warning pointing at the migration fix", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d1 = createD1ThrowingMissingTable("impersonation_logs");
    const mgr = createImpersonationManager(d1);

    await mgr.getActiveImpersonation("admin-1");

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0]![0] as string;
    expect(message).toContain("impersonation_logs");
    expect(message).toContain("db:migrate");
    expect(message).toContain("@cfast/auth/schema");
  });

  it("dedupes the warning across repeated calls so hot paths don't spam logs", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d1 = createD1ThrowingMissingTable("impersonation_logs");
    const mgr = createImpersonationManager(d1);

    await mgr.getActiveImpersonation("admin-1");
    await mgr.getActiveImpersonation("admin-1");
    await mgr.getActiveImpersonation("admin-2");

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("detects a bare SQLite-style error message with no D1_ERROR prefix", async () => {
    const d1 = createD1ThrowingMissingTable(
      "impersonation_logs",
      "no such table: impersonation_logs",
    );
    const mgr = createImpersonationManager(d1);

    const result = await mgr.getActiveImpersonation("admin-1");

    expect(result).toBeNull();
  });

  it("honors a custom tableName when detecting the missing-table error", async () => {
    const d1 = createD1ThrowingMissingTable(
      "audit_impersonation",
      "D1_ERROR: no such table: audit_impersonation",
    );
    const mgr = createImpersonationManager(d1, {
      tableName: "audit_impersonation",
    });

    const result = await mgr.getActiveImpersonation("admin-1");

    expect(result).toBeNull();
  });

  it("re-throws unrelated D1 errors so real failures are not swallowed", async () => {
    const d1 = {
      prepare: () => ({
        bind: () => ({
          first: async () => {
            throw new Error("D1_ERROR: network unreachable");
          },
        }),
      }),
    } as unknown as D1Database;
    const mgr = createImpersonationManager(d1);

    await expect(mgr.getActiveImpersonation("admin-1")).rejects.toThrow(
      "network unreachable",
    );
  });

  it("re-throws a missing-table error for a *different* table (e.g. users)", async () => {
    // If the JOIN-less impersonation query somehow hits a missing
    // users table, that is a different bug and must not be masked by
    // the impersonation_logs fallback.
    const d1 = createD1ThrowingMissingTable(
      "users",
      "D1_ERROR: no such table: users",
    );
    const mgr = createImpersonationManager(d1);

    await expect(mgr.getActiveImpersonation("admin-1")).rejects.toThrow(
      "no such table: users",
    );
  });

  it("impersonate() still throws on missing table (writes must not be silently swallowed)", async () => {
    const d1 = createD1ThrowingMissingTable("impersonation_logs");
    const mgr = createImpersonationManager(d1);

    await expect(mgr.impersonate("admin-1", "user-1")).rejects.toThrow(
      "no such table: impersonation_logs",
    );
  });

  it("stopImpersonating() still throws on missing table", async () => {
    const d1 = createD1ThrowingMissingTable("impersonation_logs");
    const mgr = createImpersonationManager(d1);

    await expect(mgr.stopImpersonating("admin-1")).rejects.toThrow(
      "no such table: impersonation_logs",
    );
  });
});
