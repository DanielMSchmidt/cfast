import type { AdminConfig } from "./types.js";
import { introspectSchema } from "./introspect.js";
import { createAdminLoader } from "./loader.js";
import { createAdminAction } from "./action.js";
import { createAdminComponent } from "./components/admin-root.js";

/**
 * Create a complete admin panel from your Drizzle schema.
 *
 * Introspects your schema, applies any {@link TableOverrides}, and produces a
 * `{ loader, action, Component }` triple that you mount on a single React Router
 * route. The admin panel includes list views, detail views, create/edit forms,
 * user management, and a dashboard -- all derived from your schema and permissions.
 *
 * For server/client code splitting, use the individual factories
 * ({@link createAdminLoader}, {@link createAdminAction}, {@link createAdminComponent})
 * instead.
 *
 * @param config - The admin configuration including DB factory, auth adapter, and schema.
 * @returns A promise resolving to an object with `loader`, `action`, and `Component` to mount on a React Router route.
 *
 * @example
 * ```typescript
 * // app/routes/admin.tsx
 * import { createAdmin } from "@cfast/admin";
 * import * as schema from "~/schema";
 *
 * const admin = await createAdmin({
 *   db: (grants, user) => createDb({ d1: env.DB, schema, grants, user }),
 *   auth,
 *   schema,
 *   requiredRole: "admin",
 * });
 *
 * export const loader = admin.loader;
 * export const action = admin.action;
 * export default admin.Component;
 * ```
 */
export async function createAdmin(config: AdminConfig) {
  const tableMetas = await introspectSchema(config.schema, config.tables);
  const loader = createAdminLoader(config, tableMetas);
  const action = createAdminAction(config, tableMetas);
  const Component = createAdminComponent(tableMetas);

  return { loader, action, Component };
}
