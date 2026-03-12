import { describe, it, expect } from "vitest";
import { createRoleManager } from "../roles";
import { createMockD1 } from "./helpers";

describe("roleGrants validation", () => {
  const roleGrants: Record<string, string[]> = {
    admin: ["admin", "editor", "reader"],
    editor: ["reader"],
  };

  it("allows setRole when caller has permission", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    await expect(
      rm.setRole("user-1", "editor", { callerRoles: ["admin"] }),
    ).resolves.toBeUndefined();
  });

  it("rejects setRole when caller lacks permission", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    await expect(
      rm.setRole("user-1", "admin", { callerRoles: ["editor"] }),
    ).rejects.toThrow(/not authorized/i);
  });

  it("allows setRole without callerRoles (backward compat)", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    await expect(rm.setRole("user-1", "admin")).resolves.toBeUndefined();
  });

  it("rejects setRoles when any target role is not allowed", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    await expect(
      rm.setRoles("user-1", ["editor", "admin"], { callerRoles: ["editor"] }),
    ).rejects.toThrow(/not authorized/i);
  });

  it("allows setRoles when all target roles are allowed", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    await expect(
      rm.setRoles("user-1", ["reader"], { callerRoles: ["editor"] }),
    ).resolves.toBeUndefined();
  });

  it("allows any role when no roleGrants configured", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await expect(
      rm.setRole("user-1", "admin", { callerRoles: ["reader"] }),
    ).resolves.toBeUndefined();
  });

  it("checks all caller roles for permission", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    // reader has no entry in roleGrants, but admin does
    await expect(
      rm.setRole("user-1", "editor", { callerRoles: ["reader", "admin"] }),
    ).resolves.toBeUndefined();
  });

  it("rejects when caller role exists in roleGrants but target not in allowed list", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { roleGrants });

    // editor can only assign "reader", not "editor"
    await expect(
      rm.setRole("user-1", "editor", { callerRoles: ["editor"] }),
    ).rejects.toThrow(/not authorized/i);
  });
});
