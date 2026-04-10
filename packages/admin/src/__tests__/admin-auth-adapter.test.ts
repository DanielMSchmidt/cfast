import { describe, it, expect, vi } from "vitest";
import { createAdminAuthAdapter } from "../admin-auth-adapter";

function mockAuthInstance() {
  const getRoles = vi.fn().mockResolvedValue(["admin"]);
  const setRole = vi.fn().mockResolvedValue(undefined);
  const setRoles = vi.fn().mockResolvedValue(undefined);
  const removeRole = vi.fn().mockResolvedValue(undefined);

  return {
    requireUser: vi.fn().mockResolvedValue({
      user: {
        id: "u1",
        email: "admin@example.com",
        name: "Admin User",
        avatarUrl: "https://example.com/avatar.jpg",
        roles: ["admin", "editor"],
      },
      grants: [{ action: "manage" as const, subject: "all" as const }],
    }),
    getRoles,
    setRole,
    setRoles,
    removeRole,
  };
}

describe("createAdminAuthAdapter", () => {
  it("returns an object with all AdminAuthConfig methods", () => {
    const auth = mockAuthInstance();
    const config = createAdminAuthAdapter({ getAuth: () => auth });

    expect(config).toHaveProperty("requireUser");
    expect(config).toHaveProperty("hasRole");
    expect(config).toHaveProperty("getRoles");
    expect(config).toHaveProperty("setRole");
    expect(config).toHaveProperty("removeRole");
    expect(config).toHaveProperty("setRoles");
  });

  describe("requireUser", () => {
    it("delegates to auth.requireUser and maps to AdminUser shape", async () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      const request = new Request("https://example.com/admin");
      const result = await config.requireUser(request);

      expect(auth.requireUser).toHaveBeenCalledWith(request);
      expect(result.user).toEqual({
        id: "u1",
        email: "admin@example.com",
        name: "Admin User",
        avatarUrl: "https://example.com/avatar.jpg",
        roles: ["admin", "editor"],
      });
      expect(result.grants).toHaveLength(1);
    });

    it("defaults avatarUrl to null when not present", async () => {
      const auth = mockAuthInstance();
      (auth.requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: "u2", email: "b@b.com", name: "Bob", roles: ["viewer"] },
        grants: [],
      });
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      const result = await config.requireUser(
        new Request("https://example.com/admin"),
      );
      expect(result.user.avatarUrl).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("returns true when user has the role", () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      const user = {
        id: "u1",
        email: "a@b.com",
        name: "Admin",
        avatarUrl: null,
        roles: ["admin", "editor"],
      };
      expect(config.hasRole(user, "admin")).toBe(true);
      expect(config.hasRole(user, "editor")).toBe(true);
    });

    it("returns false when user does not have the role", () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      const user = {
        id: "u1",
        email: "a@b.com",
        name: "User",
        avatarUrl: null,
        roles: ["viewer"],
      };
      expect(config.hasRole(user, "admin")).toBe(false);
    });
  });

  describe("getRoles", () => {
    it("delegates to auth.getRoles", async () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      const roles = await config.getRoles("u1");
      expect(auth.getRoles).toHaveBeenCalledWith("u1");
      expect(roles).toEqual(["admin"]);
    });
  });

  describe("setRole", () => {
    it("delegates to auth.setRole", async () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      await config.setRole("u1", "editor");
      expect(auth.setRole).toHaveBeenCalledWith("u1", "editor");
    });
  });

  describe("removeRole", () => {
    it("delegates to auth.removeRole", async () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      await config.removeRole("u1", "editor");
      expect(auth.removeRole).toHaveBeenCalledWith("u1", "editor");
    });
  });

  describe("setRoles", () => {
    it("delegates to auth.setRoles", async () => {
      const auth = mockAuthInstance();
      const config = createAdminAuthAdapter({ getAuth: () => auth });

      await config.setRoles("u1", ["admin", "editor"]);
      expect(auth.setRoles).toHaveBeenCalledWith("u1", ["admin", "editor"]);
    });
  });

  describe("getAuth factory is called per invocation", () => {
    it("calls factory on each method invocation", async () => {
      const auth = mockAuthInstance();
      const factory = vi.fn(() => auth);
      const config = createAdminAuthAdapter({ getAuth: factory });

      const request = new Request("https://example.com/admin");
      await config.requireUser(request);
      await config.getRoles("u1");
      await config.setRole("u1", "editor");
      await config.removeRole("u1", "editor");
      await config.setRoles("u1", ["admin"]);

      expect(factory).toHaveBeenCalledTimes(5);
    });
  });
});
