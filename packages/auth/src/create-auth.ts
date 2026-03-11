import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { drizzle } from "drizzle-orm/d1";
import { resolveGrants } from "@cfast/permissions";
import type { Grant } from "@cfast/permissions";
import { createRoleManager } from "./roles";
import type {
  AuthConfig,
  AuthContext,
  AuthenticatedContext,
  AuthEnvConfig,
  AuthInstance,
} from "./types";

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

export function createAuth(config: AuthConfig) {
  const anonymousRoles = config.anonymousRoles ?? [];
  const anonymousGrants: Grant[] = resolveGrants(
    config.permissions,
    anonymousRoles,
  );
  const loginPath = config.redirects?.loginPath ?? "/login";

  return function initAuth(env: AuthEnvConfig): AuthInstance {
    const roleManager = createRoleManager(env.d1);
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
      } catch {
        // If Better Auth throws (e.g., tables don't exist yet), return anonymous
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

    return {
      createContext,
      requireUser,
      getRoles: roleManager.getRoles,
      setRole: roleManager.setRole,
      setRoles: roleManager.setRoles,
      removeRole: roleManager.removeRole,
      handler: (request: Request) => auth.handler(request),
      api: auth,
    };
  };
}

export { parseExpiresIn };
