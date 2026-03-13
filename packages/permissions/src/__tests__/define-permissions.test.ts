import { describe, it, expect } from "vitest";
import { definePermissions } from "../define-permissions";
import { grant } from "../grant";
import type { DrizzleTable } from "../types";

const posts: DrizzleTable = { _: { name: "posts" } };
const _comments: DrizzleTable = { _: { name: "comments" } };

describe("definePermissions", () => {
  describe("basic (no hierarchy)", () => {
    it("returns roles and grants", () => {
      const perms = definePermissions({
        roles: ["anonymous", "user"] as const,
        grants: {
          anonymous: [grant("read", posts)],
          user: [grant("read", posts), grant("create", posts)],
        },
      });

      expect(perms.roles).toEqual(["anonymous", "user"]);
      expect(perms.grants.anonymous).toHaveLength(1);
      expect(perms.grants.user).toHaveLength(2);
    });

    it("accepts grants as a callback (curried form)", () => {
      type TestUser = { id: string };
      const perms = definePermissions<TestUser>()({
        roles: ["anonymous", "user"] as const,
        grants: (g) => ({
          anonymous: [g("read", posts)],
          user: [
            g("read", posts),
            g("create", posts, {
              where: (_cols, user) => {
                // user should be typed as TestUser
                void user.id;
                return undefined;
              },
            }),
          ],
        }),
      });

      expect(perms.roles).toEqual(["anonymous", "user"]);
      expect(perms.grants.anonymous).toHaveLength(1);
      expect(perms.grants.user).toHaveLength(2);
    });

    it("resolvedGrants equals grants when there is no hierarchy", () => {
      const perms = definePermissions({
        roles: ["anonymous", "user"] as const,
        grants: {
          anonymous: [grant("read", posts)],
          user: [grant("create", posts)],
        },
      });

      expect(perms.resolvedGrants.anonymous).toEqual(perms.grants.anonymous);
      expect(perms.resolvedGrants.user).toEqual(perms.grants.user);
    });

    it("handles empty grants for a role", () => {
      const perms = definePermissions({
        roles: ["anonymous", "admin"] as const,
        grants: {
          anonymous: [],
          admin: [grant("manage", "all")],
        },
      });

      expect(perms.resolvedGrants.anonymous).toEqual([]);
      expect(perms.resolvedGrants.admin).toHaveLength(1);
    });
  });

  describe("with hierarchy", () => {
    it("inherits grants from parent roles", () => {
      const perms = definePermissions({
        roles: ["anonymous", "user", "admin"] as const,
        hierarchy: {
          user: ["anonymous"],
          admin: ["user"],
        },
        grants: {
          anonymous: [grant("read", posts)],
          user: [grant("create", posts)],
          admin: [grant("manage", "all")],
        },
      });

      expect(perms.resolvedGrants.anonymous).toHaveLength(1);

      expect(perms.resolvedGrants.user).toHaveLength(2);
      expect(perms.resolvedGrants.user[0].action).toBe("read");
      expect(perms.resolvedGrants.user[1].action).toBe("create");

      expect(perms.resolvedGrants.admin).toHaveLength(3);
    });

    it("inherits from multiple parents", () => {
      const perms = definePermissions({
        roles: ["reader", "writer", "editor"] as const,
        hierarchy: {
          editor: ["reader", "writer"],
        },
        grants: {
          reader: [grant("read", posts)],
          writer: [grant("create", posts)],
          editor: [grant("update", posts)],
        },
      });

      expect(perms.resolvedGrants.editor).toHaveLength(3);
    });

    it("throws on circular hierarchy", () => {
      expect(() =>
        definePermissions({
          roles: ["a", "b"] as const,
          hierarchy: {
            a: ["b"],
            b: ["a"],
          },
          grants: {
            a: [],
            b: [],
          },
        }),
      ).toThrow("Circular role hierarchy");
    });

    it("handles deep chains", () => {
      const perms = definePermissions({
        roles: ["a", "b", "c", "d"] as const,
        hierarchy: {
          b: ["a"],
          c: ["b"],
          d: ["c"],
        },
        grants: {
          a: [grant("read", posts)],
          b: [grant("create", posts)],
          c: [grant("update", posts)],
          d: [grant("delete", posts)],
        },
      });

      expect(perms.resolvedGrants.d).toHaveLength(4);
    });
  });
});
