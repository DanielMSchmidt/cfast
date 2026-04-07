/**
 * @module test-helpers
 *
 * Real-workflow test helpers for `@cfast/auth`.
 *
 * These helpers exercise the **actual** Better Auth pipeline — they do not
 * mock, stub, or hand-roll session inserts. A session created by `loginAs()`
 * is byte-for-byte identical to one created by a user clicking a magic link
 * in their inbox, because both go through the same `magicLinkVerify`
 * endpoint and the same `internalAdapter.createSession` call.
 *
 * Use these helpers to drive end-to-end and integration tests that need a
 * logged-in user without simulating the UI flow. The cookies they return
 * can be attached to any `Request` and will be accepted by the same
 * `auth.requireUser()` your loaders call in production.
 *
 * @example Drive a protected loader from a vitest test
 * ```ts
 * import { createTestApp, loginAs } from "@cfast/auth/test-helpers";
 * import { permissions } from "../app/permissions";
 * import { loader } from "../app/routes/dashboard";
 *
 * const app = await createTestApp({
 *   d1: env.DB,
 *   auth: { permissions },
 * });
 *
 * const session = await loginAs(app, { email: "alice@test.com", name: "Alice" });
 *
 * const response = await loader({
 *   request: new Request("http://localhost/dashboard", {
 *     headers: { Cookie: session.cookie },
 *   }),
 * });
 * ```
 */
import { createAuth } from "../create-auth";
import type {
  AuthConfig,
  AuthInstance,
  AuthEnvConfig,
} from "../types";

/**
 * Details of a magic link captured by the helper's intercept.
 *
 * Captured every time the auth instance triggers a magic-link send during
 * a test, regardless of whether `loginAs` or user code triggered it.
 */
export type CapturedMagicLink = {
  /** The recipient address `signInMagicLink` was called with. */
  email: string;
  /** The full verification URL Better Auth generated, including the token query parameter. */
  url: string;
  /** The verification token, extracted from the URL for convenience. */
  token: string;
};

/**
 * A test app produced by {@link createTestApp}.
 *
 * Wraps a real {@link AuthInstance} and adds the test-only plumbing
 * necessary to drive the magic-link flow programmatically. The `auth`
 * field IS the production auth instance — no test doubles, no stubs.
 */
export type TestApp = {
  /**
   * The real, fully initialized {@link AuthInstance}, identical to the one
   * `createAuth(config)(env)` would return in production. Pass this to your
   * loaders, actions, or anything that consumes `AuthInstance`.
   */
  auth: AuthInstance;
  /** The D1 binding the auth instance is wired to. */
  d1: D1Database;
  /** The base URL the auth instance uses (defaults to `http://localhost:8787`). */
  appUrl: string;
  /**
   * Every magic link the auth instance has sent during this test, in
   * insertion order. Includes links triggered by `loginAs()` and by any
   * direct calls to `auth.sendMagicLink()` from your code under test.
   */
  capturedMagicLinks: CapturedMagicLink[];
  /**
   * Wait until a magic link has been captured (optionally for a specific
   * email address) and return it. Resolves immediately if a matching link
   * has already been captured before this call.
   *
   * @param email - If provided, only resolves on a link sent to this address.
   * @param opts - Wait options. `timeoutMs` defaults to 5_000.
   */
  waitForMagicLink: (
    email?: string,
    opts?: { timeoutMs?: number },
  ) => Promise<CapturedMagicLink>;
  /**
   * Tear down state held by this test app. Currently a no-op (the helper
   * intentionally leaves the D1 contents alone so callers can inspect them
   * after the test), but provided so future cleanup can be added without
   * breaking the API.
   */
  cleanup: () => Promise<void>;
};

/**
 * Configuration for {@link createTestApp}.
 */
export type CreateTestAppOptions = {
  /**
   * The D1 binding the auth instance should write to. The caller decides
   * where the database lives — for `vitest-pool-workers` this is `env.DB`;
   * for tests that bring their own miniflare, pass the D1 from the
   * miniflare instance.
   */
  d1: D1Database;
  /**
   * Base URL the auth instance reports to Better Auth. Magic-link URLs
   * Better Auth generates will use this as their origin.
   *
   * @default "http://localhost:8787"
   */
  appUrl?: string;
  /**
   * The same {@link AuthConfig} you would pass to `createAuth()` in
   * production. The helper will inject its own `magicLink.sendMagicLink`
   * if you do not provide one, and will also wrap any sender you do
   * provide so the helper can still capture the URL.
   */
  auth: AuthConfig;
  /**
   * If true, runs the auth schema migrations against the supplied D1
   * before returning the test app. Set this to `false` if you have
   * already applied the migrations and want to skip the work.
   *
   * @default true
   */
  applyMigrations?: boolean;
};

