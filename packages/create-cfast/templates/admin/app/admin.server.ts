import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin/server";
import type { AdminAuthConfig, AdminUser } from "@cfast/admin/server";
import type { AuthInstance } from "@cfast/auth";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";
import { appDb } from "~/cfast.server";
import * as schema from "~/db/schema";

// The admin auth adapter's role callbacks do NOT receive a `Request`
// (the admin panel keeps `AdminAuthConfig` request-agnostic so it can
// stay decoupled from React Router), which means we cannot use the
// per-request cache from `auth.helpers.server` here.
//
// Instead we memoize by the D1 binding. `env.get()` returns the same
// bindings object for the lifetime of a worker isolate, and the bindings
// themselves are the same reference across requests, so a `WeakMap`
// keyed by the D1 handle gives us one `AuthInstance` per worker without
// ever leaking across d1 handles (useful for tests that swap D1s).
//
// Net effect: getRoles + setRole + removeRole on a single user-detail
// view now share one auth instance instead of instantiating three
// Better Auth clients.
const authByD1 = new WeakMap<D1Database, AuthInstance>();

function getAdminAuth(): AuthInstance {
  const e = env.get();
  const cached = authByD1.get(e.DB);
  if (cached) return cached;
  const instance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
  authByD1.set(e.DB, instance);
  return instance;
}

const auth: AdminAuthConfig = {
  async requireUser(request: Request) {
    const ctx = await requireAuthContext(request);
    const user: AdminUser = {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      avatarUrl: null,
      roles: ctx.user.roles,
    };
    return { user, grants: ctx.grants };
  },

  hasRole(user: AdminUser, role: string) {
    return hasRole(
      user as Parameters<typeof hasRole>[0],
      role as Parameters<typeof hasRole>[1],
    );
  },

  async getRoles(userId: string) {
    return getAdminAuth().roles.get(userId);
  },

  async setRole(userId: string, role: string) {
    await getAdminAuth().roles.set(userId, role);
  },

  async removeRole(userId: string, role: string) {
    await getAdminAuth().roles.remove(userId, role);
  },

  async setRoles(userId: string, roles: string[]) {
    await getAdminAuth().roles.setAll(userId, roles);
  },
};

// `appDb` is `(grants, user) => Db`, which is exactly the shape that
// @cfast/admin's `db` field expects. Reusing the same factory means the
// admin loader/action and the rest of the app share one `createDb`
// definition (no more duplicated `createDbForAdmin` boilerplate -- #149).

const adminConfig = {
  db: appDb,
  auth,
  schema: {
    items: schema.items,
  },
  users: {
    assignableRoles: ["admin", "member"],
  },
  dashboard: {
    widgets: [
      { type: "count" as const, table: "items", label: "Total Items" },
      { type: "recent" as const, table: "items", label: "Recent Items", limit: 5 },
    ],
  },
  requiredRole: "admin",
};

const tableMetas = await introspectSchema(adminConfig.schema);

export const adminLoader = createAdminLoader(adminConfig, tableMetas);
export const adminAction = createAdminAction(adminConfig, tableMetas);
