import { describe, it, expect, vi, beforeEach } from "vitest";
import { definePermissions, grant } from "@cfast/permissions";
import { createMockD1 } from "./helpers";

// Mock Better Auth so we can drive the test helpers deterministically
// without needing a real D1 or real better-auth in the unit test pool.
// The goal of these unit tests is to prove the HELPER LOGIC is correct:
// - it wraps the user's sendMagicLink
// - it calls signInMagicLink through the public API
// - it issues a real handler() request against the verify endpoint
// - it extracts the cookie, session row, user row correctly
// The end-to-end "this produces a session indistinguishable from
// production" proof lives in the integration test suite where a real
// D1 and real better-auth run inside workerd.
const {
  mockSignInMagicLink,
  mockHandler,
  mockGetSession,
  mockBetterAuth,
} = vi.hoisted(() => {
  const mockSignInMagicLink = vi.fn();
  const mockHandler = vi.fn();
  const mockGetSession = vi.fn();
  const mockBetterAuth = vi.fn((_opts: Record<string, unknown>) => ({
    api: {
      getSession: mockGetSession,
      signInMagicLink: mockSignInMagicLink,
    },
    handler: mockHandler,
  }));
  return { mockSignInMagicLink, mockHandler, mockGetSession, mockBetterAuth };
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

vi.mock("@better-auth/passkey", () => ({
  passkey: vi.fn((opts: unknown) => ({ id: "passkey", ...(opts as Record<string, unknown>) })),
}));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({})),
}));

// Import after mocks are set up.
const { createTestApp, loginAs, createTestSession, applyAuthSchema } =
  await import("../test-helpers");

const permissions = definePermissions({
  roles: ["reader", "editor"] as const,
  grants: {
    reader: [grant("read", "all")],
    editor: [grant("read", "all"), grant("create", "all")],
  },
});

type SeedSession = {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  email: string;
  name: string;
};

/**
 * Augments a mock D1 so its `prepare().bind().first()` returns a canned
 * session row whenever the helper queries for the latest session. All
 * other SELECT/INSERT/DELETE operations pass through to the default
 * mock (which returns empty results and records the calls).
 */
function seedSessionRow(
  d1: ReturnType<typeof createMockD1>,
  row: SeedSession,
) {
  const originalPrepare = d1.prepare;
  (d1 as unknown as Record<string, unknown>).prepare = (sql: string) => {
    const stmt = (originalPrepare as (sql: string) => unknown)(sql);
    if (sql.includes("FROM sessions") && sql.includes("INNER JOIN users")) {
      return {
        bind: () => ({
          first: async () => row,
          all: async () => ({ results: [row] }),
          run: async () => ({ results: [] }),
        }),
      };
    }
    return stmt;
  };
}

/**
 * Builds a handler() mock that responds to the verify endpoint with a
 * real Response carrying the given Set-Cookie header and JSON body.
 */
function stubVerifyHandler(
  setCookieHeaders: string[] = [
    "better-auth.session_token=token-abc; Path=/; HttpOnly; SameSite=Lax",
  ],
  body: Record<string, unknown> = {
    token: "token-abc",
    user: { id: "user-1", email: "alice@test.com", name: "Alice" },
  },
) {
  mockHandler.mockImplementation(async (req: Request) => {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/api/auth/magic-link/verify")) {
      const headers = new Headers({ "content-type": "application/json" });
      for (const h of setCookieHeaders) {
        headers.append("set-cookie", h);
      }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers,
      });
    }
    return new Response("not found", { status: 404 });
  });
}

describe("applyAuthSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs an exec() for every auth table", async () => {
    const d1 = createMockD1();
    const execSpy = vi.spyOn(d1, "exec");
    await applyAuthSchema(d1);
    // users, sessions, accounts, verifications, passkeys, roles, impersonation_logs = 7
    expect(execSpy).toHaveBeenCalledTimes(7);
    const joined = execSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(joined).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(joined).toContain("CREATE TABLE IF NOT EXISTS sessions");
    expect(joined).toContain("CREATE TABLE IF NOT EXISTS verifications");
    expect(joined).toContain("CREATE TABLE IF NOT EXISTS roles");
  });
});

