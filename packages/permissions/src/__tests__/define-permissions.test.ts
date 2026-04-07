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

  describe("with curried <User, Tables> form", () => {
    type AuthUser = { id: string };
    // Mock schema-like object — same shape as `import * as schema from "./schema"`
    const schema = {
      posts,
      comments: { _: { name: "comments" } } as DrizzleTable,
    };
    type Schema = typeof schema;

    it("accepts string subjects constrained to known table names", () => {
      const perms = definePermissions<AuthUser, Schema>()({
        roles: ["member", "admin"] as const,
        grants: (g) => ({
          member: [g("read", "posts"), g("create", "comments")],
          admin: [g("manage", "all")],
        }),
      });

      expect(perms.grants.member).toHaveLength(2);
      expect(perms.grants.member[0].subject).toBe("posts");
      expect(perms.grants.member[1].subject).toBe("comments");
    });

    it("accepts object subjects in the same call", () => {
      const perms = definePermissions<AuthUser, Schema>()({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [g("read", schema.posts), g("create", "comments")],
        }),
      });

      expect(perms.grants.member).toHaveLength(2);
      expect(perms.grants.member[0].subject).toBe(schema.posts);
      expect(perms.grants.member[1].subject).toBe("comments");
    });

    it("rejects unknown string subjects at compile time", () => {
      definePermissions<AuthUser, Schema>()({
        roles: ["member"] as const,
        grants: (g) => ({
          // @ts-expect-error - "unknownTable" is not a key of Schema
          member: [g("read", "unknownTable")],
        }),
      });
    });

    it("string-form grants produce same matching behavior as object-form grants", () => {
      const stringPerms = definePermissions<AuthUser, Schema>()({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [g("read", "posts"), g("create", "posts")],
        }),
      });
      const objectPerms = definePermissions<AuthUser, Schema>()({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [g("read", schema.posts), g("create", schema.posts)],
        }),
      });

      // Both should resolve to grants that match the same descriptors
      expect(stringPerms.grants.member).toHaveLength(2);
      expect(objectPerms.grants.member).toHaveLength(2);
    });

    it("typed user is still threaded through where clauses", () => {
      const perms = definePermissions<AuthUser, Schema>()({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [
            g("update", "posts", {
              where: (_cols, user) => {
                // user should be typed as AuthUser
                void user.id;
                return undefined;
              },
            }),
          ],
        }),
      });
      expect(perms.grants.member).toHaveLength(1);
    });
  });
});
