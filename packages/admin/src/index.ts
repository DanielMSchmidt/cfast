/** @module admin */
export { createAdmin } from "./create-admin.js";
export { createAdminAuthAdapter } from "./admin-auth-adapter.js";
export { introspectSchema } from "./introspect.js";
export { createAdminLoader } from "./loader.js";
export { createAdminAction } from "./action.js";
export { createAdminComponent } from "./components/admin-root.js";

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
