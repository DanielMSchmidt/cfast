import type { AdminConfig } from "./types.js";
import { introspectSchema } from "./introspect.js";
import { createAdminLoader } from "./loader.js";
import { createAdminAction } from "./action.js";
import { createAdminComponent } from "./components/admin-root.js";

/**
 * Create a complete admin panel from your Drizzle schema.
 *
 * Returns `{ loader, action, Component }` — mount these on a single React Router route.
 *
 * @example
 * ```typescript
 * const admin = createAdmin({ db, auth, schema });
 *
 * export const loader = admin.loader;
 * export const action = admin.action;
 * export default admin.Component;
 * ```
 */
export function createAdmin(config: AdminConfig) {
  const tableMetas = introspectSchema(config.schema, config.tables);
  const loader = createAdminLoader(config, tableMetas);
  const action = createAdminAction(config, tableMetas);
  const Component = createAdminComponent(tableMetas);

  return { loader, action, Component };
}
