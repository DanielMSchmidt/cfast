import { describe, it, expect } from "vitest";
import { resolveTablePermissions } from "../resolve-table-permissions";
import { definePermissions } from "../define-permissions";
import { resolveGrants } from "../resolve-grants";
import { grant } from "../grant";
import type { DrizzleTable } from "../types";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");
const posts: DrizzleTable = { [DRIZZLE_NAME]: "posts" };
const comments: DrizzleTable = { [DRIZZLE_NAME]: "comments" };
const auditLogs: DrizzleTable = { [DRIZZLE_NAME]: "audit_logs" };

const schema = { posts, comments, auditLogs } as Record<string, DrizzleTable>;

const permissions = definePermissions({
  roles: ["anonymous", "author", "admin"] as const,
  hierarchy: {
    author: ["anonymous"],
    admin: ["author"],
  },
  grants: {
    anonymous: [grant("read", posts)],
    author: [grant("create", posts), grant("read", comments), grant("create", comments)],
    admin: [grant("manage", "all")],
  },
});

function grantsFor(role: string) {
  return resolveGrants(permissions, [role]);
}

describe("resolveTablePermissions", () => {
  it("returns CRUD booleans for every table in the schema", () => {
    const result = resolveTablePermissions(grantsFor("anonymous"), schema);

    expect(Object.keys(result).sort()).toEqual(["audit_logs", "comments", "posts"]);
    expect(result.posts).toEqual({ read: true, create: false, update: false, delete: false });
    expect(result.comments).toEqual({ read: false, create: false, update: false, delete: false });
    expect(result.audit_logs).toEqual({ read: false, create: false, update: false, delete: false });
  });

  it("includes inherited grants via hierarchy", () => {
    const result = resolveTablePermissions(grantsFor("author"), schema);

    expect(result.posts).toEqual({ read: true, create: true, update: false, delete: false });
    expect(result.comments).toEqual({ read: true, create: true, update: false, delete: false });
  });

  it("manage:all grants full CRUD on every table", () => {
    const result = resolveTablePermissions(grantsFor("admin"), schema);

    for (const tableName of Object.keys(result)) {
      expect(result[tableName]).toEqual({ read: true, create: true, update: true, delete: true });
    }
  });

  it("returns an empty map for an empty schema", () => {
    const result = resolveTablePermissions(grantsFor("admin"), {});
    expect(result).toEqual({});
  });

  it("returns all false for empty grants", () => {
    const result = resolveTablePermissions([], schema);

    for (const tableName of Object.keys(result)) {
      expect(result[tableName]).toEqual({ read: false, create: false, update: false, delete: false });
    }
  });

  it("skips non-table entries in schema (no drizzle:Name symbol)", () => {
    const schemaWithRelations = {
      posts,
      // Relations objects don't have the drizzle:Name symbol
      postsRelations: { someField: true } as unknown as DrizzleTable,
    } as Record<string, DrizzleTable>;

    const result = resolveTablePermissions(grantsFor("admin"), schemaWithRelations);
    // Should only have "posts", not "unknown"
    expect(Object.keys(result)).toEqual(["posts"]);
  });

  it("deduplicates when multiple JS keys map to the same SQL name", () => {
    const duplicateSchema = {
      posts,
      postsAlias: posts, // same object, same drizzle:Name
    } as Record<string, DrizzleTable>;

    const result = resolveTablePermissions(grantsFor("author"), duplicateSchema);
    expect(Object.keys(result)).toEqual(["posts"]);
  });
});
