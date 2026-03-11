import type { AuthInstance } from "./types";

/**
 * Creates loader and action handlers for a React Router auth catch-all route.
 *
 * Usage in `routes/auth.$.tsx`:
 * ```ts
 * import { createAuthRouteHandlers } from "@cfast/auth";
 * import { initAuth } from "~/auth.setup.server";
 * import { env } from "~/env";
 *
 * const { loader, action } = createAuthRouteHandlers(() => {
 *   const e = env.get();
 *   return initAuth({ d1: e.DB, appUrl: e.APP_URL });
 * });
 *
 * export { loader, action };
 * ```
 */
export function createAuthRouteHandlers(getAuth: () => AuthInstance) {
  async function loader({ request }: { request: Request }) {
    return getAuth().handler(request);
  }

  async function action({ request }: { request: Request }) {
    return getAuth().handler(request);
  }

  return { loader, action };
}