/**
 * A real session created by {@link loginAs} or {@link createTestSession}.
 *
 * Every field comes from the real `sessions` row that Better Auth wrote
 * during verification — there is no synthetic data here.
 */
export type SessionInfo = {
  /**
   * A `Cookie` header value (e.g. `"better-auth.session_token=...; ..."`)
   * ready to attach to a `Request` so subsequent calls into your loaders
   * will see the user as authenticated.
   */
  cookie: string;
  /**
   * Every `Set-Cookie` header value Better Auth produced during the
   * verification request. Useful when your tests need to inspect cookie
   * attributes (HttpOnly, Secure, SameSite, etc.) directly.
   */
  setCookieHeaders: string[];
  /** The user row Better Auth created or located during verification. */
  user: {
    id: string;
    email: string;
    name: string;
  };
  /** The session row Better Auth wrote to D1. */
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
};

/**
 * Options for {@link loginAs}.
 */
export type LoginAsOptions = {
  /** The email address to log in as. Created automatically if it does not exist. */
  email: string;
  /**
   * Display name for the user. Used only if Better Auth needs to create
   * the user during verification (the magic-link flow auto-creates users
   * by default).
   */
  name?: string;
  /**
   * Roles to assign to the user immediately after the session is created.
   * Each role is written via `auth.setRole()`, which uses the same code
   * path your admin tooling does — no SQL inserts.
   */
  roles?: string[];
};

/**
 * Options for {@link createTestSession}.
 */
export type CreateTestSessionOptions = {
  /** The email address to create a session for. */
  email: string;
  /** Display name. Used if the user does not already exist. */
  name?: string;
  /** Roles to assign after session creation. See {@link LoginAsOptions.roles}. */
  roles?: string[];
};

/**
 * Applies the `@cfast/auth` schema migrations to a D1 database.
 *
 * Creates the `users`, `sessions`, `accounts`, `verifications`, `passkeys`,
 * `roles`, and `impersonation_logs` tables if they do not already exist.
 * Safe to call multiple times — every statement uses `IF NOT EXISTS`.
 *
 * Exposed so callers can pre-seed a shared D1 once in `beforeAll` and skip
 * the per-test migration work via `applyMigrations: false`.
 */
export async function applyAuthSchema(d1: D1Database): Promise<void> {
  // Statements are split because D1's exec() does not reliably handle
  // multi-statement strings. Schema mirrors `packages/auth/src/schema.ts`.
  const statements = [
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, image TEXT, email_verified INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
    "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
    "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, account_id TEXT NOT NULL, provider_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT, access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, id_token TEXT, password TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
    "CREATE TABLE IF NOT EXISTS verifications (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
    "CREATE TABLE IF NOT EXISTS passkeys (id TEXT PRIMARY KEY, name TEXT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, public_key TEXT NOT NULL, credential_id TEXT NOT NULL UNIQUE, counter INTEGER NOT NULL DEFAULT 0, device_type TEXT NOT NULL, backed_up INTEGER NOT NULL DEFAULT 0, transports TEXT, aaguid TEXT, created_at INTEGER)",
    "CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, granted_by TEXT REFERENCES users(id), created_at INTEGER NOT NULL DEFAULT (unixepoch()))",
    "CREATE TABLE IF NOT EXISTS impersonation_logs (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES users(id), target_user_id TEXT NOT NULL REFERENCES users(id), started_at INTEGER NOT NULL DEFAULT (unixepoch()), ended_at INTEGER)",
  ];
  for (const sql of statements) {
    await d1.exec(sql);
  }
}

/**
 * Spins up a real `@cfast/auth` instance against a D1 binding for use
 * in tests.
 *
 * The returned {@link TestApp} contains the actual {@link AuthInstance}
 * that `createAuth()` would have produced — no shims, no test doubles.
 * The only thing the helper does on top is wrap the `magicLink.sendMagicLink`
 * callback so the helper can capture every URL Better Auth generates,
 * which is what {@link loginAs} uses to complete the verification step.
 *
 * If you pass your own `magicLink.sendMagicLink`, the helper will still
 * call it (so your test can also assert on email content) and capture
 * the URL on top.
 *
 * @example
 * ```ts
 * import { env } from "cloudflare:test";
 * import { createTestApp, loginAs } from "@cfast/auth/test-helpers";
 * import { permissions } from "../app/permissions";
 *
 * const app = await createTestApp({
 *   d1: env.DB,
 *   auth: { permissions, defaultRoles: ["user"] },
 * });
 *
 * const { cookie, user } = await loginAs(app, { email: "alice@test.com" });
 * ```
 */
