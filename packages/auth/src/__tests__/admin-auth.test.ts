import { describe, it, expect, vi } from "vitest";
import { createAdminAuth } from "../admin-auth";

describe("createAdminAuth", () => {
  function mockAuthInstance() {
    const getRoles = vi.fn().mockResolvedValue(["admin"]);
    const setRole = vi.fn().mockResolvedValue(undefined);
    const setRoles = vi.fn().mockResolvedValue(undefined);
    const removeRole = vi.fn().mockResolvedValue(undefined);
    return {
      createContext: vi.fn().mockResolvedValue({
        user: { id: "u1", email: "a@b.com", name: "Admin", avatarUrl: null, roles: ["admin"] },
        grants: [{ action: "manage" as const, subject: "all" as const }],
      }),
      requireUser: vi.fn().mockResolvedValue({
        user: { id: "u1", email: "a@b.com", name: "Admin", avatarUrl: null, roles: ["admin"] },
        grants: [{ action: "manage" as const, subject: "all" as const }],
      }),
      // Grouped roles namespace (the recommended surface) reuses the same
      // mock spies as the legacy top-level aliases so existing delegation
      // assertions keep working without duplicating expectations.
      roles: {
        get: getRoles,
        set: setRole,
        setAll: setRoles,
        remove: removeRole,
      },
      getRoles,
      setRole,
      setRoles,
      removeRole,
      impersonate: vi.fn().mockResolvedValue(undefined),
      stopImpersonating: vi.fn().mockResolvedValue(undefined),
      handler: vi.fn(),
      sendMagicLink: vi.fn(),
      api: {},
    };
  }

  it("returns an object with all AdminAuthConfig methods", () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    expect(config).toHaveProperty("requireUser");
    expect(config).toHaveProperty("hasRole");
    expect(config).toHaveProperty("getRoles");
    expect(config).toHaveProperty("setRole");
    expect(config).toHaveProperty("removeRole");
    expect(config).toHaveProperty("setRoles");
  });

  it("requireUser delegates to authInstance.requireUser", async () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    const request = new Request("https://example.com");
    const result = await config.requireUser(request);

    expect(auth.requireUser).toHaveBeenCalledWith(request);
    expect(result.user.id).toBe("u1");
    expect(result.grants).toHaveLength(1);
  });

  it("hasRole returns true for matching role", () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    const user = { id: "u1", email: "a@b.com", name: "Admin", avatarUrl: null, roles: ["admin", "editor"] };
    expect(config.hasRole(user, "admin")).toBe(true);
    expect(config.hasRole(user, "viewer")).toBe(false);
  });

  it("getRoles delegates to authInstance.getRoles", async () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    const roles = await config.getRoles("u1");
    expect(auth.getRoles).toHaveBeenCalledWith("u1");
    expect(roles).toEqual(["admin"]);
  });

  it("setRole delegates to authInstance.setRole", async () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    await config.setRole("u1", "editor");
    expect(auth.setRole).toHaveBeenCalledWith("u1", "editor");
  });

  it("setRoles delegates to authInstance.setRoles", async () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    await config.setRoles("u1", ["admin", "editor"]);
    expect(auth.setRoles).toHaveBeenCalledWith("u1", ["admin", "editor"]);
  });

  it("removeRole delegates to authInstance.removeRole", async () => {
    const auth = mockAuthInstance();
    const config = createAdminAuth(() => auth);

    await config.removeRole("u1", "editor");
    expect(auth.removeRole).toHaveBeenCalledWith("u1", "editor");
  });

  it("calls factory per invocation (lazy)", async () => {
    const auth = mockAuthInstance();
    const factory = vi.fn(() => auth);
    const config = createAdminAuth(factory);

    const request = new Request("https://example.com");
    await config.requireUser(request);
    await config.getRoles("u1");

    expect(factory).toHaveBeenCalledTimes(2);
  });
});
