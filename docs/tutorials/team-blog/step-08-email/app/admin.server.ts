import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";
import type { AdminAuthConfig, AdminUser } from "@cfast/admin";
import { createDb } from "@cfast/db";
import type { DbConfig } from "@cfast/db";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";
import * as schema from "~/db/schema";

// ---------------------------------------------------------------------------
// Admin auth adapter
// ---------------------------------------------------------------------------

const auth: AdminAuthConfig = {
  async requireUser(request: Request) {
    const ctx = await requireAuthContext(request);
    const user: AdminUser = {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      avatarUrl: ctx.user.avatarUrl,
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
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    return authInstance.getRoles(userId);
  },

  async setRole(userId: string, role: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.setRole(userId, role);
  },

  async removeRole(userId: string, role: string) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.removeRole(userId, role);
  },

  async setRoles(userId: string, roles: string[]) {
    const e = env.get();
    const authInstance = initAuth({ d1: e.DB, appUrl: e.APP_URL });
    await authInstance.setRoles(userId, roles);
  },
};

// ---------------------------------------------------------------------------
// DB factory
// ---------------------------------------------------------------------------

function createDbForAdmin(grants: unknown[], user: { id: string } | null) {
  const e = env.get();
  return createDb({
    d1: e.DB,
    schema: schema as unknown as DbConfig["schema"],
    grants: grants as Parameters<typeof createDb>[0]["grants"],
    user,
    cache: false,
  });
}

// ---------------------------------------------------------------------------
// Admin config
// ---------------------------------------------------------------------------

const adminConfig = {
  db: createDbForAdmin,
  auth,
  schema: {
    users: schema.users,
    posts: schema.posts,
    roles: schema.roles,
  },
  users: {
    assignableRoles: ["admin", "editor", "reader"],
  },
  dashboard: {
    widgets: [
      { type: "count" as const, table: "users", label: "Total Users" },
      { type: "count" as const, table: "posts", label: "Total Posts" },
      { type: "recent" as const, table: "posts", label: "Recent Posts", limit: 5 },
    ],
  },
  requiredRole: "admin",
};

const tableMetas = await introspectSchema(adminConfig.schema);

export const adminLoader = createAdminLoader(adminConfig, tableMetas);
export const adminAction = createAdminAction(adminConfig, tableMetas);