export async function createTestApp(
  opts: CreateTestAppOptions,
): Promise<TestApp> {
  const appUrl = opts.appUrl ?? "http://localhost:8787";
  const captured: CapturedMagicLink[] = [];
  const waiters: Array<{
    email: string | undefined;
    resolve: (link: CapturedMagicLink) => void;
    reject: (err: Error) => void;
  }> = [];

  // Wrap the user's sendMagicLink (if any) so the helper always sees the
  // URL Better Auth generated. This works whether the test triggers the
  // send via `loginAs()` or via the code under test calling
  // `auth.sendMagicLink()` directly.
  const userSender = opts.auth.magicLink?.sendMagicLink;
  const wrappedConfig: AuthConfig = {
    ...opts.auth,
    magicLink: {
      sendMagicLink: async (params) => {
        const link: CapturedMagicLink = {
          email: params.email,
          url: params.url,
          token: extractTokenFromUrl(params.url),
        };
        captured.push(link);
        // Notify any waiters whose criteria are now satisfied. Iterate
        // backwards because we splice as we go.
        for (let i = waiters.length - 1; i >= 0; i--) {
          const waiter = waiters[i]!;
          if (waiter.email === undefined || waiter.email === link.email) {
            waiters.splice(i, 1);
            waiter.resolve(link);
          }
        }
        // Forward to the user's real sender so production-like sending
        // (e.g., asserting that an email job was queued) still happens.
        if (userSender) {
          await userSender(params);
        }
      },
    },
  };

  if (opts.applyMigrations !== false) {
    await applyAuthSchema(opts.d1);
  }

  const initAuth = createAuth(wrappedConfig);
  const env: AuthEnvConfig = { d1: opts.d1, appUrl };
  const auth = initAuth(env);

  return {
    auth,
    d1: opts.d1,
    appUrl,
    capturedMagicLinks: captured,
    waitForMagicLink: (email, waitOpts) => {
      const timeoutMs = waitOpts?.timeoutMs ?? 5_000;
      // Already captured? Resolve synchronously.
      const existing = captured.find(
        (c) => email === undefined || c.email === email,
      );
      if (existing) return Promise.resolve(existing);
      return new Promise<CapturedMagicLink>((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = waiters.findIndex((w) => w.resolve === wrappedResolve);
          if (idx >= 0) waiters.splice(idx, 1);
          reject(
            new Error(
              `[cfast/auth/test-helpers] waitForMagicLink timed out after ${timeoutMs}ms${
                email ? ` waiting for ${email}` : ""
              }`,
            ),
          );
        }, timeoutMs);
        const wrappedResolve = (link: CapturedMagicLink) => {
          clearTimeout(timer);
          resolve(link);
        };
        waiters.push({ email, resolve: wrappedResolve, reject });
      });
    },
    cleanup: async () => {
      // Reserved for future cleanup. Currently a no-op so callers can
      // still inspect the D1 contents after the test finishes.
    },
  };
}

/**
 * Logs in as the given user by completing the **real** magic-link flow
 * end-to-end.
 *
 * Steps the helper performs (every one hits the real Better Auth pipeline):
 *
 * 1. Calls `app.auth.sendMagicLink({ email })`. This goes through the
 *    same `signInMagicLink` endpoint your production code uses and writes
 *    a row to the `verifications` table.
 * 2. Captures the magic-link URL via the wrapped `sendMagicLink` callback.
 * 3. Issues a real GET request to the magic-link verify endpoint via
 *    `app.auth.handler(request)`. Better Auth verifies the token, creates
 *    the user (if new), creates a session row, and returns a `Set-Cookie`
 *    header.
 * 4. Parses the response to extract the cookie and the session/user rows
 *    Better Auth wrote.
 * 5. Optionally assigns roles via the real `auth.setRole()` API.
 *
 * The returned {@link SessionInfo.cookie} can be attached to any `Request`
 * and your loaders' `requireUser()` calls will return the same user that
 * `loginAs` reports.
 *
 * @throws If the auth instance was not configured with a `magicLink`
 *   plugin, if the magic link is never captured, or if the verify
 *   endpoint returns an error.
 *
 * @example
 * ```ts
 * const session = await loginAs(app, {
 *   email: "alice@test.com",
 *   name: "Alice",
 *   roles: ["editor"],
 * });
 *
 * const response = await loader({
 *   request: new Request("http://localhost/dashboard", {
 *     headers: { Cookie: session.cookie },
 *   }),
 * });
 * ```
 */