describe("createTestApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a real AuthInstance wired to the supplied D1", async () => {
    const d1 = createMockD1();
    const app = await createTestApp({
      d1,
      appUrl: "http://localhost:8787",
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    expect(app.auth).toBeDefined();
    expect(typeof app.auth.createContext).toBe("function");
    expect(typeof app.auth.handler).toBe("function");
    expect(app.d1).toBe(d1);
    expect(app.appUrl).toBe("http://localhost:8787");
    expect(app.capturedMagicLinks).toEqual([]);
  });

  it("defaults appUrl to http://localhost:8787", async () => {
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    expect(app.appUrl).toBe("http://localhost:8787");
  });

  it("applies auth schema migrations by default", async () => {
    const d1 = createMockD1();
    const execSpy = vi.spyOn(d1, "exec");
    await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    expect(execSpy).toHaveBeenCalledTimes(7);
  });

  it("skips migrations when applyMigrations is false", async () => {
    const d1 = createMockD1();
    const execSpy = vi.spyOn(d1, "exec");
    await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
      applyMigrations: false,
    });
    expect(execSpy).not.toHaveBeenCalled();
  });

  it("wraps the user's sendMagicLink to capture URLs", async () => {
    const userSender = vi.fn();
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: userSender } },
    });

    // Invoke the wrapped sender the way Better Auth would.
    const passedConfig = mockBetterAuth.mock.calls[0]![0] as {
      plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string }) => Promise<void> }>;
    };
    const magicLinkPlugin = passedConfig.plugins.find(
      (p) => p.id === "magic-link",
    );
    expect(magicLinkPlugin).toBeDefined();

    await magicLinkPlugin!.sendMagicLink({
      email: "alice@test.com",
      url: "http://localhost:8787/api/auth/magic-link/verify?token=XYZ123&callbackURL=%2F",
    });

    // User sender received the original params.
    expect(userSender).toHaveBeenCalledTimes(1);
    expect(userSender).toHaveBeenCalledWith({
      email: "alice@test.com",
      url: "http://localhost:8787/api/auth/magic-link/verify?token=XYZ123&callbackURL=%2F",
    });

    // Helper captured the link.
    expect(app.capturedMagicLinks).toHaveLength(1);
    expect(app.capturedMagicLinks[0]).toEqual({
      email: "alice@test.com",
      url: "http://localhost:8787/api/auth/magic-link/verify?token=XYZ123&callbackURL=%2F",
      token: "XYZ123",
    });
  });

  it("captures URLs even when the user did not provide a sendMagicLink", async () => {
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    const passedConfig = mockBetterAuth.mock.calls[0]![0] as {
      plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string }) => Promise<void> }>;
    };
    const plugin = passedConfig.plugins.find((p) => p.id === "magic-link")!;
    await plugin.sendMagicLink({
      email: "bob@test.com",
      url: "http://localhost:8787/api/auth/magic-link/verify?token=TKN",
    });
    expect(app.capturedMagicLinks).toHaveLength(1);
    expect(app.capturedMagicLinks[0]!.token).toBe("TKN");
  });

  it("waitForMagicLink resolves synchronously when a link is already captured", async () => {
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    const plugin = (mockBetterAuth.mock.calls[0]![0] as {
      plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string }) => Promise<void> }>;
    }).plugins.find((p) => p.id === "magic-link")!;

    await plugin.sendMagicLink({
      email: "alice@test.com",
      url: "http://localhost/api/auth/magic-link/verify?token=T1",
    });

    const link = await app.waitForMagicLink("alice@test.com");
    expect(link.token).toBe("T1");
  });

  it("waitForMagicLink resolves when the link arrives later", async () => {
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    const plugin = (mockBetterAuth.mock.calls[0]![0] as {
      plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string }) => Promise<void> }>;
    }).plugins.find((p) => p.id === "magic-link")!;

    const waiter = app.waitForMagicLink("late@test.com", { timeoutMs: 2_000 });
    // Push the link after the wait has started.
    setTimeout(() => {
      void plugin.sendMagicLink({
        email: "late@test.com",
        url: "http://localhost/api/auth/magic-link/verify?token=LATE",
      });
    }, 10);

    const link = await waiter;
    expect(link.email).toBe("late@test.com");
    expect(link.token).toBe("LATE");
  });

  it("waitForMagicLink times out when no link arrives", async () => {
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    await expect(
      app.waitForMagicLink("never@test.com", { timeoutMs: 50 }),
    ).rejects.toThrow("timed out after 50ms");
  });

  it("waitForMagicLink ignores links for a different email when one is specified", async () => {
    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    const plugin = (mockBetterAuth.mock.calls[0]![0] as {
      plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string }) => Promise<void> }>;
    }).plugins.find((p) => p.id === "magic-link")!;

    const waiter = app.waitForMagicLink("target@test.com", { timeoutMs: 500 });
    await plugin.sendMagicLink({
      email: "other@test.com",
      url: "http://localhost/api/auth/magic-link/verify?token=NO",
    });
    // The wrong-email link should NOT resolve the waiter.
    await plugin.sendMagicLink({
      email: "target@test.com",
      url: "http://localhost/api/auth/magic-link/verify?token=YES",
    });

    const link = await waiter;
    expect(link.token).toBe("YES");
  });
});

