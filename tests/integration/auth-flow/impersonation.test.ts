import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createAuth } from "@cfast/auth";
import { definePermissions, grant } from "@cfast/permissions";
import {
  applyAuthMigrations,
  resetAuthTables,
  seedAuthUser,
} from "../helpers/auth-tables";

const permissions = definePermissions({
  roles: ["anonymous", "user", "admin"] as const,
  grants: {
    anonymous: [],
    user: [],
    admin: [grant("manage", "all")],
  },
});

function createTestAuthInstance() {
  const initAuth = createAuth({
    permissions,
    anonymousRoles: ["anonymous"],
    defaultRoles: ["user"],
    impersonation: { allowedRoles: ["admin"] },
  });
  return initAuth({ d1: env.DB, appUrl: env.APP_URL });
}

describe("impersonation", () => {
  beforeAll(async () => {
    await applyAuthMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetAuthTables(env.DB);
    await seedAuthUser(env.DB, {
      id: "admin-1",
      email: "admin@test.com",
      name: "Admin",
    });
    await seedAuthUser(env.DB, {
      id: "regular-1",
      email: "regular@test.com",
      name: "Regular",
    });
  });

  it("admin can impersonate another user and audit log is created", async () => {
    const auth = createTestAuthInstance();

    // Give admin-1 the admin role so impersonation is allowed
    await auth.setRole("admin-1", "admin");

    // Impersonate regular-1
    await auth.impersonate("admin-1", "regular-1");

    // Verify an impersonation log row was created
    const log = await env.DB.prepare(
      "SELECT * FROM impersonation_logs WHERE admin_id = ? AND target_user_id = ?",
    )
      .bind("admin-1", "regular-1")
      .first();

    expect(log).not.toBeNull();
    expect(log!.admin_id).toBe("admin-1");
    expect(log!.target_user_id).toBe("regular-1");
    expect(log!.started_at).toBeDefined();
    // Active impersonation has no ended_at
    expect(log!.ended_at).toBeNull();
  });

  it("non-admin cannot impersonate", async () => {
    const auth = createTestAuthInstance();

    // regular-1 has no roles assigned, so getRoles returns [].
    // The impersonate method checks whether any of the caller's roles
    // are in allowedRoles (["admin"]) — none match, so it rejects.

    await expect(
      auth.impersonate("regular-1", "admin-1"),
    ).rejects.toThrow("Not authorized to impersonate");

    // Verify no impersonation log was created
    const logs = await env.DB.prepare(
      "SELECT * FROM impersonation_logs",
    ).all();
    expect(logs.results).toHaveLength(0);
  });
});
