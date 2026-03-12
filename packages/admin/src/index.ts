export { createAdmin } from "./create-admin.js";
export { introspectSchema } from "./introspect.js";
export { createAdminLoader } from "./loader.js";
export { createAdminAction } from "./action.js";
export { createAdminComponent } from "./components/admin-root.js";

export type {
  AdminConfig,
  AdminAuthConfig,
  AdminUser,
  CreateDbFn,
  TableOverrides,
  RowAction,
  TableAction,
  UserManagementConfig,
  DashboardConfig,
  DashboardWidget,
  AdminColumnConfig,
  AdminTableMeta,
  AdminLoaderData,
  AdminActionResult,
} from "./types.js";
