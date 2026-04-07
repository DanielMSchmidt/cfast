/**
 * Integration tests that prove `@cfast/auth/test-helpers` produces
 * sessions indistinguishable from the real magic-link flow a user goes
 * through in production.
 *
 * These tests run inside workerd (via @cloudflare/vitest-pool-workers)
 * so the D1 binding, Better Auth runtime, and cookie handling are all
 * real. A session row created by `loginAs()` is compared column-by-column
 * to a session row created by driving the full Better Auth HTTP flow
 * (sendMagicLink -> verify) by hand.
 */
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createAuth } from "@cfast/auth";
import * as authSchema from "@cfast/auth/schema";
import {
  createTestApp,
  loginAs,
  createTestSession,
  applyAuthSchema,
} from "@cfast/auth/test-helpers";
import { definePermissions, grant } from "@cfast/permissions";

const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  grants: {
    anonymous: [],
    user: [grant("read", "all")],
    editor: [grant("read", "all"), grant("update", "all")],
    admin: [grant("manage", "all")],
  },
});

const authConfig = {
  permissions,
  // Better Auth's drizzle adapter needs the schema passed explicitly
  // when the workspace runs outside the app that owns the Drizzle
  // setup. Without this, Better Auth tries to look up the `verifications`
  // model and fails.
  schema: authSchema,
  anonymousRoles: ["anonymous"],
  defaultRoles: ["user"],
  magicLink: {
    // The helper wraps this and captures URLs, but we still want to
    // verify the sender is invoked (so tests can assert on email content
    // if they wanted to).
    sendMagicLink: async () => {
      /* no-op: helper's wrapper is what captures the URL */
    },
  },
};

/**
 * A protected "loader" that mirrors what a production React Router
 * loader does: call `auth.requireUser(request)` and return the user.
 * The integration tests drive this loader to prove the cookie the
 * helper returns actually authenticates on the same code path that
 * production uses.
 */
async function protectedLoader(
  auth: ReturnType<ReturnType<typeof createAuth>>,
  request: Request,
) {
  const ctx = await auth.requireUser(request);
  return {
    userId: ctx.user.id,
    email: ctx.user.email,
    name: ctx.user.name,
    roles: ctx.user.roles,
    grantCount: ctx.grants.length,
  };
}

