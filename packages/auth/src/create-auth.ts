import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { drizzle } from "drizzle-orm/d1";
import { resolveGrants } from "@cfast/permissions";
import type { Grant } from "@cfast/permissions";
import { createRoleManager } from "./roles";
import { createImpersonationManager } from "./impersonation";
import type {
  AuthConfig,
  AuthContext,
  AuthenticatedContext,
  AuthEnvConfig,
  AuthInstance,
} from "./types";

/**
 * Parses a human-readable duration string into seconds.
 *
 * Supports suffixes: `s` (seconds), `m` (minutes), `h` (hours), `d` (days).
 * Returns 30 days in seconds if the format is unrecognized.
 *
 * @param value - Duration string (e.g., `"30d"`, `"12h"`, `"60m"`, `"3600s"`).
 * @returns The duration in seconds.
 */
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60 * 60 * 24 * 30; // default 30d
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "s":
      return num;
    case "m":
      return num * 60;
    case "h":
      return num * 3600;
    case "d":
      return num * 86400;
    default:
      return num;
  }
}

/**
 * Creates a pre-configured auth factory for Cloudflare Workers.
 *
 * Returns an `initAuth()` function that accepts per-request environment bindings
 * ({@link AuthEnvConfig}) and produces a fully initialized {@link AuthInstance}
 * with session management, role assignment, impersonation, and magic link support.
 *
 * @param config - The auth configuration including permissions, authentication methods, and role rules.
 * @returns A factory function `(env: AuthEnvConfig) => AuthInstance` to call per-request.
 *
 * @example
 * ```ts
 * import { createAuth } from "@cfast/auth";
 * import { permissions } from "./permissions";
 *
 * export const initAuth = createAuth({
 *   permissions,
 *   magicLink: {
 *     sendMagicLink: async ({ email, url }) => {
 *       await sendEmail({ to: email, html: `<a href="${url}">Sign in</a>` });
 *     },
 *   },
 *   redirects: { afterLogin: "/", loginPath: "/login" },
 * });
 *
 * // Per-request initialization:
 * const auth = initAuth({ d1: env.DB, appUrl: "https://myapp.com" });
 * const ctx = await auth.requireUser(request);
 * ```
 */
export function createAuth(config: AuthConfig) {
  const anonymousRoles = config.anonymousRoles ?? [];
  const anonymousGrants: Grant[] = resolveGrants(
    config.permissions,
    anonymousRoles,
  );
  const loginPath = config.redirects?.loginPath ?? "/login";

  return function initAuth(env: AuthEnvConfig): AuthInstance {
    const roleManager = createRoleManager(env.d1, {
      tableName: config.roleTableName,
      roleGrants: config.roleGrants,
    });
    const impersonationManager = createImpersonationManager(env.d1);
    const plugins = [];

    if (config.magicLink) {
      plugins.push(
        magicLink({ sendMagicLink: config.magicLink.sendMagicLink }),
      );
    }

    const expiresIn = config.session?.expiresIn
      ? parseExpiresIn(config.session.expiresIn)
      : undefined;

    const auth = betterAuth({
      baseURL: env.appUrl,
      database: drizzleAdapter(drizzle(env.d1), {
        provider: "sqlite",
        usePlural: true,
        ...(config.schema ? { schema: config.schema } : {}),
      }),
      emailAndPassword: { enabled: true },
      plugins,
      ...(expiresIn !== undefined ? { session: { expiresIn } } : {}),
    });

    async function createContext(request: Request): Promise<AuthContext> {
      try {
        const sessionResult = await auth.api.getSession({
          headers: request.headers,
        });

        if (!sessionResult) {
          return { user: null, grants: anonymousGrants };
        }

        const { user, session: _session } = sessionResult;

        // Check for active impersonation
        const impersonation =
          await impersonationManager.getActiveImpersonation(user.id);

        if (impersonation) {
          // Fetch target user's roles and resolve grants as the target
          let targetRoles = await roleManager.getRoles(
            impersonation.targetUserId,
          );
          if (targetRoles.length === 0) {
            targetRoles = config.defaultRoles ?? ["reader"];
          }
          const grants = resolveGrants(config.permissions, targetRoles);

          return {
            user: {
              id: impersonation.targetUserId,
              email: user.email,
              name: user.name ?? "",
              avatarUrl: user.image ?? null,
              roles: targetRoles,
              isImpersonating: true,
              realUser: { id: user.id, name: user.name ?? "" },
            },
            grants,
          };
        }

        let roles = await roleManager.getRoles(user.id);

        if (roles.length === 0) {
          roles = config.defaultRoles ?? ["reader"];
        }

        const grants = resolveGrants(config.permissions, roles);

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
            avatarUrl: user.image ?? null,
            roles,
          },
          grants,
        };
      } catch (err) {
        console.error("[cfast/auth] createContext error:", err);
        return { user: null, grants: anonymousGrants };
      }
    }

    async function requireUser(
      request: Request,
    ): Promise<AuthenticatedContext> {
      const ctx = await createContext(request);

      if (ctx.user === null) {
        const redirectTo = new URL(request.url).pathname;
        const headers = new Headers();
        headers.set("Location", loginPath);
        headers.set(
          "Set-Cookie",
          `cfast_redirect_to=${encodeURIComponent(redirectTo)}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
        );
        throw new Response(null, { status: 302, headers });
      }

      return ctx as AuthenticatedContext;
    }

    const allowedImpersonationRoles =
      config.impersonation?.allowedRoles ?? ["admin"];

    return {
      createContext,
      requireUser,
      getRoles: roleManager.getRoles,
      setRole: roleManager.setRole,
      setRoles: roleManager.setRoles,
      removeRole: roleManager.removeRole,
      impersonate: async (
        adminUserId: string,
        targetUserId: string,
      ): Promise<void> => {
        const adminRoles = await roleManager.getRoles(adminUserId);
        const canImpersonate = adminRoles.some((r) =>
          allowedImpersonationRoles.includes(r),
        );
        if (!canImpersonate) {
          throw new Error("Not authorized to impersonate");
        }
        await impersonationManager.impersonate(adminUserId, targetUserId);
      },
      stopImpersonating: impersonationManager.stopImpersonating,
      sendMagicLink: async (params: {
        email: string;
        callbackURL?: string;
      }) => {
        if (!config.magicLink) {
          throw new Error(
            "Magic link plugin not configured. Add magicLink to createAuth config.",
          );
        }
        await (
          auth.api as unknown as {
            signInMagicLink: (opts: {
              body: { email: string; callbackURL: string };
              headers: HeadersInit;
            }) => Promise<unknown>;
          }
        ).signInMagicLink({
          body: {
            email: params.email,
            callbackURL:
              params.callbackURL ?? config.redirects?.afterLogin ?? "/",
          },
          headers: new Headers(),
        });
      },
      handler: (request: Request) => auth.handler(request),
      api: auth,
    };
  };
}

export { parseExpiresIn };
