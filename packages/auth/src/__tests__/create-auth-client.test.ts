import { describe, it, expect, vi } from "vitest";

// Mock `better-auth/react` so we don't spin up a real Better Auth client
// (which would require a running Better Auth server endpoint).
vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn((_opts: unknown) => ({
    signIn: {
      magicLink: vi.fn(),
      passkey: vi.fn(),
      email: vi.fn(),
    },
    signOut: vi.fn(),
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    passkey: {
      addPasskey: vi.fn(),
      deletePasskey: vi.fn(),
    },
    admin: {
      stopImpersonating: vi.fn(),
    },
  })),
}));

vi.mock("better-auth/client/plugins", () => ({
  magicLinkClient: vi.fn(() => ({ id: "magic-link" })),
}));

vi.mock("@better-auth/passkey/client", () => ({
  passkeyClient: vi.fn(() => ({ id: "passkey" })),
}));

const {
  createAuthClient,
  magicLinkClient,
  passkeyClient,
} = await import("../client/create-auth-client");
import type {
  AuthClient,
  AuthClientErrorResult,
  AuthClientSession,
  AuthClientSessionHookResult,
} from "../client/create-auth-client";

describe("createAuthClient", () => {
  it("returns an object with the public AuthClient surface", () => {
    const client = createAuthClient({
      plugins: [magicLinkClient(), passkeyClient()],
    });

    // The runtime shape must match the TypeScript AuthClient surface.
    expect(typeof client.signIn.magicLink).toBe("function");
    expect(typeof client.signOut).toBe("function");
    expect(typeof client.useSession).toBe("function");
    expect(client.passkey).toBeDefined();
    expect(typeof client.passkey!.addPasskey).toBe("function");
    expect(typeof client.passkey!.deletePasskey).toBe("function");
  });

  it("useSession returns an object with data and isPending", () => {
    const client = createAuthClient();
    const result = client.useSession();

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("isPending");
    expect(result.isPending).toBe(false);
    expect(result.data).toBeNull();
  });

  it("signIn.magicLink is callable with email only", async () => {
    const client = createAuthClient();
    // This exercises the type signature: { email: string; callbackURL?: string } -> Promise<AuthClientErrorResult>
    await client.signIn.magicLink({ email: "user@example.com" });
  });

  it("signIn.magicLink accepts an optional callbackURL", async () => {
    const client = createAuthClient();
    await client.signIn.magicLink({
      email: "user@example.com",
      callbackURL: "/dashboard",
    });
  });
});

describe("AuthClient type", () => {
  it("is satisfiable by a minimal hand-rolled mock (portability check)", () => {
    // This test is primarily a compile-time check: if someone refactors
    // `AuthClient` in a way that forces it to reference an internal
    // `better-auth` path, this minimal mock will stop satisfying the
    // type and the test will fail to type-check.
    const mockClient: AuthClient = {
      signIn: {
        magicLink: async (_opts) => ({ error: null }),
      },
      signOut: async () => undefined,
      useSession: () => ({ data: null, isPending: false }),
    };

    expect(typeof mockClient.signIn.magicLink).toBe("function");
    expect(typeof mockClient.signOut).toBe("function");
    expect(typeof mockClient.useSession).toBe("function");
  });

  it("AuthClientErrorResult can be constructed from a plain object", () => {
    const ok: AuthClientErrorResult = { error: null };
    const failed: AuthClientErrorResult = {
      error: { message: "Invalid email", code: "INVALID_EMAIL" },
    };

    expect(ok.error).toBeNull();
    expect(failed.error?.message).toBe("Invalid email");
  });

  it("AuthClientSession has user and session fields", () => {
    const session: AuthClientSession = {
      user: { id: "u1", email: "user@example.com" },
      session: { id: "s1" },
    };

    expect(session.user).toBeDefined();
    expect(session.session).toBeDefined();
  });

  it("AuthClientSessionHookResult has data and isPending fields", () => {
    const pending: AuthClientSessionHookResult = {
      data: null,
      isPending: true,
    };
    const loaded: AuthClientSessionHookResult = {
      data: { user: { id: "u1" }, session: { id: "s1" } },
      isPending: false,
    };

    expect(pending.isPending).toBe(true);
    expect(loaded.data).not.toBeNull();
  });
});
