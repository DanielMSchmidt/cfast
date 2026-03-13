import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createRoleManager } from "@cfast/auth";
import {
  applyAuthMigrations,
  resetAuthTables,
  seedAuthUser,
} from "../helpers/auth-tables";

describe("role-management", () => {
  beforeAll(async () => {
    await applyAuthMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetAuthTables(env.DB);
    await seedAuthUser(env.DB, {
      id: "user-1",
      email: "user1@test.com",
      name: "User One",
    });
    await seedAuthUser(env.DB, {
      id: "user-2",
      email: "user2@test.com",
      name: "User Two",
    });
  });

  it("setRole assigns a role and getRoles retrieves it", async () => {
    const manager = createRoleManager(env.DB);

    await manager.setRole("user-1", "editor");
    const roles = await manager.getRoles("user-1");

    expect(roles).toEqual(["editor"]);
  });

  it("setRoles assigns multiple roles atomically", async () => {
    const manager = createRoleManager(env.DB);

    await manager.setRoles("user-1", ["admin", "editor", "user"]);
    const roles = await manager.getRoles("user-1");

    expect(roles).toHaveLength(3);
    expect(roles.sort()).toEqual(["admin", "editor", "user"]);
  });

  it("removeRole removes a specific role", async () => {
    const manager = createRoleManager(env.DB);

    // Set up two roles
    await manager.setRoles("user-1", ["admin", "editor"]);

    // Remove one
    await manager.removeRole("user-1", "editor");
    const roles = await manager.getRoles("user-1");

    expect(roles).toEqual(["admin"]);
  });

  it("getRoles returns empty array for user with no roles", async () => {
    const manager = createRoleManager(env.DB);

    const roles = await manager.getRoles("user-2");

    expect(roles).toEqual([]);
  });
});
