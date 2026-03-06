import { describe, it, expect } from "vitest";
import { createQueryBuilder } from "../query-builder";
import { testPermissions, posts, schema, createMockD1 } from "./helpers";
import type { TestUser } from "./helpers";

describe("QueryBuilder", () => {
  describe("findMany", () => {
    it("returns an Operation with correct permissions", () => {
      const user: TestUser = { id: "user-1", role: "editor" };
      const qb = createQueryBuilder({
        d1: createMockD1(),
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
        d1: createMockD1(),
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
        d1: createMockD1(),
        schema,
        permissions: testPermissions,
        user,
        table: posts,
        unsafe: false,
      });

      const op = qb.findFirst();
      expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    });

    it("returns empty permissions when unsafe", () => {
      const user: TestUser = { id: "user-1", role: "user" };
      const qb = createQueryBuilder({
        d1: createMockD1(),
        schema,
        permissions: testPermissions,
        user,
        table: posts,
        unsafe: true,
      });

      const op = qb.findFirst();
      expect(op.permissions).toEqual([]);
    });
  });
});
