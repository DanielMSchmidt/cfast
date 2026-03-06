import { describe, it, expect } from "vitest";
import { resolvePermissionFilters, checkOperationPermissions } from "../permissions";
import { testPermissions, posts } from "./helpers";
import type { TestUser } from "./helpers";

describe("resolvePermissionFilters", () => {
  it("returns where clauses for a role+table from resolved grants", () => {
    const user: TestUser = { id: "user-1", role: "anonymous" };
    const filters = resolvePermissionFilters(testPermissions, user, "read", posts);
    expect(filters).toHaveLength(1);
  });

  it("returns empty array when grant has no where clause (unrestricted)", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const filters = resolvePermissionFilters(testPermissions, user, "read", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns empty array for manage all grant", () => {
    const user: TestUser = { id: "user-1", role: "admin" };
    const filters = resolvePermissionFilters(testPermissions, user, "read", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns where clause for user update on own posts", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    const filters = resolvePermissionFilters(testPermissions, user, "update", posts);
    expect(filters).toHaveLength(1);
  });

  it("returns empty for editor update (unrestricted)", () => {
    const user: TestUser = { id: "editor-1", role: "editor" };
    const filters = resolvePermissionFilters(testPermissions, user, "update", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns empty for action with no matching grants", () => {
    const user: TestUser = { id: "user-1", role: "anonymous" };
    const filters = resolvePermissionFilters(testPermissions, user, "delete", posts);
    expect(filters).toHaveLength(0);
  });
});

describe("checkOperationPermissions", () => {
  it("throws ForbiddenError when role lacks permission", () => {
    const user: TestUser = { id: "user-1", role: "anonymous" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, [
        { action: "create", table: posts },
      ]),
    ).toThrow("cannot create");
  });

  it("does not throw when role has permission", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, [
        { action: "create", table: posts },
      ]),
    ).not.toThrow();
  });

  it("throws when any descriptor is denied", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, [
        { action: "create", table: posts },
        { action: "delete", table: posts },
      ]),
    ).toThrow();
  });

  it("does not throw for empty descriptors", () => {
    const user: TestUser = { id: "user-1", role: "anonymous" };
    expect(() =>
      checkOperationPermissions(testPermissions, user, []),
    ).not.toThrow();
  });

  it("uses 'anonymous' role when user is null", () => {
    expect(() =>
      checkOperationPermissions(testPermissions, null, [
        { action: "create", table: posts },
      ]),
    ).toThrow();
  });
});
