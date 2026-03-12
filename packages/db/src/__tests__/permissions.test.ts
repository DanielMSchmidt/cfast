import { describe, it, expect } from "vitest";
import { resolvePermissionFilters, checkOperationPermissions } from "../permissions";
import { posts, grantsForRole } from "./helpers";

describe("resolvePermissionFilters", () => {
  it("returns where clauses for a role+table from resolved grants", () => {

    const filters = resolvePermissionFilters(grantsForRole("anonymous"), "read", posts);
    expect(filters).toHaveLength(1);
  });

  it("returns empty array when grant has no where clause (unrestricted)", () => {

    const filters = resolvePermissionFilters(grantsForRole("editor"), "read", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns empty array for manage all grant", () => {

    const filters = resolvePermissionFilters(grantsForRole("admin"), "read", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns where clause for user update on own posts", () => {

    const filters = resolvePermissionFilters(grantsForRole("user"), "update", posts);
    expect(filters).toHaveLength(1);
  });

  it("returns empty for editor update (unrestricted)", () => {

    const filters = resolvePermissionFilters(grantsForRole("editor"), "update", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns empty for action with no matching grants", () => {

    const filters = resolvePermissionFilters(grantsForRole("anonymous"), "delete", posts);
    expect(filters).toHaveLength(0);
  });
});

describe("checkOperationPermissions", () => {
  it("throws ForbiddenError when role lacks permission", () => {
    expect(() =>
      checkOperationPermissions(grantsForRole("anonymous"), [
        { action: "create", table: posts },
      ]),
    ).toThrow("Cannot create");
  });

  it("does not throw when role has permission", () => {
    expect(() =>
      checkOperationPermissions(grantsForRole("user"), [
        { action: "create", table: posts },
      ]),
    ).not.toThrow();
  });

  it("throws when any descriptor is denied", () => {
    expect(() =>
      checkOperationPermissions(grantsForRole("user"), [
        { action: "create", table: posts },
        { action: "delete", table: posts },
      ]),
    ).toThrow();
  });

  it("does not throw for empty descriptors", () => {
    expect(() =>
      checkOperationPermissions(grantsForRole("anonymous"), []),
    ).not.toThrow();
  });

  it("uses empty grants when user is null (no grants)", () => {
    expect(() =>
      checkOperationPermissions([], [
        { action: "create", table: posts },
      ]),
    ).toThrow();
  });
});

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

function mockTable(name: string) {
  return { [DRIZZLE_NAME_SYMBOL]: name };
}

describe("resolvePermissionFilters — name-based table matching", () => {
  it("matches grant subject and filter table by Drizzle name, not reference", () => {
    const postsA = mockTable("posts");
    const postsB = mockTable("posts");
    expect(postsA).not.toBe(postsB);

    const grants: import("@cfast/permissions").Grant[] = [
      {
        action: "read",
        subject: postsA,
        where: (cols: any, _user: any) => ({ getSQL: () => `${cols.published} = 1` }),
      },
    ];

    const filters = resolvePermissionFilters(grants, "read", postsB);
    expect(filters).toHaveLength(1);
  });

  it("returns empty when table names differ", () => {
    const postsTable = mockTable("posts");
    const commentsTable = mockTable("comments");

    const grants: import("@cfast/permissions").Grant[] = [
      {
        action: "read",
        subject: postsTable,
        where: (cols: any, _user: any) => ({ getSQL: () => `${cols.published} = 1` }),
      },
    ];

    const filters = resolvePermissionFilters(grants, "read", commentsTable);
    expect(filters).toHaveLength(0);
  });

  it("returns empty (unrestricted) when matching grant has no where clause via name-match", () => {
    const postsA = mockTable("posts");
    const postsB = mockTable("posts");

    const grants: import("@cfast/permissions").Grant[] = [
      { action: "read", subject: postsA },
    ];

    const filters = resolvePermissionFilters(grants, "read", postsB);
    expect(filters).toHaveLength(0); // unrestricted = empty array
  });

  it("matches manage action with different table instances sharing the same name", () => {
    const postsA = mockTable("posts");
    const postsB = mockTable("posts");

    const grants: import("@cfast/permissions").Grant[] = [
      { action: "manage", subject: postsA },
    ];

    const filters = resolvePermissionFilters(grants, "read", postsB);
    expect(filters).toHaveLength(0); // manage with no where = unrestricted
  });
});

describe("checkOperationPermissions — name-based table matching", () => {
  it("permits when grant subject and descriptor table are different objects with the same Drizzle name", () => {
    const postsA = mockTable("posts");
    const postsB = mockTable("posts");
    expect(postsA).not.toBe(postsB);

    const grants: import("@cfast/permissions").Grant[] = [
      { action: "create", subject: postsA },
    ];

    expect(() =>
      checkOperationPermissions(grants, [
        { action: "create", table: postsB },
      ]),
    ).not.toThrow();
  });

  it("throws when table names differ even though both are mock objects", () => {
    const postsTable = mockTable("posts");
    const commentsTable = mockTable("comments");

    const grants: import("@cfast/permissions").Grant[] = [
      { action: "create", subject: postsTable },
    ];

    expect(() =>
      checkOperationPermissions(grants, [
        { action: "create", table: commentsTable },
      ]),
    ).toThrow();
  });

  it("permits manage grant matching by name for all CRUD actions", () => {
    const postsA = mockTable("posts");
    const postsB = mockTable("posts");

    const grants: import("@cfast/permissions").Grant[] = [
      { action: "manage", subject: postsA },
    ];

    expect(() =>
      checkOperationPermissions(grants, [
        { action: "read", table: postsB },
        { action: "create", table: postsB },
        { action: "update", table: postsB },
        { action: "delete", table: postsB },
      ]),
    ).not.toThrow();
  });

  it("permits manage descriptor when all 4 CRUD are granted via name-matched tables", () => {
    const tblA = mockTable("items");
    const tblB = mockTable("items");

    const grants: import("@cfast/permissions").Grant[] = [
      { action: "read", subject: tblA },
      { action: "create", subject: tblA },
      { action: "update", subject: tblA },
      { action: "delete", subject: tblA },
    ];

    expect(() =>
      checkOperationPermissions(grants, [
        { action: "manage", table: tblB },
      ]),
    ).not.toThrow();
  });
});
