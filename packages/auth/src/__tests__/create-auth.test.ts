import { describe, it, expect } from "vitest";
import { createAuth } from "../create-auth";
import { createMockD1, testPermissions } from "./helpers";

describe("createAuth", () => {
  it("returns a factory function", () => {
    const factory = createAuth({ permissions: testPermissions });
    expect(typeof factory).toBe("function");
  });

  it("factory returns an AuthInstance", () => {
    const factory = createAuth({ permissions: testPermissions });
    const d1 = createMockD1();
    const auth = factory({ d1, appUrl: "https://example.com" });

    expect(typeof auth.createContext).toBe("function");
    expect(typeof auth.requireUser).toBe("function");
    expect(typeof auth.getRoles).toBe("function");
    expect(typeof auth.setRole).toBe("function");
    expect(typeof auth.setRoles).toBe("function");
    expect(typeof auth.removeRole).toBe("function");
    expect(auth.api).toBeNull();
  });

  describe("createContext", () => {
    it("returns anonymous context with no session", async () => {
      const factory = createAuth({
        permissions: testPermissions,
        anonymousRoles: ["anonymous"],
      });
      const d1 = createMockD1();
      const auth = factory({ d1, appUrl: "https://example.com" });

      const request = new Request("https://example.com/some-page");
      const ctx = await auth.createContext(request);

      expect(ctx.user).toBeNull();
      expect(ctx.grants).toEqual([]);
    });

    it("resolves grants for anonymous roles", async () => {
      const factory = createAuth({
        permissions: testPermissions,
        anonymousRoles: ["user"],
      });
      const d1 = createMockD1();
      const auth = factory({ d1, appUrl: "https://example.com" });

      const request = new Request("https://example.com/some-page");
      const ctx = await auth.createContext(request);

      expect(ctx.user).toBeNull();
      expect(ctx.grants).toHaveLength(1);
      expect(ctx.grants[0].action).toBe("read");
      expect(ctx.grants[0].subject).toBe("all");
    });
  });

  describe("requireUser", () => {
    it("throws a 302 Response when no user", async () => {
      const factory = createAuth({
        permissions: testPermissions,
      });
      const d1 = createMockD1();
      const auth = factory({ d1, appUrl: "https://example.com" });

      const request = new Request("https://example.com/dashboard");

      try {
        await auth.requireUser(request);
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(Response);
        const response = e as Response;
        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/login");
      }
    });

    it("redirects to custom loginPath", async () => {
      const factory = createAuth({
        permissions: testPermissions,
        redirects: { loginPath: "/auth/signin" },
      });
      const d1 = createMockD1();
      const auth = factory({ d1, appUrl: "https://example.com" });

      const request = new Request("https://example.com/dashboard");

      try {
        await auth.requireUser(request);
        expect.fail("should have thrown");
      } catch (e) {
        const response = e as Response;
        expect(response.headers.get("Location")).toBe("/auth/signin");
      }
    });

    it("sets cfast_redirect_to cookie with correct attributes", async () => {
      const factory = createAuth({
        permissions: testPermissions,
      });
      const d1 = createMockD1();
      const auth = factory({ d1, appUrl: "https://example.com" });

      const request = new Request("https://example.com/dashboard/settings");

      try {
        await auth.requireUser(request);
        expect.fail("should have thrown");
      } catch (e) {
        const response = e as Response;
        const cookie = response.headers.get("Set-Cookie");
        expect(cookie).toContain("cfast_redirect_to=%2Fdashboard%2Fsettings");
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Secure");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Max-Age=600");
        expect(cookie).toContain("Path=/");
      }
    });
  });
});
