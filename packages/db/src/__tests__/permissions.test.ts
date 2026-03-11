import { describe, it, expect } from "vitest";
import { resolvePermissionFilters, checkOperationPermissions } from "../permissions";
import { posts, grantsForRole } from "./helpers";

describe("resolvePermissionFilters", () => {
  it("returns where clauses for a role+table from resolved grants", () => {
    const user = { id: "user-1" };
    const filters = resolvePermissionFilters(grantsForRole("anonymous"), user, "read", posts);
    expect(filters).toHaveLength(1);
  });

  it("returns empty array when grant has no where clause (unrestricted)", () => {
    const user = { id: "user-1" };
    const filters = resolvePermissionFilters(grantsForRole("editor"), user, "read", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns empty array for manage all grant", () => {
    const user = { id: "user-1" };
    const filters = resolvePermissionFilters(grantsForRole("admin"), user, "read", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns where clause for user update on own posts", () => {
    const user = { id: "user-1" };
    const filters = resolvePermissionFilters(grantsForRole("user"), user, "update", posts);
    expect(filters).toHaveLength(1);
  });

  it("returns empty for editor update (unrestricted)", () => {
    const user = { id: "editor-1" };
    const filters = resolvePermissionFilters(grantsForRole("editor"), user, "update", posts);
    expect(filters).toHaveLength(0);
  });

  it("returns empty for action with no matching grants", () => {
    const user = { id: "user-1" };
    const filters = resolvePermissionFilters(grantsForRole("anonymous"), user, "delete", posts);
    expect(filters).toHaveLength(0);
  });
});

describe("checkOperationPermissions", () => {
  it("throws ForbiddenError when role lacks permission", () => {
    expect(() =>
      checkOperationPermissions(grantsForRole("anonymous"), [
        { action: "create", table: posts },
      ]),
    ).toThrow("cannot create");
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
