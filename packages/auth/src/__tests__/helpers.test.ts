import { describe, it, expect, vi } from "vitest";
import { createAuthHelpers } from "../helpers";
import type { AuthInstance, AuthUser } from "../types";

function mockAuthInstance(overrides?: Partial<AuthInstance>): AuthInstance {
  const baseUser: AuthUser = {
    id: "u1",
    email: "alice@example.com",
    name: "Alice",
    avatarUrl: null,
    roles: ["admin"],
  };

  const getRoles = vi.fn().mockResolvedValue(["admin"]);
  const setRole = vi.fn().mockResolvedValue(undefined);
  const setRoles = vi.fn().mockResolvedValue(undefined);
  const removeRole = vi.fn().mockResolvedValue(undefined);

  return {
    createContext: vi.fn().mockResolvedValue({
      user: baseUser,
      grants: [{ action: "manage" as const, subject: "all" as const }],
    }),
    requireUser: vi.fn().mockResolvedValue({
      user: baseUser,
      grants: [{ action: "manage" as const, subject: "all" as const }],
    }),
    roles: { get: getRoles, set: setRole, setAll: setRoles, remove: removeRole },
    getRoles,
    setRole,
    setRoles,
    removeRole,
    impersonate: vi.fn().mockResolvedValue(undefined),
    stopImpersonating: vi.fn().mockResolvedValue(undefined),
    handler: vi.fn(),
    sendMagicLink: vi.fn(),
    api: {},
    ...overrides,
  };
}

