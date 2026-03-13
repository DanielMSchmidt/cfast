import { describe, it, expect } from "vitest";
import { createImpersonationManager } from "../impersonation";
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
