/**
 * @module admin/server
 *
 * Server-only entry for `@cfast/admin`. Re-exports the loader, action, and
 * schema introspection helpers without dragging in the React component tree
 * (which depends on `@mui/joy` and `@cfast/ui`'s React contexts).
 *
 * Use this entry from `app/admin.server.ts` so the file's transitive
 * dependency closure stays small at cold-import time and so context-bearing
 * modules from `@cfast/ui` cannot accidentally end up in the server bundle.
 *
 * Mount the React component separately on the route file's default export
 * via the root `@cfast/admin` entry's `createAdminComponent`.
 *
 * @example
 * ```ts
 * // app/admin.server.ts
 * import { createAdminLoader, createAdminAction, introspectSchema } from "@cfast/admin/server";
 * ```
 *
 * ```ts
 * // app/routes/admin.tsx
 * import { createAdminComponent } from "@cfast/admin";
 * import { adminLoader, adminAction, tableMetas } from "~/admin.server";
 *
 * export const loader = adminLoader;
 * export const action = adminAction;
 * export default createAdminComponent(tableMetas);
 * ```
 */
export { createAdminLoader } from "./loader.js";
export { createAdminAction } from "./action.js";
export { createAdminAuthAdapter } from "./admin-auth-adapter.js";
export { introspectSchema } from "./introspect.js";

export type { AdminAuthAdapterOptions } from "./admin-auth-adapter.js";
export type {
  AdminConfig,
  AdminAuthConfig,
  AdminUser,
  CreateDbFn,
  TableOverrides,
  RowAction,
  RowActionCallback,
  RowActionContext,
  TableAction,
  UserManagementConfig,
  DashboardConfig,
  DashboardWidget,
  DashboardStat,
  RecentItem,
  AdminColumnConfig,
  AdminTableMeta,
  AdminLoaderData,
  AdminActionResult,
} from "./types.js";
