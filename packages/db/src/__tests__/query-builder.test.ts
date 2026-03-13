import { describe, it, expect } from "vitest";
import { createQueryBuilder } from "../query-builder";
import { posts, schema, createMockD1, grantsForRole } from "./helpers";

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
      });

      const op = qb.findFirst();
      expect(op.permissions).toEqual([]);
    });
  });
});
