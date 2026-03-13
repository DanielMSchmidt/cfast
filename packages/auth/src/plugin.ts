/**
 * Route helper for React Router v7's routes.ts.
 *
 * Generates a catch-all route entry for Better Auth's API endpoints.
 * The consumer must create a handler file that uses `createAuthRouteHandlers`.
 *
 * Usage in `app/routes.ts`:
 * ```ts
 * import type { RouteConfig } from "@react-router/dev/routes";
 * import { authRoutes } from "@cfast/auth/plugin";
 *
 * export default [
 *   ...authRoutes({ handlerFile: "routes/auth.$.tsx" }),
 *   // ... other routes
 * ] satisfies RouteConfig;
 * ```
 *
 * The handler file (`routes/auth.$.tsx`):
 * ```ts
 * import { createAuthRouteHandlers } from "@cfast/auth";
 * const { loader, action } = createAuthRouteHandlers(() => getAuth());
 * export { loader, action };
 * ```
 */

type RouteConfigEntry = {
  id?: string;
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  file: string;
  children?: RouteConfigEntry[];
};

type AuthRoutesOptions = {
  /** Path to the auth handler file, relative to appDirectory */
  handlerFile: string;
  /** Base path for auth routes. Default: "auth" */
  basePath?: string;
};

export function authRoutes(options: AuthRoutesOptions): RouteConfigEntry[] {
  const basePath = options.basePath ?? "auth";

  return [
    {
      id: "cfast-auth",
      path: `${basePath}/*`,
      file: options.handlerFile,
    },
  ];
}