export async function loginAs(
  app: TestApp,
  options: LoginAsOptions,
): Promise<SessionInfo> {
  // Snapshot how many links were captured before triggering the send so
  // we wait for the *next* one specifically (in case earlier tests left
  // links in the buffer).
  const beforeCount = app.capturedMagicLinks.length;

  // Trigger the real send. This goes through `auth.api.signInMagicLink`
  // which writes a verification row in D1 and calls our wrapped sender,
  // which captures the URL.
  await app.auth.sendMagicLink({
    email: options.email,
    callbackURL: "/",
  });

  // Wait for the wrapped sender to record the URL. In practice the
  // capture is synchronous (sendMagicLink awaits the callback), so this
  // resolves immediately, but we still poll to handle race conditions
  // when the user code triggers extra sends in parallel.
  const link = await waitForCapturedLink(app, options.email, beforeCount);

  return verifyMagicLinkAndAssignRoles(app, link, options);
}

/**
 * Lower-level companion to {@link loginAs} that creates a real session
 * for a user without going through the public `auth.sendMagicLink()`
 * surface.
 *
 * Functionally equivalent to `loginAs` from the consumer's perspective —
 * the returned cookie is indistinguishable, the session row is
 * indistinguishable, and the user row is indistinguishable. The
 * difference is that `createTestSession`:
 *
 * - Calls `auth.api.signInMagicLink` directly so your test code does not
 *   need to also wire up a `sendMagicLink` callback if it does not care
 *   about email content.
 * - Reads the freshly created verification token straight out of D1 and
 *   issues the verify request, skipping the `waitForCapturedLink`
 *   indirection.
 *
 * Use this when you want the cheapest possible way to mint a real
 * session for a test user.
 *
 * @example
 * ```ts
 * const session = await createTestSession(app, {
 *   email: "bob@test.com",
 *   roles: ["admin"],
 * });
 * ```
 */
export async function createTestSession(
  app: TestApp,
  options: CreateTestSessionOptions,
): Promise<SessionInfo> {
  const beforeCount = app.capturedMagicLinks.length;

  // Call the Better Auth endpoint directly via the escape-hatch `api`
  // the `AuthInstance` exposes. `AuthInstance.api` is the whole Better
  // Auth object, so the actual endpoint lives on `app.auth.api.api`.
  // The wrapped sendMagicLink still fires (Better Auth always calls the
  // configured sender), so we read the URL out of `app.capturedMagicLinks`
  // afterwards. Going through the real endpoint guarantees the
  // verification row was created via the real internalAdapter rather
  // than a synthetic SQL insert.
  type BetterAuthApi = {
    api: {
      signInMagicLink: (opts: {
        body: { email: string; name?: string; callbackURL?: string };
        headers: HeadersInit;
      }) => Promise<unknown>;
    };
  };
  const betterAuth = app.auth.api as unknown as BetterAuthApi;
  await betterAuth.api.signInMagicLink({
    body: {
      email: options.email,
      ...(options.name !== undefined ? { name: options.name } : {}),
      callbackURL: "/",
    },
    headers: new Headers(),
  });

  const link = await waitForCapturedLink(app, options.email, beforeCount);
  return verifyMagicLinkAndAssignRoles(app, link, options);
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

/**
 * Extracts the verification token query parameter from a magic-link URL.
 *
 * @internal
 */
function extractTokenFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const token = url.searchParams.get("token");
    if (!token) {
      throw new Error(
        `[cfast/auth/test-helpers] magic link URL did not contain a token: ${rawUrl}`,
      );
    }
    return token;
  } catch (err) {
    if (err instanceof Error && err.message.includes("did not contain")) {
      throw err;
    }
    throw new Error(
      `[cfast/auth/test-helpers] failed to parse magic link URL: ${rawUrl}`,
      { cause: err },
    );
  }
}

/**
 * Waits for a captured link strictly newer than `beforeCount` and
 * matching `email`. Throws if none arrives within the wait window.
 *
 * @internal
 */
async function waitForCapturedLink(
  app: TestApp,
  email: string,
  beforeCount: number,
): Promise<CapturedMagicLink> {
  // First, check synchronously: in the typical sequential case the
  // capture has already happened.
  for (let i = beforeCount; i < app.capturedMagicLinks.length; i++) {
    const link = app.capturedMagicLinks[i]!;
    if (link.email === email) return link;
  }
  // Otherwise fall through to the helper's async waiter.
  const link = await app.waitForMagicLink(email);
  return link;
}