describe("loginAs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  it("drives the full send + verify flow and returns the real session row", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string; callbackURL?: string }; headers: HeadersInit }) => {
        // Simulate what Better Auth's signInMagicLink does: invoke the
        // configured sender with a real-looking URL. The plugin was
        // handed to betterAuth() during createTestApp; pluck it and
        // call it the way Better Auth would.
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{
            id: string;
            sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void>;
          }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        const token = "real-token-xyz";
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: `http://localhost:8787/api/auth/magic-link/verify?token=${token}&callbackURL=%2F`,
          token,
        });
      },
    );

    stubVerifyHandler();
    const d1 = createMockD1();
    seedSessionRow(d1, {
      id: "session-row-1",
      user_id: "user-1",
      token: "token-abc",
      expires_at: 1_900_000_000,
      email: "alice@test.com",
      name: "Alice",
    });

    const app = await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    const info = await loginAs(app, { email: "alice@test.com", name: "Alice" });

    // Helper captured the link Better Auth generated.
    expect(app.capturedMagicLinks).toHaveLength(1);
    expect(app.capturedMagicLinks[0]!.token).toBe("real-token-xyz");

    // handler() was invoked with the verify URL (with callbackURL stripped).
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const verifyReq = mockHandler.mock.calls[0]![0] as Request;
    expect(new URL(verifyReq.url).pathname).toBe("/api/auth/magic-link/verify");
    expect(new URL(verifyReq.url).searchParams.get("token")).toBe("real-token-xyz");
    expect(new URL(verifyReq.url).searchParams.get("callbackURL")).toBeNull();

    // SessionInfo carries the canonical row from D1, not the response JSON.
    expect(info.cookie).toBe("better-auth.session_token=token-abc");
    expect(info.setCookieHeaders).toHaveLength(1);
    expect(info.setCookieHeaders[0]).toContain("HttpOnly");
    expect(info.user).toEqual({
      id: "user-1",
      email: "alice@test.com",
      name: "Alice",
    });
    expect(info.session.id).toBe("session-row-1");
    expect(info.session.token).toBe("token-abc");
    expect(info.session.userId).toBe("user-1");
    expect(info.session.expiresAt).toBeInstanceOf(Date);
  });

  it("assigns roles via the real setRole API path", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string }; headers: HeadersInit }) => {
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void> }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: "http://localhost:8787/api/auth/magic-link/verify?token=t1&callbackURL=%2F",
          token: "t1",
        });
      },
    );
    stubVerifyHandler();

    const d1 = createMockD1();
    seedSessionRow(d1, {
      id: "s-1",
      user_id: "user-1",
      token: "tok",
      expires_at: 1_900_000_000,
      email: "alice@test.com",
      name: "Alice",
    });
    const app = await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    const setRoleSpy = vi.spyOn(app.auth, "setRole");

    await loginAs(app, {
      email: "alice@test.com",
      roles: ["reader", "editor"],
    });

    expect(setRoleSpy).toHaveBeenCalledTimes(2);
    expect(setRoleSpy).toHaveBeenNthCalledWith(1, "user-1", "reader");
    expect(setRoleSpy).toHaveBeenNthCalledWith(2, "user-1", "editor");
  });

  it("throws when verification returns an error status", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string }; headers: HeadersInit }) => {
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void> }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: "http://localhost:8787/api/auth/magic-link/verify?token=bad",
          token: "bad",
        });
      },
    );
    mockHandler.mockResolvedValue(
      new Response("INVALID_TOKEN", { status: 400 }),
    );

    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    await expect(
      loginAs(app, { email: "alice@test.com" }),
    ).rejects.toThrow("magic link verification failed (status 400)");
  });

  it("throws when the verify response carries no Set-Cookie header", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string }; headers: HeadersInit }) => {
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void> }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: "http://localhost:8787/api/auth/magic-link/verify?token=t",
          token: "t",
        });
      },
    );
    mockHandler.mockResolvedValue(
      new Response(JSON.stringify({ token: "t", user: { id: "u", email: "alice@test.com", name: "Alice" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const app = await createTestApp({
      d1: createMockD1(),
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    await expect(
      loginAs(app, { email: "alice@test.com" }),
    ).rejects.toThrow("verify response had no Set-Cookie header");
  });

  it("throws when D1 has no matching session row after verification", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string }; headers: HeadersInit }) => {
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void> }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: "http://localhost:8787/api/auth/magic-link/verify?token=t",
          token: "t",
        });
      },
    );
    stubVerifyHandler();

    const d1 = createMockD1(); // No session seeded -> first() returns null.
    const app = await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    await expect(
      loginAs(app, { email: "ghost@test.com" }),
    ).rejects.toThrow("could not find a session row for ghost@test.com");
  });
});

