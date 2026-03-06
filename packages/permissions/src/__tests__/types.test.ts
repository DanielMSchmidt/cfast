import { describe, it, expectTypeOf } from "vitest";
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
