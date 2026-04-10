import type { AdminAuthConfig, AdminUser } from "./types.js";
import type { Grant } from "@cfast/permissions";

/**
 * A minimal auth instance interface — the subset of `@cfast/auth`'s
 * `AuthInstance` that the admin adapter needs. Duplicated here to avoid
 * a hard dependency on `@cfast/auth`.
 */
type AuthInstanceLike = {
  requireUser: (
    request: Request,
  ) => Promise<{ user: { id: string; email: string; name: string; avatarUrl?: string | null; roles: string[] }; grants: Grant[] }>;
  getRoles: (userId: string) => Promise<string[]>;
  setRole: (userId: string, role: string) => Promise<void>;
  removeRole: (userId: string, role: string) => Promise<void>;
  setRoles: (userId: string, roles: string[]) => Promise<void>;
};

/**
 * Options for {@link createAdminAuthAdapter}.
 */
export type AdminAuthAdapterOptions = {
  /**
   * Factory that returns an initialized auth instance per invocation.
   *
   * Called on every admin operation to guarantee fresh env bindings on
   * Cloudflare Workers. The returned object must satisfy the
   * `AuthInstanceLike` structural interface (a subset of `@cfast/auth`'s
   * `AuthInstance`).
   *
   * @example
   * ```ts
   * getAuth: () => initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL })
   * ```
   */
  getAuth: () => AuthInstanceLike;
};

/**
 * Creates a complete `AdminAuthConfig` from a single auth-instance factory.
 *
 * Replaces the ~50 lines of manual `AdminAuthConfig` boilerplate that every
 * cfast app copy-pastes in `admin.server.ts`. The adapter delegates every
 * method to the auth instance returned by `getAuth()`.
 *
 * This function complements `createAdminAuth` from `@cfast/auth` — they
 * produce the same result. The difference is where you import from:
 *
 * - `import { createAdminAuth } from "@cfast/auth"` — when you already
 *   depend on `@cfast/auth` in the file
 * - `import { createAdminAuthAdapter } from "@cfast/admin"` — when you
 *   want the admin package to be the single import in `admin.server.ts`
 *
 * @param options - Configuration with a `getAuth` factory.
 * @returns A complete `AdminAuthConfig` object ready to pass to `createAdmin()` or `createAdminLoader`/`createAdminAction`.
 *
 * @example
 * ```ts
 * import { createAdminAuthAdapter, createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";
 * import { initAuth } from "~/auth.setup.server";
 * import { env } from "~/env";
 * import * as schema from "~/db/schema";
 * import { appDb } from "~/db/client";
 *
 * const auth = createAdminAuthAdapter({
 *   getAuth: () => initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL }),
 * });
 *
 * const adminConfig = {
 *   db: appDb,
 *   auth,
 *   schema: schema as Record<string, unknown>,
 *   requiredRole: "admin",
 * };
 *
 * const tableMetas = await introspectSchema(adminConfig.schema);
 * export const adminLoader = createAdminLoader(adminConfig, tableMetas);
 * export const adminAction = createAdminAction(adminConfig, tableMetas);
 * ```
 */
export function createAdminAuthAdapter(
  options: AdminAuthAdapterOptions,
): AdminAuthConfig {
  const { getAuth } = options;

  return {
    async requireUser(request: Request) {
      const ctx = await getAuth().requireUser(request);
      const user: AdminUser = {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
        avatarUrl: (ctx.user as { avatarUrl?: string | null }).avatarUrl ?? null,
        roles: ctx.user.roles,
      };
      return { user, grants: ctx.grants };
    },

    hasRole(user: AdminUser, role: string): boolean {
      return user.roles.includes(role);
    },

    async getRoles(userId: string) {
      return getAuth().getRoles(userId);
    },

    async setRole(userId: string, role: string) {
      await getAuth().setRole(userId, role);
    },

    async removeRole(userId: string, role: string) {
      await getAuth().removeRole(userId, role);
    },

    async setRoles(userId: string, roles: string[]) {
      await getAuth().setRoles(userId, roles);
    },
  };
}
