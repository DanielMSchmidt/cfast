import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createAuth } from "@cfast/auth";
import * as authSchema from "@cfast/auth/schema";
import { definePermissions, grant } from "@cfast/permissions";
import {
  applyAuthMigrations,
  resetAuthTables,
} from "../helpers/auth-tables";

const permissions = definePermissions({
  roles: ["anonymous", "user", "admin"] as const,
  grants: {
    anonymous: [],
    user: [],
    admin: [grant("manage", "all")],
  },
});

function createTestAuth() {
  return createAuth({
    permissions,
    anonymousRoles: ["anonymous"],
    defaultRoles: ["user"],
    impersonation: { allowedRoles: ["admin"] },
  });
}

describe("session-lifecycle", () => {
  beforeAll(async () => {
    await applyAuthMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetAuthTables(env.DB);
  });

  it("initAuth creates auth instance with real D1", () => {
    const initAuth = createTestAuth();
    const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

    expect(auth).toBeDefined();
    expect(typeof auth.createContext).toBe("function");
    expect(typeof auth.requireUser).toBe("function");
    expect(typeof auth.getRoles).toBe("function");
    expect(typeof auth.setRole).toBe("function");
    expect(typeof auth.setRoles).toBe("function");
    expect(typeof auth.removeRole).toBe("function");
    expect(typeof auth.impersonate).toBe("function");
    expect(typeof auth.stopImpersonating).toBe("function");
    expect(typeof auth.handler).toBe("function");
  });

  it("createContext returns null user for unauthenticated request", async () => {
    const initAuth = createTestAuth();
    const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

    const request = new Request("http://localhost:8787/some-page");
    const ctx = await auth.createContext(request);

    expect(ctx.user).toBeNull();
    expect(ctx.grants).toBeDefined();
    expect(Array.isArray(ctx.grants)).toBe(true);
  });

  it("handler responds to Better Auth API routes", async () => {
    const initAuth = createTestAuth();
    const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

    // Better Auth exposes /api/auth/ok as a health check endpoint.
    const request = new Request("http://localhost:8787/api/auth/ok");
    const response = await auth.handler(request);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  });

  it("sendMagicLink creates verification token in D1", async () => {
    // Configure with a magic link sender that captures the call
    let capturedUrl: string | null = null;
    const initAuth = createAuth({
      permissions,
      schema: authSchema,
      anonymousRoles: ["anonymous"],
      defaultRoles: ["user"],
      magicLink: {
        sendMagicLink: async ({ url }) => {
          capturedUrl = url;
        },
      },
    });

    const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

    // Better Auth's magic link flow requires the user to exist first.
    // Create a user via the email+password signup endpoint so the user row exists.
    const signupRequest = new Request(
      "http://localhost:8787/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "magic@test.com",
          password: "Test1234!",
          name: "Magic User",
        }),
      },
    );
    const signupResponse = await auth.handler(signupRequest);
    expect(signupResponse.status).toBeLessThan(400);

    // Now send a magic link for that user
    await auth.sendMagicLink({ email: "magic@test.com" });

    // The custom sender should have received a URL
    expect(capturedUrl).not.toBeNull();
    expect(capturedUrl).toContain("http");

    // A verification row should exist in D1 (Better Auth stores the magic link token there)
    const allVerifications = await env.DB.prepare(
      "SELECT * FROM verifications",
    ).all();
    expect(allVerifications.results.length).toBeGreaterThanOrEqual(1);
  });

  it("requireUser throws a redirect Response for unauthenticated request", async () => {
    const initAuth = createTestAuth();
    const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

    const request = new Request("http://localhost:8787/protected");

    try {
      await auth.requireUser(request);
      // Should not reach here
      expect.unreachable("requireUser should have thrown");
    } catch (thrown: unknown) {
      // requireUser throws a Response (302 redirect) for unauthenticated requests
      expect(thrown).toBeInstanceOf(Response);
      const response = thrown as Response;
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login");
      // Should set redirect cookie
      const cookie = response.headers.get("Set-Cookie");
      expect(cookie).toContain("cfast_redirect_to");
      expect(cookie).toContain("%2Fprotected");
    }
  });
});
