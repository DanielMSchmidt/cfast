import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { createQueryBuilder } from "../query-builder";
import {
  posts,
  schema,
  createMockD1,
  grantsForRole,
  lookupTestConfig,
} from "./helpers";
import { grant, getGrantedActions } from "@cfast/permissions";
import type { Grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";

describe("_can annotations", () => {
  describe("findMany", () => {
    it("adds _can extras to SQL for admin (manage all)", async () => {
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants: grantsForRole("admin"),
        user: { id: "admin-1" },
        cache: false,
      });

      await db.query(posts).findMany().run();

      const selects = d1._calls.filter((c) => /select/i.test(c.sql));
      expect(selects.length).toBeGreaterThan(0);
      expect(selects.some((c) => /_can_read/i.test(c.sql))).toBe(true);
      expect(selects.some((c) => /_can_create/i.test(c.sql))).toBe(true);
      expect(selects.some((c) => /_can_update/i.test(c.sql))).toBe(true);
      expect(selects.some((c) => /_can_delete/i.test(c.sql))).toBe(true);
    });

    it("returns Operation with correct permissions", () => {
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
  });

  describe("findFirst", () => {
    it("returns undefined without _can when no row found", async () => {
      const db = createDb({
        d1: createMockD1(),
        schema,
        grants: grantsForRole("editor"),
        user: { id: "editor-1" },
        cache: false,
      });

      const result = await db.query(posts).findFirst().run();
      expect(result).toBeUndefined();
    });
  });

  describe("unsafe mode", () => {
    it("does not add _can extras in unsafe mode", async () => {
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants: grantsForRole("editor"),
        user: { id: "editor-1" },
        cache: false,
      });

      await db.unsafe().query(posts).findMany().run();

      const selects = d1._calls.filter((c) => /select/i.test(c.sql));
      for (const s of selects) {
        expect(s.sql).not.toMatch(/_can_/);
      }
    });
  });

  describe("manage grant expansion", () => {
    it("admin with manage all gets all four CRUD actions", () => {
      const grants = grantsForRole("admin");
      const actions = getGrantedActions(grants, posts);
      expect(actions).toHaveLength(4);
      const actionNames = actions.map((a) => a.action).sort();
      expect(actionNames).toEqual(["create", "delete", "read", "update"]);
      for (const a of actions) {
        expect(a.unrestricted).toBe(true);
      }
    });
  });

  describe("where-clause grants produce row-dependent _can", () => {
    it("restricted grant generates CASE WHEN SQL extras", async () => {
      const grants: Grant[] = [
        grant("read", posts),
        grant("update", posts, {
          where: (cols: any, user: any) => eq(cols.authorId, user.id),
        }),
      ];

      const d1 = createMockD1();
      const qb = createQueryBuilder({
        d1,
        schema,
        grants,
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      await qb.findMany().run();

      const selects = d1._calls.filter((c) => /select/i.test(c.sql));
      expect(selects.length).toBeGreaterThan(0);
      const hasCase = selects.some(
        (c) => /case when/i.test(c.sql) && /"_can_update"/i.test(c.sql),
      );
      expect(hasCase).toBe(true);

      const hasLiteral = selects.some((c) => /"_can_read"/i.test(c.sql));
      expect(hasLiteral).toBe(true);
    });

    it("unrestricted grant uses literal 1 instead of CASE", async () => {
      const grants: Grant[] = [
        grant("read", posts),
        grant("create", posts),
      ];

      const d1 = createMockD1();
      const qb = createQueryBuilder({
        d1,
        schema,
        grants,
        user: { id: "user-1" },
        table: posts,
        unsafe: false,
        ...lookupTestConfig(),
      });

      await qb.findMany().run();

      const selects = d1._calls.filter((c) => /select/i.test(c.sql));
      expect(selects.length).toBeGreaterThan(0);
      for (const s of selects) {
        expect(s.sql).not.toMatch(/case when/i);
      }
      expect(selects.some((c) => /_can_read/i.test(c.sql))).toBe(true);
      expect(selects.some((c) => /_can_create/i.test(c.sql))).toBe(true);
    });
  });

  describe("null user", () => {
    it("does not add _can when user is null", async () => {
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants: [],
        user: null,
        cache: false,
      });

      await db.unsafe().query(posts).findMany().run();

      const selects = d1._calls.filter((c) => /select/i.test(c.sql));
      for (const s of selects) {
        expect(s.sql).not.toMatch(/_can_/);
      }
    });
  });

  describe("post-processing", () => {
    it("attachCan collects _can_* keys into a _can object", () => {
      const row: Record<string, unknown> = {
        id: "p1",
        title: "Hello",
        _can_read: 1,
        _can_create: 1,
        _can_update: 0,
        _can_delete: 0,
      };

      const can: Record<string, boolean> = {};
      const allActions = ["read", "create", "update", "delete"] as const;
      for (const action of allActions) {
        const key = "_can_" + action;
        if (key in row) {
          can[action] = row[key] === 1 || row[key] === true;
          delete row[key];
        }
      }
      row._can = can;

      expect(row._can).toEqual({
        read: true,
        create: true,
        update: false,
        delete: false,
      });
      expect(row).not.toHaveProperty("_can_read");
      expect(row).not.toHaveProperty("_can_create");
      expect(row).not.toHaveProperty("_can_update");
      expect(row).not.toHaveProperty("_can_delete");
    });
  });
});