describe("test-helpers (integration)", () => {
  beforeAll(async () => {
    await applyAuthSchema(env.DB);
  });

  beforeEach(async () => {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM impersonation_logs"),
      env.DB.prepare("DELETE FROM roles"),
      env.DB.prepare("DELETE FROM passkeys"),
      env.DB.prepare("DELETE FROM verifications"),
      env.DB.prepare("DELETE FROM accounts"),
      env.DB.prepare("DELETE FROM sessions"),
      env.DB.prepare("DELETE FROM users"),
    ]);
  });

  describe("createTestApp", () => {
    it("creates a real AuthInstance wired to env.DB", async () => {
      const app = await createTestApp({
        d1: env.DB,
        appUrl: env.APP_URL,
        auth: authConfig,
        // Schema is already applied in beforeAll.
        applyMigrations: false,
      });

      expect(app.auth).toBeDefined();
      expect(typeof app.auth.requireUser).toBe("function");
      expect(typeof app.auth.handler).toBe("function");

      // A request against the real handler should succeed (Better Auth
      // exposes /api/auth/ok as a health check).
      const res = await app.auth.handler(
        new Request(`${env.APP_URL}/api/auth/ok`),
      );
      expect(res.status).toBe(200);
    });

    it("applies schema migrations when asked", async () => {
      // Drop the tables first so the migration has work to do.
      await env.DB.exec("DROP TABLE IF EXISTS impersonation_logs");
      await env.DB.exec("DROP TABLE IF EXISTS roles");
      await env.DB.exec("DROP TABLE IF EXISTS passkeys");
      await env.DB.exec("DROP TABLE IF EXISTS verifications");
      await env.DB.exec("DROP TABLE IF EXISTS accounts");
      await env.DB.exec("DROP TABLE IF EXISTS sessions");
      await env.DB.exec("DROP TABLE IF EXISTS users");

      await createTestApp({
        d1: env.DB,
        appUrl: env.APP_URL,
        auth: authConfig,
        // Explicitly true so the helper recreates everything.
        applyMigrations: true,
      });

      // Querying each table should succeed; if the migration didn't run
      // this would throw because the tables don't exist.
      await env.DB.prepare("SELECT COUNT(*) FROM users").first();
      await env.DB.prepare("SELECT COUNT(*) FROM sessions").first();
      await env.DB.prepare("SELECT COUNT(*) FROM verifications").first();
      await env.DB.prepare("SELECT COUNT(*) FROM roles").first();
    });
  });

  describe("loginAs", () => {
    it(
      "produces a real session the production requireUser accepts",
      { timeout: 30_000 },
      async () => {
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });

        const session = await loginAs(app, {
          email: "alice@test.com",
          name: "Alice",
        });

        // Cookie is populated.
        expect(session.cookie).toBeTruthy();
        expect(session.cookie).toContain("session");
        expect(session.setCookieHeaders.length).toBeGreaterThan(0);

        // Session row carries real IDs from the database.
        expect(session.user.email).toBe("alice@test.com");
        expect(session.user.id).toBeTruthy();
        expect(session.session.id).toBeTruthy();
        expect(session.session.userId).toBe(session.user.id);
        expect(session.session.token).toBeTruthy();
        expect(session.session.expiresAt).toBeInstanceOf(Date);
        expect(session.session.expiresAt.getTime()).toBeGreaterThan(Date.now());

        // CRITICAL: the cookie must authenticate on the REAL requireUser
        // path. This proves the helper is indistinguishable from a user
        // who clicked the magic link in their inbox.
        const loaderResult = await protectedLoader(
          app.auth,
          new Request(`${env.APP_URL}/dashboard`, {
            headers: { Cookie: session.cookie },
          }),
        );

        expect(loaderResult.userId).toBe(session.user.id);
        expect(loaderResult.email).toBe("alice@test.com");
        expect(loaderResult.roles).toEqual(["user"]); // from defaultRoles
        expect(loaderResult.grantCount).toBeGreaterThan(0);
      },
    );

    it(
      "assigns roles via the real setRole API path",
      { timeout: 30_000 },
      async () => {
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });

        const session = await loginAs(app, {
          email: "bob@test.com",
          name: "Bob",
          roles: ["editor"],
        });

        // The role should be persisted in the roles table exactly the
        // way `auth.setRole()` would write it.
        const rolesRow = await env.DB.prepare(
          "SELECT role FROM roles WHERE user_id = ?",
        )
          .bind(session.user.id)
          .all<{ role: string }>();
        expect(rolesRow.results.map((r) => r.role)).toEqual(["editor"]);

        // requireUser must see the editor role and its grants.
        const loaderResult = await protectedLoader(
          app.auth,
          new Request(`${env.APP_URL}/admin`, {
            headers: { Cookie: session.cookie },
          }),
        );
        expect(loaderResult.roles).toEqual(["editor"]);
      },
    );

    it(
      "produces a session row indistinguishable from a hand-driven magic-link flow",
      { timeout: 30_000 },
      async () => {
        // HAND-DRIVEN FLOW: simulate what a real user/client does by
        // calling the public Better Auth API directly and following the
        // verify link, capturing the URL manually.
        let handDrivenUrl: string | null = null;
        const initHandDriven = createAuth({
          ...authConfig,
          magicLink: {
            sendMagicLink: async ({ url }) => {
              handDrivenUrl = url;
            },
          },
        });
        const handDrivenAuth = initHandDriven({
          d1: env.DB,
          appUrl: env.APP_URL,
        });

        await handDrivenAuth.sendMagicLink({ email: "hand@test.com" });
        expect(handDrivenUrl).not.toBeNull();

        // Strip callbackURL so the verify endpoint returns JSON + sets a cookie.
        const verifyUrl = new URL(handDrivenUrl!);
        verifyUrl.searchParams.delete("callbackURL");
        verifyUrl.searchParams.delete("newUserCallbackURL");
        verifyUrl.searchParams.delete("errorCallbackURL");
        const handDrivenResponse = await handDrivenAuth.handler(
          new Request(verifyUrl.toString()),
        );
        expect(handDrivenResponse.status).toBeLessThan(400);
        const handDrivenCookieHeaders =
          typeof handDrivenResponse.headers.getSetCookie === "function"
            ? handDrivenResponse.headers.getSetCookie()
            : [];
        expect(handDrivenCookieHeaders.length).toBeGreaterThan(0);

        const handDrivenSessionRow = await env.DB.prepare(
          `SELECT s.id, s.user_id, s.token, s.expires_at, s.created_at, s.updated_at,
                  u.email, u.name, u.email_verified
           FROM sessions s INNER JOIN users u ON u.id = s.user_id
           WHERE u.email = ?
           ORDER BY s.created_at DESC LIMIT 1`,
        )
          .bind("hand@test.com")
          .first<{
            id: string;
            user_id: string;
            token: string;
            expires_at: number;
            created_at: number;
            updated_at: number;
            email: string;
            name: string;
            email_verified: number;
          }>();
        expect(handDrivenSessionRow).not.toBeNull();

        // HELPER-DRIVEN FLOW: now use loginAs() for a different user.
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });
        const helperSession = await loginAs(app, {
          email: "helper@test.com",
          name: "Helper User",
        });
        const helperSessionRow = await env.DB.prepare(
          `SELECT s.id, s.user_id, s.token, s.expires_at, s.created_at, s.updated_at,
                  u.email, u.name, u.email_verified
           FROM sessions s INNER JOIN users u ON u.id = s.user_id
           WHERE u.email = ?
           ORDER BY s.created_at DESC LIMIT 1`,
        )
          .bind("helper@test.com")
          .first<{
            id: string;
            user_id: string;
            token: string;
            expires_at: number;
            created_at: number;
            updated_at: number;
            email: string;
            name: string;
            email_verified: number;
          }>();
        expect(helperSessionRow).not.toBeNull();

        // The rows must have the same SHAPE and the same field types.
        // (IDs, tokens, timestamps differ between rows, but every field
        // must be populated the same way.)
        const handKeys = Object.keys(handDrivenSessionRow!).sort();
        const helperKeys = Object.keys(helperSessionRow!).sort();
        expect(helperKeys).toEqual(handKeys);

        // Same field types.
        for (const key of handKeys) {
          expect(typeof helperSessionRow![key as keyof typeof helperSessionRow]).toBe(
            typeof handDrivenSessionRow![key as keyof typeof handDrivenSessionRow],
          );
        }

        // Both sessions must authenticate on the exact same requireUser code path.
        const handDrivenCookie = handDrivenCookieHeaders
          .map((h) => h.split(";", 1)[0])
          .filter((c): c is string => Boolean(c))
          .join("; ");

        const handLoaderResult = await protectedLoader(
          handDrivenAuth,
          new Request(`${env.APP_URL}/dashboard`, {
            headers: { Cookie: handDrivenCookie },
          }),
        );
        const helperLoaderResult = await protectedLoader(
          app.auth,
          new Request(`${env.APP_URL}/dashboard`, {
            headers: { Cookie: helperSession.cookie },
          }),
        );

        // Both loaders returned consistent shapes and the same default role.
        expect(Object.keys(handLoaderResult).sort()).toEqual(
          Object.keys(helperLoaderResult).sort(),
        );
        expect(handLoaderResult.roles).toEqual(helperLoaderResult.roles);
        expect(handLoaderResult.grantCount).toBe(helperLoaderResult.grantCount);
        expect(handLoaderResult.email).toBe("hand@test.com");
        expect(helperLoaderResult.email).toBe("helper@test.com");

        // Both sessions live in the SAME sessions table alongside each
        // other, with identical column populations. The helper's cookie
        // is at no point a "test-mode" shortcut — it is a real session
        // that `createContext()` cannot tell apart from the hand-driven
        // one.
        const allSessions = await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM sessions",
        ).first<{ n: number }>();
        expect(Number(allSessions!.n)).toBe(2);
      },
    );

    it(
      "captures magic link URLs for inspection during the test",
      { timeout: 30_000 },
      async () => {
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });
        await loginAs(app, { email: "capture@test.com" });

        expect(app.capturedMagicLinks).toHaveLength(1);
        const captured = app.capturedMagicLinks[0]!;
        expect(captured.email).toBe("capture@test.com");
        expect(captured.url).toContain("/api/auth/magic-link/verify");
        expect(captured.url).toContain("token=");
        expect(captured.token).toBeTruthy();
        expect(captured.token.length).toBeGreaterThan(10);
      },
    );
  });

  describe("createTestSession", () => {
    it(
      "creates a real session via auth.api.signInMagicLink",
      { timeout: 30_000 },
      async () => {
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });

        const session = await createTestSession(app, {
          email: "direct@test.com",
          name: "Direct User",
        });

        expect(session.user.email).toBe("direct@test.com");
        expect(session.cookie).toBeTruthy();
        expect(session.session.expiresAt.getTime()).toBeGreaterThan(Date.now());

        // The session cookie must authenticate on the real requireUser path.
        const loaderResult = await protectedLoader(
          app.auth,
          new Request(`${env.APP_URL}/dashboard`, {
            headers: { Cookie: session.cookie },
          }),
        );
        expect(loaderResult.email).toBe("direct@test.com");
        expect(loaderResult.userId).toBe(session.user.id);

        // There must be exactly one session row for this user.
        const rows = await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?",
        )
          .bind(session.user.id)
          .first<{ n: number }>();
        expect(Number(rows!.n)).toBe(1);
      },
    );

    it(
      "assigns roles after the session is created",
      { timeout: 30_000 },
      async () => {
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });

        const session = await createTestSession(app, {
          email: "carol@test.com",
          name: "Carol",
          roles: ["admin"],
        });

        const rolesRow = await env.DB.prepare(
          "SELECT role FROM roles WHERE user_id = ?",
        )
          .bind(session.user.id)
          .all<{ role: string }>();
        expect(rolesRow.results.map((r) => r.role)).toEqual(["admin"]);

        const loaderResult = await protectedLoader(
          app.auth,
          new Request(`${env.APP_URL}/dashboard`, {
            headers: { Cookie: session.cookie },
          }),
        );
        expect(loaderResult.roles).toEqual(["admin"]);
      },
    );

    it(
      "produces a session indistinguishable from loginAs",
      { timeout: 30_000 },
      async () => {
        const app = await createTestApp({
          d1: env.DB,
          appUrl: env.APP_URL,
          auth: authConfig,
          applyMigrations: false,
        });

        // Use loginAs for one user.
        await loginAs(app, { email: "login@test.com", name: "Login User" });
        // Use createTestSession for another.
        await createTestSession(app, {
          email: "direct@test.com",
          name: "Direct User",
        });

        const rows = await env.DB.prepare(
          `SELECT s.id, s.user_id, s.token, s.expires_at, u.email
           FROM sessions s INNER JOIN users u ON u.id = s.user_id
           ORDER BY u.email`,
        ).all<{
          id: string;
          user_id: string;
          token: string;
          expires_at: number;
          email: string;
        }>();
        expect(rows.results).toHaveLength(2);

        // Same column set, same types.
        const [direct, login] = rows.results;
        for (const key of Object.keys(direct!)) {
          expect(typeof login![key as keyof typeof login]).toBe(
            typeof direct![key as keyof typeof direct],
          );
          expect(login![key as keyof typeof login]).toBeTruthy();
          expect(direct![key as keyof typeof direct]).toBeTruthy();
        }
      },
    );
  });
});
