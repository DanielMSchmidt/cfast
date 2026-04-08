import { describe, it, expect, vi, beforeEach } from "vitest";
import { definePermissions, grant } from "@cfast/permissions";
import { parseExpiresIn } from "../create-auth";
import { createMockD1 } from "./helpers";

// Mock better-auth and drizzle-orm so we can test without a real D1 database
const { mockGetSession, mockSignInMagicLink, mockBetterAuth } = vi.hoisted(
  () => {
    const mockGetSession = vi.fn();
    const mockSignInMagicLink = vi.fn().mockResolvedValue({});
    const mockHandler = vi.fn();
    const mockBetterAuth = vi.fn((_opts: Record<string, unknown>) => ({
      api: { getSession: mockGetSession, signInMagicLink: mockSignInMagicLink },
      handler: mockHandler,
    }));
    return { mockGetSession, mockSignInMagicLink, mockBetterAuth };
  },
);

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

const { mockPasskey } = vi.hoisted(() => {
  const mockPasskey = vi.fn((opts: unknown) => ({
    id: "passkey",
    ...(opts as Record<string, unknown>),
  }));
  return { mockPasskey };
});

vi.mock("@better-auth/passkey", () => ({
  passkey: mockPasskey,
}));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({})),
}));

// Import after mocks
const { createAuth } = await import("../create-auth");

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
      if (sql.includes("FROM roles")) {
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

  it("exposes a handler function", () => {
    const initAuth = createAuth({ permissions });
    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });

    expect(typeof auth.handler).toBe("function");
  });

  it("sendMagicLink delegates to auth.api.signInMagicLink", async () => {
    const initAuth = createAuth({
      permissions,
      magicLink: { sendMagicLink: vi.fn() },
    });
    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });

    mockSignInMagicLink.mockClear();
    await auth.sendMagicLink({ email: "test@example.com" });

    expect(mockSignInMagicLink).toHaveBeenCalledWith({
      body: { email: "test@example.com", callbackURL: "/" },
      headers: expect.any(Headers),
    });
  });

  it("sendMagicLink uses custom callbackURL when provided", async () => {
    const initAuth = createAuth({
      permissions,
      magicLink: { sendMagicLink: vi.fn() },
      redirects: { afterLogin: "/dashboard" },
    });
    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });

    mockSignInMagicLink.mockClear();
    await auth.sendMagicLink({
      email: "test@example.com",
      callbackURL: "/custom",
    });

    expect(mockSignInMagicLink).toHaveBeenCalledWith({
      body: { email: "test@example.com", callbackURL: "/custom" },
      headers: expect.any(Headers),
    });
  });

  it("sendMagicLink falls back to redirects.afterLogin config", async () => {
    const initAuth = createAuth({
      permissions,
      magicLink: { sendMagicLink: vi.fn() },
      redirects: { afterLogin: "/home" },
    });
    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });

    mockSignInMagicLink.mockClear();
    await auth.sendMagicLink({ email: "test@example.com" });

    expect(mockSignInMagicLink).toHaveBeenCalledWith({
      body: { email: "test@example.com", callbackURL: "/home" },
      headers: expect.any(Headers),
    });
  });

  it("sendMagicLink throws when magicLink plugin not configured", async () => {
    const initAuth = createAuth({ permissions });
    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });

    await expect(
      auth.sendMagicLink({ email: "test@example.com" }),
    ).rejects.toThrow("Magic link plugin not configured");
  });

  it("accepts templates config", () => {
    const template = (props: { url: string; email: string }) =>
      `<a href="${props.url}">Login as ${props.email}</a>`;

    const initAuth = createAuth({
      permissions,
      magicLink: { sendMagicLink: vi.fn() },
      templates: { magicLink: template },
    });

    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });
    expect(auth).toBeDefined();
  });

  it("includes passkey plugin when passkeys config is provided", () => {
    mockBetterAuth.mockClear();

    const initAuth = createAuth({
      permissions,
      passkeys: { rpName: "Test App", rpId: "example.com" },
    });
    initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    const callArgs = mockBetterAuth.mock.calls[0]![0] as Record<string, unknown>;
    const plugins = callArgs.plugins as { id: string }[];
    expect(plugins.some((p) => p.id === "passkey")).toBe(true);
  });

  it("passes rpName, rpID, and origin to passkey plugin", () => {
    mockBetterAuth.mockClear();
    mockPasskey.mockClear();

    const initAuth = createAuth({
      permissions,
      passkeys: { rpName: "Test App", rpId: "example.com" },
    });
    initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    expect(mockPasskey).toHaveBeenCalledWith({
      rpName: "Test App",
      rpID: "example.com",
      origin: "https://example.com",
    });
  });

  it("does not include passkey plugin when passkeys config is omitted", () => {
    mockBetterAuth.mockClear();

    const initAuth = createAuth({ permissions });
    initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    const callArgs = mockBetterAuth.mock.calls[0]![0] as Record<string, unknown>;
    const plugins = callArgs.plugins as { id: string }[];
    expect(plugins.some((p) => p.id === "passkey")).toBe(false);
  });

  it("resolves passkey rpId from a function at request time", () => {
    mockBetterAuth.mockClear();
    mockPasskey.mockClear();

    const initAuth = createAuth({
      permissions,
      passkeys: {
        rpName: "Multi Tenant",
        rpId: (request) => new URL(request.url).hostname,
      },
    });

    const request = new Request("https://tenant-a.example.com/auth");
    initAuth(
      { d1: createMockD1(), appUrl: "https://tenant-a.example.com" },
      request,
    );

    expect(mockPasskey).toHaveBeenCalledWith({
      rpName: "Multi Tenant",
      rpID: "tenant-a.example.com",
      origin: "https://tenant-a.example.com",
    });
  });

  it("resolves a different rpId for a different request hostname", () => {
    mockBetterAuth.mockClear();
    mockPasskey.mockClear();

    const initAuth = createAuth({
      permissions,
      passkeys: {
        rpName: "Multi Tenant",
        rpId: (request) => new URL(request.url).hostname,
      },
    });

    initAuth(
      { d1: createMockD1(), appUrl: "https://tenant-b.example.com" },
      new Request("https://tenant-b.example.com/auth"),
    );

    expect(mockPasskey).toHaveBeenCalledWith({
      rpName: "Multi Tenant",
      rpID: "tenant-b.example.com",
      origin: "https://tenant-b.example.com",
    });
  });

  it("still accepts a static string rpId (backward compat)", () => {
    mockBetterAuth.mockClear();
    mockPasskey.mockClear();

    const initAuth = createAuth({
      permissions,
      passkeys: { rpName: "Test App", rpId: "example.com" },
    });

    // No request argument — static rpId still works.
    initAuth({ d1: createMockD1(), appUrl: "https://example.com" });

    expect(mockPasskey).toHaveBeenCalledWith({
      rpName: "Test App",
      rpID: "example.com",
      origin: "https://example.com",
    });
  });

  it("throws a clear error when rpId is a function but no request is passed", () => {
    const initAuth = createAuth({
      permissions,
      passkeys: {
        rpName: "Multi Tenant",
        rpId: (request) => new URL(request.url).hostname,
      },
    });

    expect(() =>
      initAuth({ d1: createMockD1(), appUrl: "https://example.com" }),
    ).toThrow("passkeys.rpId is a function but initAuth() was called without a request");
  });
});