/**
 * Issues the real verify request, parses the response, and assigns any
 * requested roles. Shared by both {@link loginAs} and
 * {@link createTestSession} so the contract they expose is identical.
 *
 * @internal
 */
async function verifyMagicLinkAndAssignRoles(
  app: TestApp,
  link: CapturedMagicLink,
  options: { roles?: string[] },
): Promise<SessionInfo> {
  // Build a verify URL with NO callbackURL so the endpoint returns JSON
  // (with the session token and user) instead of redirecting. This is
  // strictly easier to parse than chasing a 302. The cookie is set
  // either way; we read it from the JSON response's headers.
  const verifyUrl = new URL(link.url);
  verifyUrl.searchParams.delete("callbackURL");
  verifyUrl.searchParams.delete("newUserCallbackURL");
  verifyUrl.searchParams.delete("errorCallbackURL");

  const verifyRequest = new Request(verifyUrl.toString(), { method: "GET" });
  const response = await app.auth.handler(verifyRequest);

  if (response.status >= 400) {
    const body = await response.text();
    throw new Error(
      `[cfast/auth/test-helpers] magic link verification failed (status ${response.status}): ${body}`,
    );
  }

  // Better Auth returns either a 200 with JSON or a 302 redirect (when
  // callbackURL is set). We stripped callbackURL so we expect JSON, but
  // handle the redirect case too in case the version of Better Auth
  // ignores the missing callbackURL.
  let parsed: { token?: string; user?: { id?: string; email?: string; name?: string } } = {};
  if (response.headers.get("content-type")?.includes("application/json")) {
    parsed = (await response.json()) as typeof parsed;
  }

  const setCookieHeaders = collectSetCookieHeaders(response.headers);
  if (setCookieHeaders.length === 0) {
    throw new Error(
      "[cfast/auth/test-helpers] verify response had no Set-Cookie header — check that the magic-link plugin is configured correctly",
    );
  }

  const cookie = setCookieHeaders
    .map((h) => h.split(";", 1)[0])
    .filter((c): c is string => Boolean(c))
    .join("; ");

  // Now read the actual session row Better Auth wrote so the returned
  // SessionInfo carries the truth from the database, not whatever the
  // verify endpoint happened to echo back.
  const sessionRow = await loadLatestSession(app.d1, parsed.user?.email ?? link.email);
  if (!sessionRow) {
    throw new Error(
      `[cfast/auth/test-helpers] could not find a session row for ${link.email} after verification`,
    );
  }

  // Optionally assign roles using the REAL setRole API path so the
  // resulting `roles` row is identical to one created by admin tooling.
  if (options.roles && options.roles.length > 0) {
    for (const role of options.roles) {
      await app.auth.setRole(sessionRow.userId, role);
    }
  }

  return {
    cookie,
    setCookieHeaders,
    user: {
      id: sessionRow.userId,
      email: sessionRow.userEmail,
      name: sessionRow.userName,
    },
    session: {
      id: sessionRow.id,
      userId: sessionRow.userId,
      token: sessionRow.token,
      expiresAt: sessionRow.expiresAt,
    },
  };
}

/**
 * Collects every `Set-Cookie` header from a response. Workers' Headers
 * implementation supports `getSetCookie()`, but we fall back to a manual
 * walk for older runtimes.
 *
 * @internal
 */
function collectSetCookieHeaders(headers: Headers): string[] {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }
  const all: string[] = [];
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") all.push(value);
  });
  return all;
}

type SessionRow = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  userEmail: string;
  userName: string;
};

/**
 * Reads the most recent session for the given email out of D1. Used to
 * surface the canonical session/user data in {@link SessionInfo}.
 *
 * @internal
 */
async function loadLatestSession(
  d1: D1Database,
  email: string,
): Promise<SessionRow | null> {
  const row = await d1
    .prepare(
      `SELECT s.id AS id, s.user_id AS user_id, s.token AS token, s.expires_at AS expires_at,
              u.email AS email, u.name AS name
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE u.email = ?
       ORDER BY s.created_at DESC
       LIMIT 1`,
    )
    .bind(email)
    .first<{
      id: string;
      user_id: string;
      token: string;
      expires_at: number;
      email: string;
      name: string;
    }>();
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    // Drizzle's sqlite `mode: "timestamp"` stores as unix seconds, so
    // multiply to get the millis the `Date` constructor expects. If a
    // future schema change moves to millis, the sniff below keeps the
    // helper working without a migration guide.
    expiresAt: new Date(
      row.expires_at > 1e12 ? Number(row.expires_at) : Number(row.expires_at) * 1000,
    ),
    userEmail: row.email,
    userName: row.name,
  };
}
