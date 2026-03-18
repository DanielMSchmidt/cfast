import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin";
import { createAdminAuth } from "@cfast/auth";
import { createDb } from "@cfast/db";
import type { DbConfig } from "@cfast/db";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";
import * as schema from "~/db/schema";

// ---------------------------------------------------------------------------
// Admin auth adapter — one line instead of ~150
// ---------------------------------------------------------------------------

const auth = createAdminAuth(() =>
  initAuth({ d1: env.get().DB, appUrl: env.get().APP_URL })
);

// ---------------------------------------------------------------------------
// DB factory — called per-request by @cfast/admin's loader/action
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
    comments: schema.comments,
    auditLogs: schema.auditLogs,
  },
  users: {
    assignableRoles: ["admin", "editor", "author"],
  },
  dashboard: {
    widgets: [
      { type: "count" as const, table: "users", label: "Total Users" },
      { type: "count" as const, table: "posts", label: "Total Posts" },
      { type: "count" as const, table: "comments", label: "Total Comments" },
      { type: "recent" as const, table: "posts", label: "Recent Posts", limit: 5 },
      { type: "recent" as const, table: "users", label: "Recent Users", limit: 5 },
    ],
  },
  requiredRole: "admin",
};

// ---------------------------------------------------------------------------
// Introspect schema (shared between server and client)
// ---------------------------------------------------------------------------

const tableMetas = introspectSchema(adminConfig.schema);

// ---------------------------------------------------------------------------
// Server-only loader and action
// ---------------------------------------------------------------------------

export const adminLoader = createAdminLoader(adminConfig, tableMetas);
export const adminAction = createAdminAction(adminConfig, tableMetas);
