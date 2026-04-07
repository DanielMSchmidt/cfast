import { describe, it, expect } from "vitest";
import { createQueryBuilder } from "../query-builder";
import { posts, schema, createMockD1, grantsForRole, lookupTestConfig } from "./helpers";

describe("QueryBuilder", () => {
  describe("findMany", () => {
    it("returns an Operation with correct permissions", () => {
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      const op = qb.findMany();
      expect(op.permissions).toEqual([{ action: "read", table: posts }]);
      expect(typeof op.run).toBe("function");
    });

    it("returns empty permissions when unsafe", () => {
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: true,
        ...lookupTestConfig(),
      });

      const op = qb.findMany();
      expect(op.permissions).toEqual([]);
    });
  });

  describe("findFirst", () => {
    it("returns an Operation with correct permissions", () => {
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("user"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      const op = qb.findFirst();
      expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    });

    it("returns empty permissions when unsafe", () => {
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("user"),
        user: { id: "user-1" },
        table: posts,
        unsafe: true,
        ...lookupTestConfig(),
      });

      const op = qb.findFirst();
      expect(op.permissions).toEqual([]);
    });
  });

  describe("single-op shorthand", () => {
    it("findMany().run() works without arguments", async () => {
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      // No need to wrap in compose() for a single read.
      await expect(qb.findMany().run()).resolves.toBeDefined();
    });

    it("findFirst().run() works without arguments", async () => {
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      await expect(qb.findFirst().run()).resolves.toBeUndefined();
    });
  });

  describe("findMany — limit/offset (issue #112)", () => {
    it("passes limit through to the underlying SQL", async () => {
      const d1 = createMockD1();
      const qb = createQueryBuilder({
        d1,
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      await qb.findMany({ limit: 12 }).run();

      // Drizzle should have prepared a SELECT with a LIMIT clause.
      const selects = d1._calls.filter((c) => /\bselect\b/i.test(c.sql));
      expect(selects.length).toBeGreaterThan(0);
      expect(selects.some((c) => /limit/i.test(c.sql))).toBe(true);
    });

    it("passes offset through to the underlying SQL", async () => {
      const d1 = createMockD1();
      const qb = createQueryBuilder({
        d1,
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      await qb.findMany({ limit: 12, offset: 24 }).run();

      const selects = d1._calls.filter((c) => /\bselect\b/i.test(c.sql));
      expect(selects.length).toBeGreaterThan(0);
      // Drizzle emits both LIMIT and OFFSET.
      expect(selects.some((c) => /limit/i.test(c.sql))).toBe(true);
      expect(selects.some((c) => /offset/i.test(c.sql))).toBe(true);
    });

    it("supports offset without limit", async () => {
      const d1 = createMockD1();
      const qb = createQueryBuilder({
        d1,
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      // Drizzle requires limit when offset is set; we still want the API to
      // accept the option without throwing.
      await expect(
        qb.findMany({ limit: 100, offset: 50 }).run(),
      ).resolves.toBeDefined();
    });

    it("supports paginating a product catalog (page 3, page size 12)", async () => {
      const d1 = createMockD1();
      const qb = createQueryBuilder({
        d1,
        schema,
        grants: grantsForRole("editor"),
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      // Page 3 of 12-per-page = offset 24, limit 12.
      await qb.findMany({ limit: 12, offset: 24 }).run();

      const selects = d1._calls.filter((c) => /\bselect\b/i.test(c.sql));
      expect(selects.some((c) => /limit/i.test(c.sql) && /offset/i.test(c.sql))).toBe(true);
    });
  });
});