describe("AuthConfig.defaultRoles typing", () => {
  // These tests exercise the `RoleNameOf<P>` narrowing added for #154.
  // The runtime assertions are trivial (we just verify the strings round-
  // trip through `defaultRoles`); the real value lives in the compile-
  // time @ts-expect-error checks below. They're part of the test file so
  // `tsc --noEmit` against the auth package verifies the constraint.
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  it("accepts role names declared in definePermissions", () => {
    const typed = definePermissions({
      roles: ["admin", "editor", "reader"] as const,
      grants: {
        admin: [grant("read", "all"), grant("create", "all")],
        editor: [grant("read", "all"), grant("create", "all")],
        reader: [grant("read", "all")],
      },
    });

    // Known roles compile fine.
    const initAuth = createAuth({
      permissions: typed,
      defaultRoles: ["editor"],
      anonymousRoles: ["reader"],
    });
    expect(initAuth).toBeDefined();
  });

  it("rejects unknown role names at the type level", () => {
    const typed = definePermissions({
      roles: ["admin", "editor"] as const,
      grants: {
        admin: [grant("read", "all")],
        editor: [grant("read", "all")],
      },
    });

    createAuth({
      permissions: typed,
      // @ts-expect-error — "viewer" was not declared in the permissions roles tuple
      defaultRoles: ["viewer"],
    });

    createAuth({
      permissions: typed,
      // @ts-expect-error — "guest" was not declared in the permissions roles tuple
      anonymousRoles: ["guest"],
    });

    // Verify passes at runtime when we DO use a known role so the test
    // doesn't fail purely on the ts-expect-error above being "wasted"
    // when type-checking is disabled by a consumer.
    const ok = createAuth({
      permissions: typed,
      defaultRoles: ["editor"],
    });
    expect(ok).toBeDefined();
  });
});