describe("createAuthHelpers", () => {
  it("returns all four helper functions", () => {
    const auth = mockAuthInstance();
    const helpers = createAuthHelpers({ getAuth: () => auth });

    expect(helpers).toHaveProperty("getAuthContext");
    expect(helpers).toHaveProperty("requireAuthContext");
    expect(helpers).toHaveProperty("getUser");
    expect(helpers).toHaveProperty("requireUser");
  });

  describe("getAuthContext", () => {
    it("returns user and grants when authenticated", async () => {
      const auth = mockAuthInstance();
      const { getAuthContext } = createAuthHelpers({ getAuth: () => auth });

      const request = new Request("https://example.com/dashboard");
      const result = await getAuthContext(request);

      expect(auth.createContext).toHaveBeenCalledWith(request);
      expect(result.user).not.toBeNull();
      expect(result.user!.id).toBe("u1");
      expect(result.grants).toHaveLength(1);
    });

    it("returns null user when unauthenticated", async () => {
      const auth = mockAuthInstance({
        createContext: vi.fn().mockResolvedValue({
          user: null,
          grants: [],
        }),
      });
      const { getAuthContext } = createAuthHelpers({ getAuth: () => auth });

      const request = new Request("https://example.com/");
      const result = await getAuthContext(request);

      expect(result.user).toBeNull();
      expect(result.grants).toEqual([]);
    });
  });

  describe("requireAuthContext", () => {
    it("returns user and grants when authenticated", async () => {
      const auth = mockAuthInstance();
      const { requireAuthContext } = createAuthHelpers({
        getAuth: () => auth,
      });

      const request = new Request("https://example.com/dashboard");
      const result = await requireAuthContext(request);

      expect(auth.requireUser).toHaveBeenCalledWith(request);
      expect(result.user.id).toBe("u1");
      expect(result.grants).toHaveLength(1);
    });

    it("propagates redirect when unauthenticated", async () => {
      const redirectResponse = new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
      const auth = mockAuthInstance({
        requireUser: vi.fn().mockRejectedValue(redirectResponse),
      });
      const { requireAuthContext } = createAuthHelpers({
        getAuth: () => auth,
      });

      const request = new Request("https://example.com/protected");

      await expect(requireAuthContext(request)).rejects.toBe(redirectResponse);
    });
  });

  describe("getUser", () => {
    it("returns user when authenticated", async () => {
      const auth = mockAuthInstance();
      const { getUser } = createAuthHelpers({ getAuth: () => auth });

      const user = await getUser(new Request("https://example.com/"));
      expect(user).not.toBeNull();
      expect(user!.id).toBe("u1");
    });

    it("returns null when unauthenticated", async () => {
      const auth = mockAuthInstance({
        createContext: vi.fn().mockResolvedValue({ user: null, grants: [] }),
      });
      const { getUser } = createAuthHelpers({ getAuth: () => auth });

      const user = await getUser(new Request("https://example.com/"));
      expect(user).toBeNull();
    });
  });

  describe("requireUser", () => {
    it("returns user when authenticated", async () => {
      const auth = mockAuthInstance();
      const { requireUser } = createAuthHelpers({ getAuth: () => auth });

      const user = await requireUser(new Request("https://example.com/"));
      expect(user.id).toBe("u1");
      expect(user.email).toBe("alice@example.com");
    });
  });

  describe("enrichUser hook", () => {
    type StoreUser = AuthUser & { vendorId: string | null };

    it("enriches user in getAuthContext", async () => {
      const auth = mockAuthInstance();
      const { getAuthContext } = createAuthHelpers<StoreUser>({
        getAuth: () => auth,
        enrichUser: async (user) => ({
          ...user,
          vendorId: "vendor-123",
        }),
      });

      const result = await getAuthContext(
        new Request("https://example.com/"),
      );
      expect(result.user).not.toBeNull();
      expect(result.user!.vendorId).toBe("vendor-123");
    });

    it("enriches user in requireAuthContext", async () => {
      const auth = mockAuthInstance();
      const { requireAuthContext } = createAuthHelpers<StoreUser>({
        getAuth: () => auth,
        enrichUser: async (user) => ({
          ...user,
          vendorId: "vendor-456",
        }),
      });

      const result = await requireAuthContext(
        new Request("https://example.com/"),
      );
      expect(result.user.vendorId).toBe("vendor-456");
    });

    it("enriches user in getUser", async () => {
      const auth = mockAuthInstance();
      const { getUser } = createAuthHelpers<StoreUser>({
        getAuth: () => auth,
        enrichUser: async (user) => ({
          ...user,
          vendorId: "v-789",
        }),
      });

      const user = await getUser(new Request("https://example.com/"));
      expect(user).not.toBeNull();
      expect(user!.vendorId).toBe("v-789");
    });

    it("enriches user in requireUser", async () => {
      const auth = mockAuthInstance();
      const { requireUser } = createAuthHelpers<StoreUser>({
        getAuth: () => auth,
        enrichUser: async (user) => ({
          ...user,
          vendorId: "v-abc",
        }),
      });

      const user = await requireUser(new Request("https://example.com/"));
      expect(user.vendorId).toBe("v-abc");
    });

    it("does not enrich null user in getAuthContext", async () => {
      const enrichUser = vi.fn();
      const auth = mockAuthInstance({
        createContext: vi.fn().mockResolvedValue({ user: null, grants: [] }),
      });
      const { getAuthContext } = createAuthHelpers<StoreUser>({
        getAuth: () => auth,
        enrichUser,
      });

      const result = await getAuthContext(
        new Request("https://example.com/"),
      );
      expect(result.user).toBeNull();
      expect(enrichUser).not.toHaveBeenCalled();
    });
  });

  describe("getAuth factory is called per invocation", () => {
    it("calls factory on each helper call", async () => {
      const auth = mockAuthInstance();
      const factory = vi.fn(() => auth);
      const helpers = createAuthHelpers({ getAuth: factory });

      const request = new Request("https://example.com/");
      await helpers.getAuthContext(request);
      await helpers.requireAuthContext(request);
      await helpers.getUser(request);
      await helpers.requireUser(request);

      // getUser calls getAuthContext internally, so getAuth is called once per.
      // requireUser calls requireAuthContext internally.
      // Total: getAuthContext(1) + requireAuthContext(1) + getUser->getAuthContext(1) + requireUser->requireAuthContext(1) = 4
      expect(factory).toHaveBeenCalledTimes(4);
    });
  });
});
