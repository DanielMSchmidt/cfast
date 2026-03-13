import { describe, it, expect } from "vitest";
import { checkPermissions } from "../check";
import { definePermissions } from "../define-permissions";
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

describe("checkPermissions", () => {
  it("permits when role has the exact grant", () => {
    const result = checkPermissions("user", permissions, [
      { action: "create", table: posts },
    ]);
    expect(result.permitted).toBe(true);
    expect(result.denied).toEqual([]);
    expect(result.reasons).toEqual([]);
  });

  it("denies when role lacks the grant", () => {
    const result = checkPermissions("anonymous", permissions, [
      { action: "create", table: posts },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(1);
    expect(result.denied[0].action).toBe("create");
    expect(result.reasons).toHaveLength(1);
  });

  it("checks all descriptors — all must pass", () => {
    const result = checkPermissions("user", permissions, [
      { action: "create", table: posts },
      { action: "create", table: comments },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("fails if any descriptor is denied", () => {
    const result = checkPermissions("user", permissions, [
      { action: "create", table: posts },
      { action: "delete", table: posts },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(1);
    expect(result.denied[0].action).toBe("delete");
  });

  it("respects role hierarchy — inherited grants work", () => {
    const result = checkPermissions("user", permissions, [
      { action: "read", table: posts },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("manage grants match any CRUD action", () => {
    const result = checkPermissions("admin", permissions, [
      { action: "read", table: posts },
      { action: "create", table: posts },
      { action: "update", table: comments },
      { action: "delete", table: auditLogs },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("'all' subject matches any table", () => {
    const result = checkPermissions("admin", permissions, [
      { action: "create", table: auditLogs },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("returns reasons for each denied descriptor", () => {
    const result = checkPermissions("anonymous", permissions, [
      { action: "create", table: posts },
      { action: "delete", table: comments },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(2);
    expect(result.reasons).toHaveLength(2);
    expect(result.reasons[0]).toContain("anonymous");
    expect(result.reasons[0]).toContain("create");
    expect(result.reasons[0]).toContain("posts");
  });

  it("permits empty descriptors array", () => {
    const result = checkPermissions("anonymous", permissions, []);
    expect(result.permitted).toBe(true);
    expect(result.denied).toEqual([]);
  });

  it("handles manage descriptor by checking for manage grant", () => {
    const result = checkPermissions("admin", permissions, [
      { action: "manage", table: posts },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("denies manage descriptor when role only has specific CRUD grants", () => {
    const result = checkPermissions("editor", permissions, [
      { action: "manage", table: posts },
    ]);
    // editor has read (inherited) + create (inherited) + update + delete = all 4 CRUD
    // having all 4 CRUD should satisfy a "manage" descriptor
    expect(result.permitted).toBe(true);
  });

  it("denies manage descriptor when role has only partial CRUD", () => {
    const result = checkPermissions("anonymous", permissions, [
      { action: "manage", table: posts },
    ]);
    // anonymous only has "read" on posts
    expect(result.permitted).toBe(false);
  });
});

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

function mockTable(name: string) {
  return { [DRIZZLE_NAME_SYMBOL]: name };
}

describe("checkPermissions — name-based table matching", () => {
  it("matches grant subject and descriptor table by Drizzle name, not reference", () => {
    // Two separate objects representing the same logical table
    const postsForGrant = mockTable("posts");
    const postsForDescriptor = mockTable("posts");
    expect(postsForGrant).not.toBe(postsForDescriptor);

    const perms = definePermissions({
      roles: ["user"] as const,
      grants: {
        user: [grant("read", postsForGrant)],
      },
    });

    const result = checkPermissions("user", perms, [
      { action: "read", table: postsForDescriptor },
    ]);
    expect(result.permitted).toBe(true);
    expect(result.denied).toEqual([]);
  });

  it("denies when table names differ, even if both are mock objects", () => {
    const postsTable = mockTable("posts");
    const commentsTable = mockTable("comments");

    const perms = definePermissions({
      roles: ["user"] as const,
      grants: {
        user: [grant("read", postsTable)],
      },
    });

    const result = checkPermissions("user", perms, [
      { action: "read", table: commentsTable },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.denied).toHaveLength(1);
  });

  it("matches with manage action across different object instances", () => {
    const postsForGrant = mockTable("posts");
    const postsForDescriptor = mockTable("posts");

    const perms = definePermissions({
      roles: ["admin"] as const,
      grants: {
        admin: [grant("manage", postsForGrant)],
      },
    });

    const result = checkPermissions("admin", perms, [
      { action: "read", table: postsForDescriptor },
      { action: "create", table: postsForDescriptor },
      { action: "update", table: postsForDescriptor },
      { action: "delete", table: postsForDescriptor },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("permits manage descriptor when all CRUD actions granted via name-match", () => {
    const tblA = mockTable("items");
    const tblB = mockTable("items");

    const perms = definePermissions({
      roles: ["editor"] as const,
      grants: {
        editor: [
          grant("read", tblA),
          grant("create", tblA),
          grant("update", tblA),
          grant("delete", tblA),
        ],
      },
    });

    const result = checkPermissions("editor", perms, [
      { action: "manage", table: tblB },
    ]);
    expect(result.permitted).toBe(true);
  });

  it("reason messages include the table name from the descriptor", () => {
    const tblForGrant = mockTable("posts");
    const tblForDescriptor = mockTable("orders");

    const perms = definePermissions({
      roles: ["user"] as const,
      grants: {
        user: [grant("read", tblForGrant)],
      },
    });

    const result = checkPermissions("user", perms, [
      { action: "create", table: tblForDescriptor },
    ]);
    expect(result.permitted).toBe(false);
    expect(result.reasons[0]).toContain("orders");
  });
});