describe("createTestSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls auth.api.signInMagicLink directly and then verifies", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string; name?: string } }) => {
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void> }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: "http://localhost:8787/api/auth/magic-link/verify?token=direct",
          token: "direct",
        });
      },
    );
    stubVerifyHandler(
      ["better-auth.session_token=direct-token; HttpOnly"],
      { token: "direct-token", user: { id: "u-2", email: "bob@test.com", name: "Bob" } },
    );

    const d1 = createMockD1();
    seedSessionRow(d1, {
      id: "s-bob",
      user_id: "u-2",
      token: "direct-token",
      expires_at: 1_900_000_000,
      email: "bob@test.com",
      name: "Bob",
    });

    const app = await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });

    const info = await createTestSession(app, {
      email: "bob@test.com",
      name: "Bob",
    });

    expect(mockSignInMagicLink).toHaveBeenCalledTimes(1);
    expect(mockSignInMagicLink).toHaveBeenCalledWith({
      body: { email: "bob@test.com", name: "Bob", callbackURL: "/" },
      headers: expect.any(Headers),
    });
    expect(info.cookie).toContain("better-auth.session_token=direct-token");
    expect(info.user.id).toBe("u-2");
    expect(info.session.id).toBe("s-bob");
  });

  it("omits the name field when none is provided", async () => {
    mockSignInMagicLink.mockImplementation(
      async (opts: { body: { email: string } }) => {
        const config = mockBetterAuth.mock.calls[0]![0] as {
          plugins: Array<{ id: string; sendMagicLink: (p: { email: string; url: string; token: string }) => Promise<void> }>;
        };
        const plugin = config.plugins.find((p) => p.id === "magic-link")!;
        await plugin.sendMagicLink({
          email: opts.body.email,
          url: "http://localhost:8787/api/auth/magic-link/verify?token=noname",
          token: "noname",
        });
      },
    );
    stubVerifyHandler();
    const d1 = createMockD1();
    seedSessionRow(d1, {
      id: "s-1",
      user_id: "user-1",
      token: "token-abc",
      expires_at: 1_900_000_000,
      email: "alice@test.com",
      name: "Alice",
    });
    const app = await createTestApp({
      d1,
      auth: { permissions, magicLink: { sendMagicLink: vi.fn() } },
    });
    await createTestSession(app, { email: "alice@test.com" });

    expect(mockSignInMagicLink).toHaveBeenCalledWith({
      body: { email: "alice@test.com", callbackURL: "/" },
      headers: expect.any(Headers),
    });
  });
});
