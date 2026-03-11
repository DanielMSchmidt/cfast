import { describe, it, expect, vi, beforeEach } from "vitest";
import { definePermissions, grant } from "@cfast/permissions";
import { parseExpiresIn } from "./create-auth";
import { createMockD1 } from "./__tests__/helpers";

// Mock better-auth and drizzle-orm so we can test without a real D1 database
const { mockGetSession, mockBetterAuth } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockBetterAuth = vi.fn((_opts: any) => ({
    api: { getSession: mockGetSession },
  }));
  return { mockGetSession, mockBetterAuth };
});

vi.mock("better-auth", () => ({
  betterAuth: mockBetterAuth,
}));

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("better-auth/plugins/magic-link", () => ({
  magicLink: vi.fn(
    (opts: unknown) =>
      ({ id: "magic-link", ...(opts as Record<string, unknown>) }),
  ),
}));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({})),
}));

// Import after mocks
const { createAuth } = await import("./create-auth");

const permissions = definePermissions({
  roles: ["reader", "editor"] as const,
  grants: {
    reader: [grant("read", "all")],
    editor: [grant("read", "all"), grant("create", "all")],
  },
});

describe("parseExpiresIn", () => {
  it("parses seconds", () => {
    expect(parseExpiresIn("30s")).toBe(30);
  });

  it("parses minutes", () => {
    expect(parseExpiresIn("15m")).toBe(900);
  });

  it("parses hours", () => {
    expect(parseExpiresIn("2h")).toBe(7200);
  });

  it("parses days", () => {
    expect(parseExpiresIn("30d")).toBe(2592000);
  });

  it("returns default for invalid input", () => {
    expect(parseExpiresIn("invalid")).toBe(2592000); // 30d default
  });
});

describe("createAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns anonymous context when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);

    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });
    const ctx = await auth.createContext(
      new Request("https://example.com/page"),
    );

    expect(ctx.user).toBeNull();
    expect(ctx.grants).toEqual([]);
  });

  it("returns anonymous context with anonymousRoles grants", async () => {
    mockGetSession.mockResolvedValue(null);

    const initAuth = createAuth({
      permissions,
      anonymousRoles: ["reader"],
    });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });
    const ctx = await auth.createContext(
      new Request("https://example.com/page"),
    );

    expect(ctx.user).toBeNull();
    expect(ctx.grants).toHaveLength(1);
    expect(ctx.grants[0]).toEqual({ action: "read", subject: "all" });
  });

  it("returns authenticated context with user info and roles from DB", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      },
      session: { id: "session-1" },
    });

    // Create a mock D1 where getRoles returns ["editor"]
    const d1 = createMockD1();
    const originalPrepare = d1.prepare;
    (d1 as unknown as Record<string, unknown>).prepare = (sql: string) => {
      const stmt = (originalPrepare as (sql: string) => unknown)(sql);
      if (sql.includes("cfast_roles")) {
        return {
          bind: () => ({
            all: async () => ({ results: [{ role: "editor" }] }),
            run: async () => ({ results: [] }),
          }),
        };
      }
      return stmt;
    };

    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1, appUrl: "https://example.com" });
    const ctx = await auth.createContext(
      new Request("https://example.com/page"),
    );

    expect(ctx.user).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
      roles: ["editor"],
    });
    expect(ctx.grants).toHaveLength(2);
    expect(ctx.grants).toEqual([
      { action: "read", subject: "all" },
      { action: "create", subject: "all" },
    ]);
  });

  it("uses defaultRoles when user has no roles in DB", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-2",
        email: "new@example.com",
        name: "New User",
        image: null,
      },
      session: { id: "session-2" },
    });

    const initAuth = createAuth({
      permissions,
      defaultRoles: ["reader"],
    });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });
    const ctx = await auth.createContext(
      new Request("https://example.com/page"),
    );

    expect(ctx.user).not.toBeNull();
    expect(ctx.user!.roles).toEqual(["reader"]);
    expect(ctx.grants).toHaveLength(1);
    expect(ctx.grants[0]).toEqual({ action: "read", subject: "all" });
  });

  it("falls back to ['reader'] when no defaultRoles and user has no roles", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-3",
        email: "noroles@example.com",
        name: null,
        image: null,
      },
      session: { id: "session-3" },
    });

    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });
    const ctx = await auth.createContext(
      new Request("https://example.com/page"),
    );

    expect(ctx.user).not.toBeNull();
    expect(ctx.user!.name).toBe("");
    expect(ctx.user!.avatarUrl).toBeNull();
    expect(ctx.user!.roles).toEqual(["reader"]);
  });

  it("returns anonymous context when getSession throws", async () => {
    mockGetSession.mockRejectedValue(new Error("tables not found"));

    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });
    const ctx = await auth.createContext(
      new Request("https://example.com/page"),
    );

    expect(ctx.user).toBeNull();
    expect(ctx.grants).toEqual([]);
  });

  it("requireUser throws a redirect Response when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    try {
      await auth.requireUser(new Request("https://example.com/dashboard"));
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      const response = err as Response;
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login");
      expect(response.headers.get("Set-Cookie")).toContain("cfast_redirect_to");
    }
  });

  it("requireUser returns authenticated context when session exists", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        image: null,
      },
      session: { id: "s-1" },
    });

    const initAuth = createAuth({
      permissions,
      defaultRoles: ["editor"],
    });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });
    const ctx = await auth.requireUser(
      new Request("https://example.com/dashboard"),
    );

    expect(ctx.user.id).toBe("user-1");
  });

  it("initializes betterAuth with correct config including session expiry", () => {
    const initAuth = createAuth({
      permissions,
      session: { expiresIn: "7d" },
      magicLink: {
        sendMagicLink: vi.fn(),
      },
    });

    mockBetterAuth.mockClear();
    initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    expect(mockBetterAuth).toHaveBeenCalledTimes(1);
    const callArgs = mockBetterAuth.mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect(callArgs.baseURL).toBe("https://example.com");
    expect(callArgs.emailAndPassword).toEqual({ enabled: true });
    expect(callArgs.session).toEqual({ expiresIn: 604800 }); // 7d in seconds
    expect((callArgs.plugins as unknown[]).length).toBe(1); // magicLink plugin
  });

  it("exposes the Better Auth instance as api", () => {
    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    expect(auth.api).toBeDefined();
    expect(auth.api).not.toBeNull();
  });
});
