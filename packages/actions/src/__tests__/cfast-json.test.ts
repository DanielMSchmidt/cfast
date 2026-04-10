import { describe, it, expect } from "vitest";
import { cfastJson } from "../cfast-json";
import { definePermissions, resolveGrants, grant } from "@cfast/permissions";
import type { DrizzleTable } from "@cfast/permissions";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");
const posts: DrizzleTable = { [DRIZZLE_NAME]: "posts" };
const comments: DrizzleTable = { [DRIZZLE_NAME]: "comments" };

const schema = { posts, comments } as Record<string, DrizzleTable>;

const permissions = definePermissions({
  roles: ["reader", "author", "admin"] as const,
  hierarchy: { author: ["reader"], admin: ["author"] },
  grants: {
    reader: [grant("read", posts), grant("read", comments)],
    author: [grant("create", posts), grant("create", comments)],
    admin: [grant("manage", "all")],
  },
});

function grantsFor(role: string) {
  return resolveGrants(permissions, [role]);
}

describe("cfastJson", () => {
  it("embeds _tablePerms from resolveTablePermissions", () => {
    const result = cfastJson(grantsFor("reader"), schema, { posts: [] });

    expect(result._tablePerms).toBeDefined();
    expect(result._tablePerms.posts).toEqual({
      read: true,
      create: false,
      update: false,
      delete: false,
    });
    expect(result._tablePerms.comments).toEqual({
      read: true,
      create: false,
      update: false,
      delete: false,
    });
  });

  it("serializes Date values to ISO strings", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    const result = cfastJson(grantsFor("reader"), schema, {
      posts: [{ id: "1", title: "Hello", createdAt: date }],
    });

    expect((result.posts as unknown[])[0]).toEqual(
      expect.objectContaining({
        id: "1",
        title: "Hello",
        createdAt: "2025-01-15T10:30:00.000Z",
      }),
    );
  });

  it("passes through non-Date fields unchanged", () => {
    const result = cfastJson(grantsFor("reader"), schema, {
      count: 42,
      title: "hello",
      active: true,
    });

    expect(result.count).toBe(42);
    expect(result.title).toBe("hello");
    expect(result.active).toBe(true);
  });

  it("annotates arrays with a non-enumerable _tableName when key matches schema", () => {
    const result = cfastJson(grantsFor("reader"), schema, {
      posts: [{ id: "1" }],
    });

    // Non-enumerable: should not appear in JSON or Object.keys
    expect(Object.keys(result.posts as unknown[])).not.toContain("_tableName");
    // But accessible directly
    expect((result.posts as unknown as { _tableName: string })._tableName).toBe("posts");
  });

  it("does not annotate arrays whose key does not match any schema table", () => {
    const result = cfastJson(grantsFor("reader"), schema, {
      tags: ["a", "b"],
    });

    expect((result.tags as unknown as { _tableName?: string })._tableName).toBeUndefined();
  });

  it("admin gets full CRUD on all tables", () => {
    const result = cfastJson(grantsFor("admin"), schema, {});

    expect(result._tablePerms.posts).toEqual({
      read: true,
      create: true,
      update: true,
      delete: true,
    });
  });

  it("preserves original data fields alongside _tablePerms", () => {
    const result = cfastJson(grantsFor("reader"), schema, {
      posts: [{ id: "1" }],
      total: 1,
    });

    expect(result.total).toBe(1);
    expect((result.posts as unknown[])[0]).toEqual(expect.objectContaining({ id: "1" }));
    expect(result._tablePerms).toBeDefined();
  });
});