describe("AuthInstance.roles (grouped namespace)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Builds a mock D1 that captures every `prepare()` call and records
   * which statements bind with which args. Returned alongside the calls
   * array so tests can assert on the SQL the roles API runs.
   */
  function makeRecordingD1() {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const d1 = {
      prepare: (sql: string) => ({
        bind: (...params: unknown[]) => {
          calls.push({ sql, params });
          return {
            all: async () => ({ results: [{ role: "editor" }] }),
            first: async () => null,
            run: async () => ({ results: [] }),
            raw: async () => [],
          };
        },
      }),
      batch: async () => [],
      dump: async () => new ArrayBuffer(0),
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as D1Database;
    return { d1, calls };
  }

  it("exposes a `roles` namespace on the AuthInstance", () => {
    const initAuth = createAuth({ permissions });
    const auth = initAuth({
      d1: createMockD1(),
      appUrl: "https://example.com",
    });

    expect(auth.roles).toBeDefined();
    expect(typeof auth.roles.get).toBe("function");
    expect(typeof auth.roles.set).toBe("function");
    expect(typeof auth.roles.setAll).toBe("function");
    expect(typeof auth.roles.remove).toBe("function");
  });

  it("auth.roles.get returns the same result as the legacy getRoles alias", async () => {
    const { d1 } = makeRecordingD1();
    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1, appUrl: "https://example.com" });

    const viaNew = await auth.roles.get("user-1");
    const viaOld = await auth.getRoles("user-1");
    expect(viaNew).toEqual(viaOld);
    expect(viaNew).toEqual(["editor"]);
  });

  it("auth.roles.set runs a single INSERT against the role table", async () => {
    const { d1, calls } = makeRecordingD1();
    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1, appUrl: "https://example.com" });

    await auth.roles.set("user-1", "editor");

    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toContain("INSERT OR IGNORE INTO roles");
    expect(calls[0]!.params).toEqual(["user-1", "editor"]);
  });

  it("auth.roles.remove runs a DELETE scoped to user+role", async () => {
    const { d1, calls } = makeRecordingD1();
    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1, appUrl: "https://example.com" });

    await auth.roles.remove("user-1", "editor");

    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toContain("DELETE FROM roles");
    expect(calls[0]!.sql).toContain("user_id = ?");
    expect(calls[0]!.sql).toContain("role = ?");
    expect(calls[0]!.params).toEqual(["user-1", "editor"]);
  });

  it("legacy aliases and grouped namespace share the same underlying role manager", async () => {
    // If the grouped namespace instantiated its own `createRoleManager`,
    // we'd see two sets of prepared statements for identical calls. This
    // test makes sure `roles.set` hits the same D1 handle (and therefore
    // the same role manager) as `auth.setRole`.
    const { d1, calls } = makeRecordingD1();
    const initAuth = createAuth({ permissions });
    const auth = initAuth({ d1, appUrl: "https://example.com" });

    await auth.setRole("u1", "editor");
    await auth.roles.set("u1", "editor");

    expect(calls).toHaveLength(2);
    expect(calls[0]!.sql).toBe(calls[1]!.sql);
    expect(calls[0]!.params).toEqual(calls[1]!.params);
  });

  it("auth.roles.setAll enforces roleGrants rules like the legacy setRoles", async () => {
    const { d1 } = makeRecordingD1();
    const initAuth = createAuth({
      permissions,
      roleGrants: {
        admin: ["admin", "editor", "reader"],
        editor: ["reader"],
      },
    });
    const auth = initAuth({ d1, appUrl: "https://example.com" });

    await expect(
      auth.roles.setAll("u1", ["admin"], { callerRoles: ["editor"] }),
    ).rejects.toThrow('Not authorized to assign role "admin"');
  });
});
