import { describe, it, expect } from "vitest";
import { can } from "../can";
import { definePermissions } from "../define-permissions";
import { resolveGrants } from "../resolve-grants";
import { grant } from "../grant";

import type { DrizzleTable } from "../types";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");
const posts: DrizzleTable = { [DRIZZLE_NAME]: "posts" };
const comments: DrizzleTable = { [DRIZZLE_NAME]: "comments" };
const auditLogs: DrizzleTable = { [DRIZZLE_NAME]: "audit_logs" };

const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  hierarchy: {
    user: ["anonymous"],
    editor: ["user"],
    admin: ["editor"],
  },
  grants: {
    anonymous: [grant("read", posts)],
    user: [grant("create", posts), grant("create", comments)],
    editor: [grant("update", posts), grant("delete", posts)],
    admin: [grant("manage", "all")],
  },
});

function grantsFor(role: string) {
  return resolveGrants(permissions, [role]);
}

describe("can", () => {
  it("returns true when grants include the exact action+table", () => {
    expect(can(grantsFor("user"), "create", posts)).toBe(true);
  });

  it("returns false when grants lack the action", () => {
    expect(can(grantsFor("anonymous"), "create", posts)).toBe(false);
  });

  it("returns true for inherited grants via hierarchy", () => {
    expect(can(grantsFor("user"), "read", posts)).toBe(true);
  });

  it("returns true when manage grant covers the action", () => {
    expect(can(grantsFor("admin"), "delete", auditLogs)).toBe(true);
  });

  it("returns true when 'all' subject matches any table", () => {
    expect(can(grantsFor("admin"), "create", comments)).toBe(true);
  });

  it("returns false for unrelated table", () => {
    expect(can(grantsFor("anonymous"), "read", auditLogs)).toBe(false);
  });

  it("returns false for empty grants array", () => {
    expect(can([], "read", posts)).toBe(false);
  });

  describe("string subject form", () => {
    it("matches when grant uses object and call uses string", () => {
      // user has create:posts grant via an object subject
      expect(can(grantsFor("user"), "create", "posts")).toBe(true);
    });

    it("matches when grant uses string and call uses object", () => {
      // Build a permissions set whose grants use string subjects
      const stringPerms = definePermissions({
        roles: ["author"] as const,
        grants: {
          author: [grant("create", "posts")],
        },
      });
      const g = resolveGrants(stringPerms, ["author"]);
      // Calling with the matching object form should succeed
      expect(can(g, "create", posts)).toBe(true);
    });

    it("string and object forms produce equivalent answers", () => {
      const g = grantsFor("user");
      expect(can(g, "create", posts)).toBe(can(g, "create", "posts"));
      expect(can(g, "delete", auditLogs)).toBe(can(g, "delete", "audit_logs"));
    });

    it("returns false for unknown string table", () => {
      expect(can(grantsFor("user"), "create", "nonexistent_table")).toBe(false);
    });

    it("manage:'all' grant matches string subjects", () => {
      expect(can(grantsFor("admin"), "delete", "audit_logs")).toBe(true);
    });

    it("constrains string subjects to known table names when generic supplied", () => {
      type Schema = { posts: typeof posts; comments: typeof comments };
      const g = grantsFor("admin");
      // Both of these are valid keys of Schema
      expect(can<Schema>(g, "read", "posts")).toBe(true);
      expect(can<Schema>(g, "read", "comments")).toBe(true);
      // @ts-expect-error - "unknownTable" is not a key of Schema
      expect(can<Schema>(g, "read", "unknownTable")).toBe(true);
    });
  });
});
