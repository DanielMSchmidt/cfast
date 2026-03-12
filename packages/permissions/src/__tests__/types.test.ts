import { describe, it, expect, expectTypeOf } from "vitest";
import { getTableName } from "../types";
import type {
  PermissionAction,
  CrudAction,
  Grant,
  PermissionDescriptor,
  PermissionCheckResult,
} from "../types";

describe("types", () => {
  it("PermissionAction includes manage and all CRUD actions", () => {
    expectTypeOf<PermissionAction>().toEqualTypeOf<
      "read" | "create" | "update" | "delete" | "manage"
    >();
  });

  it("CrudAction excludes manage", () => {
    expectTypeOf<CrudAction>().toEqualTypeOf<
      "read" | "create" | "update" | "delete"
    >();
  });

  it("Grant has action, subject, and optional where", () => {
    expectTypeOf<Grant>().toHaveProperty("action");
    expectTypeOf<Grant>().toHaveProperty("subject");
  });

  it("PermissionDescriptor has action and table", () => {
    expectTypeOf<PermissionDescriptor>().toHaveProperty("action");
    expectTypeOf<PermissionDescriptor>().toHaveProperty("table");
  });

  it("PermissionCheckResult has permitted, denied, and reasons", () => {
    expectTypeOf<PermissionCheckResult>().toHaveProperty("permitted");
    expectTypeOf<PermissionCheckResult>().toHaveProperty("denied");
    expectTypeOf<PermissionCheckResult>().toHaveProperty("reasons");
  });
});

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

function mockTable(name: string) {
  return { [DRIZZLE_NAME_SYMBOL]: name };
}

describe("getTableName", () => {
  it("reads name from a Drizzle table via Symbol.for('drizzle:Name')", () => {
    const table = mockTable("posts");
    expect(getTableName(table)).toBe("posts");
  });

  it("returns different names for different tables", () => {
    const posts = mockTable("posts");
    const comments = mockTable("comments");
    expect(getTableName(posts)).toBe("posts");
    expect(getTableName(comments)).toBe("comments");
  });

  it("returns 'unknown' when the Symbol is not present", () => {
    const noSymbol = { someOtherProp: "value" };
    expect(getTableName(noSymbol)).toBe("unknown");
  });

  it("returns 'unknown' when the Symbol value is undefined", () => {
    const undefinedSymbol = { [DRIZZLE_NAME_SYMBOL]: undefined };
    expect(getTableName(undefinedSymbol)).toBe("unknown");
  });

  it("returns the same name for two separate objects with the same Symbol value", () => {
    const tableA = mockTable("users");
    const tableB = mockTable("users");
    expect(tableA).not.toBe(tableB); // different references
    expect(getTableName(tableA)).toBe(getTableName(tableB));
  });

  it("handles empty string name", () => {
    const table = mockTable("");
    expect(getTableName(table)).toBe("");
  });
});
