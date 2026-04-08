import { describe, it, expect } from "vitest";
import { definePermissions } from "../define-permissions";
import { grant } from "../grant";
import { PermissionRegistrationError } from "../errors";
import type { DrizzleTable } from "../types";

// Drizzle tables expose the SQL name via a `Symbol.for("drizzle:Name")` key
// at runtime and via the structural `_.name` field at the type level.
// These helpers build fakes that satisfy **both** so the unit tests exercise
// exactly the same resolution logic the real sqliteTable objects do.
const DRIZZLE_NAME = Symbol.for("drizzle:Name");
function mockTable<TName extends string>(
  name: TName,
): { readonly _: { readonly name: TName } } {
  return {
    _: { name },
    [DRIZZLE_NAME]: name,
  } as { readonly _: { readonly name: TName } };
}

const posts: DrizzleTable = mockTable("posts");
const _comments: DrizzleTable = mockTable("comments");

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

  // Issues #146, #175, #177: runtime resolution of string subjects against
  // the schema. String-form subjects must resolve to the **exact same**
  // Drizzle table reference the schema uses, not a shadow object — Drizzle
  // identifies tables by reference, so any mismatch breaks cross-table
  // relational `with` queries.
  describe("with runtime-resolved schema ({ schema } option)", () => {
    type AuthUser = { id: string };
    // `documentVersions` intentionally uses camelCase JS key with a
    // snake_case SQL name so we exercise the dual-key lookup for #177.
    const documents = mockTable("documents");
    const documentVersions = mockTable("document_versions");
    const schema = { documents, documentVersions };
    type Schema = typeof schema;

    it("resolves string subjects via the JS schema key", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [g("read", "documents")],
        }),
      });
      // The grant's subject must be the **exact same reference** as the
      // schema table (not a shadow object), or Drizzle's relational query
      // builder will silently fail on cross-table `with` lookups.
      expect(perms.grants.member[0].subject).toBe(documents);
    });

    it("resolves string subjects via the SQL table name (issue #177)", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [g("read", "document_versions")],
        }),
      });
      // `"document_versions"` is the SQL name — it must resolve to the
      // `documentVersions` schema binding's table reference.
      expect(perms.grants.member[0].subject).toBe(documentVersions);
    });

    it("resolves JS key and SQL name to the same reference", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [
            g("read", "documentVersions"),
            g("read", "document_versions"),
          ],
        }),
      });
      expect(perms.grants.member[0].subject).toBe(documentVersions);
      expect(perms.grants.member[1].subject).toBe(documentVersions);
      expect(perms.grants.member[0].subject).toBe(
        perms.grants.member[1].subject,
      );
    });

    it("still accepts object-form subjects unchanged", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [g("read", documents), g("read", "document_versions")],
        }),
      });
      expect(perms.grants.member[0].subject).toBe(documents);
      expect(perms.grants.member[1].subject).toBe(documentVersions);
    });

    it("still accepts the 'all' literal unchanged", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["admin"] as const,
        grants: (g) => ({
          admin: [g("manage", "all")],
        }),
      });
      expect(perms.grants.admin[0].subject).toBe("all");
    });

    it("threads the typed user through where clauses after resolution", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [
            g("update", "documents", {
              where: (_cols, user) => {
                void user.id;
                return undefined;
              },
            }),
          ],
        }),
      });
      expect(perms.grants.member[0].subject).toBe(documents);
      expect(perms.grants.member[0].where).toBeDefined();
    });

    it("throws PermissionRegistrationError for an unknown string subject", () => {
      expect(() =>
        definePermissions<AuthUser, Schema>({ schema })({
          roles: ["member"] as const,
          grants: (g) => ({
            // Cast to any to bypass the compile-time constraint — we need
            // to exercise the runtime throw path here.
            member: [g("read", "unknownTable" as never)],
          }),
        }),
      ).toThrow(PermissionRegistrationError);
    });

    it("PermissionRegistrationError lists the known subjects (both JS key and SQL name)", () => {
      let caught: PermissionRegistrationError | undefined;
      try {
        definePermissions<AuthUser, Schema>({ schema })({
          roles: ["member"] as const,
          grants: (g) => ({
            member: [g("read", "nope" as never)],
          }),
        });
      } catch (e) {
        caught = e as PermissionRegistrationError;
      }
      expect(caught).toBeInstanceOf(PermissionRegistrationError);
      expect(caught!.subject).toBe("nope");
      expect(caught!.availableTables).toContain("documents");
      expect(caught!.availableTables).toContain("documentVersions");
      expect(caught!.availableTables).toContain("document_versions");
    });

    it("rejects unknown strings at compile time (sanity)", () => {
      // Pure type-level check: the body below is never executed — we only
      // want TypeScript to flag "ghost" as not assignable to the schema's
      // subject union. `@ts-expect-error` fails the build if the error
      // disappears (i.e. the constraint is lost).
      function _typeOnly() {
        definePermissions<AuthUser, Schema>({ schema })({
          roles: ["member"] as const,
          grants: (g) => ({
            // @ts-expect-error - "ghost" is not a JS key or SQL name on Schema
            member: [g("read", "ghost")],
          }),
        });
      }
      // Reference the function so linters don't flag it as unused.
      expect(typeof _typeOnly).toBe("function");
    });

    it("accepts SQL names at compile time for camelCase-keyed tables", () => {
      // Regression for #177: prior to the fix, TypeScript only accepted
      // JS keys ("documentVersions"), rejecting the SQL name
      // "document_versions". Both should compile cleanly now.
      definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [
            g("read", "documentVersions"),
            g("read", "document_versions"),
          ],
        }),
      });
    });

    it("resolved grants retain the real table reference through hierarchy expansion", () => {
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["viewer", "member"] as const,
        hierarchy: {
          member: ["viewer"],
        },
        grants: (g) => ({
          viewer: [g("read", "documents")],
          member: [g("create", "document_versions")],
        }),
      });
      expect(perms.resolvedGrants.member).toHaveLength(2);
      const resolved = perms.resolvedGrants.member.map((g) => g.subject);
      expect(resolved).toContain(documents);
      expect(resolved).toContain(documentVersions);
    });

    it("string subjects resolve to the SAME reference as object-form grants (resolveGrants merging)", async () => {
      // Previously, a string-form grant and an object-form grant on the
      // same table were grouped under different keys in resolve-grants
      // (s:foo vs o:<id>), so their where clauses did not OR-merge. After
      // runtime resolution strips the string, both grants share the same
      // DrizzleTable reference and merge correctly.
      const { resolveGrants } = await import("../resolve-grants");
      const perms = definePermissions<AuthUser, Schema>({ schema })({
        roles: ["member"] as const,
        grants: (g) => ({
          member: [
            g("read", "documents"),
            g("read", documents), // object form on the same table
          ],
        }),
      });
      const merged = resolveGrants(perms, ["member"]);
      // Both grants are unrestricted (no where), so they must collapse to
      // exactly one merged grant on `documents`.
      expect(merged).toHaveLength(1);
      expect(merged[0].subject).toBe(documents);
    });
  });
});
