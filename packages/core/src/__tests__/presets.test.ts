import { describe, it, expect, vi } from "vitest";
import { createDefaultPlugins } from "../presets";

function mockAuthInstance(
  user: { id: string; email: string; name: string } | null = {
    id: "u1",
    email: "alice@example.com",
    name: "Alice",
  },
) {
  return {
    createContext: vi.fn().mockResolvedValue({
      user: user ? { ...user, avatarUrl: null, roles: ["admin"] } : null,
      grants: user ? [{ action: "manage" as const, subject: "all" as const }] : [],
    }),
  };
}

describe("createDefaultPlugins", () => {
  it("returns authPlugin and dbPlugin", () => {
    const { authPlugin, dbPlugin } = createDefaultPlugins({
      initAuth: () => mockAuthInstance(),
      createDb: vi.fn(() => ({ query: vi.fn() })),
    });
    expect(authPlugin.name).toBe("auth");
    expect(dbPlugin.name).toBe("db");
  });

  describe("authPlugin", () => {
    it("calls initAuth with env and returns user/grants/instance", async () => {
      const auth = mockAuthInstance();
      const initAuth = vi.fn(() => auth);
      const { authPlugin } = createDefaultPlugins({ initAuth, createDb: vi.fn() });
      const request = new Request("https://example.com/");
      const env = { DB: "d1-mock", APP_URL: "https://example.com" };
      const result = await authPlugin.setup({ request, env } as Parameters<typeof authPlugin.setup>[0]);
      expect(initAuth).toHaveBeenCalledWith(env);
      expect(auth.createContext).toHaveBeenCalledWith(request);
      expect(result.user).not.toBeNull();
      expect(result.user!.id).toBe("u1");
      expect(result.grants).toHaveLength(1);
      expect(result.instance).toBe(auth);
    });

    it("returns null user when unauthenticated", async () => {
      const auth = mockAuthInstance(null);
      const { authPlugin } = createDefaultPlugins({ initAuth: () => auth, createDb: vi.fn() });
      const result = await authPlugin.setup({ request: new Request("https://example.com/"), env: {} } as Parameters<typeof authPlugin.setup>[0]);
      expect(result.user).toBeNull();
      expect(result.grants).toEqual([]);
    });
  });

  describe("dbPlugin", () => {
    it("calls createDb with grants and user from auth", async () => {
      const dbMock = { query: vi.fn() };
      const createDb = vi.fn(() => dbMock);
      const auth = mockAuthInstance();
      const { authPlugin, dbPlugin } = createDefaultPlugins({ initAuth: () => auth, createDb });
      const request = new Request("https://example.com/");
      const env = { DB: "d1-mock" };
      const authResult = await authPlugin.setup({ request, env } as Parameters<typeof authPlugin.setup>[0]);
      const dbResult = await dbPlugin.setup({ request, env, auth: authResult } as Parameters<typeof dbPlugin.setup>[0]);
      expect(createDb).toHaveBeenCalledWith(authResult.grants, { id: "u1" });
      expect(dbResult.client).toBe(dbMock);
    });

    it("passes null user when unauthenticated", async () => {
      const createDb = vi.fn(() => ({}));
      const auth = mockAuthInstance(null);
      const { authPlugin, dbPlugin } = createDefaultPlugins({ initAuth: () => auth, createDb });
      const request = new Request("https://example.com/");
      const authResult = await authPlugin.setup({ request, env: {} } as Parameters<typeof authPlugin.setup>[0]);
      await dbPlugin.setup({ request, env: {}, auth: authResult } as Parameters<typeof dbPlugin.setup>[0]);
      expect(createDb).toHaveBeenCalledWith([], null);
    });
  });

  describe("dbPlugin requires authPlugin", () => {
    it("dbPlugin declares authPlugin as a dependency", () => {
      const { authPlugin, dbPlugin } = createDefaultPlugins({ initAuth: () => mockAuthInstance(), createDb: vi.fn() });
      expect(dbPlugin.requires).toBeDefined();
      expect(dbPlugin.requires).toContain(authPlugin);
    });
  });
});
