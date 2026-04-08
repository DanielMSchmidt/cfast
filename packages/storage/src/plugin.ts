/**
 * Route helpers for React Router v7's routes.ts.
 *
 * Generates the opinionated `/uploads/*` splat route for @cfast/storage's
 * end-to-end upload + proxy story. Consumers pair this with
 * {@link createStorageRouteHandlers} exported from `~/storage.server.ts`
 * (or equivalent) to get a working upload + download + signed-URL pipeline
 * with zero boilerplate.
 *
 * Usage in `app/routes.ts`:
 * ```ts
 * import type { RouteConfig } from "@react-router/dev/routes";
 * import { storageRoutes } from "@cfast/storage/plugin";
 *
 * export default [
 *   ...storageRoutes({ handlerFile: "routes/uploads.$.tsx" }),
 *   // ... other routes
 * ] satisfies RouteConfig;
 * ```
 *
 * Handler file (`app/routes/uploads.$.tsx`):
 * ```ts
 * import { createStorageRouteHandlers } from "@cfast/storage";
 * import { storage } from "~/storage";
 * import { requireUser } from "~/auth.server";
 *
 * const { loader, action } = createStorageRouteHandlers({
 *   storage,
 *   requireUser,
 * });
 *
 * export { loader, action };
 * ```
 */

/**
 * Minimal local definition of React Router v7's route-config entry shape, so
 * `@cfast/storage/plugin` doesn't need a hard dependency on
 * `@react-router/dev`. The returned array is structurally compatible with
 * `RouteConfig` and can be spread into the user's routes.ts file.
 */
type RouteConfigEntry = {
  id?: string;
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  file: string;
  children?: RouteConfigEntry[];
};

/** Options for {@link storageRoutes}. */
export type StorageRoutesOptions = {
  /**
   * Path to the storage handler file, relative to the React Router
   * `appDirectory` (usually `app/`). The file must re-export `loader` and
   * `action` from {@link createStorageRouteHandlers}.
   */
  handlerFile: string;
  /**
   * Base path where the storage routes are mounted. Defaults to `"uploads"`.
   *
   * @example `storageRoutes({ handlerFile: "...", basePath: "files" })`
   * mounts the proxy + upload routes at `/files/*`.
   */
  basePath?: string;
};

/**
 * Build the React Router route-config entries that mount the `/uploads/*`
 * proxy + upload endpoint. The returned array is meant to be spread into
 * the user's `routes.ts` default export.
 *
 * The single splat route dispatches on HTTP method inside the handler file:
 *
 * - `GET /uploads/<key>` — streams the R2 object at `key`, optionally
 *   gated by a signed token or an `ownerCheck` function.
 * - `POST /uploads/<filetype>` — uploads a multipart file for the named
 *   filetype, returning `{ key, url }`.
 *
 * @param options - Handler file location and (optional) base path.
 * @returns One or more {@link RouteConfigEntry} objects.
 */
export function storageRoutes(options: StorageRoutesOptions): RouteConfigEntry[] {
  const basePath = (options.basePath ?? "uploads").replace(/^\/+|\/+$/g, "");

  return [
    {
      id: "cfast-storage",
      path: `${basePath}/*`,
      file: options.handlerFile,
    },
  ];
}

/**
 * Backwards-friendly alias — the task description mentions
 * `createStorageRoutes` by name, so we export the same function under both
 * spellings to avoid surprising users.
 */
export const createStorageRoutes = storageRoutes;
