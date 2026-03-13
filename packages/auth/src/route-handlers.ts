import type { AuthInstance } from "./types";

/**
 * Creates `loader` and `action` handlers for a React Router auth catch-all route.
 *
 * The returned handlers forward all requests to the Better Auth handler via
 * the {@link AuthInstance} obtained from the `getAuth` callback. Use this in
 * a splat route (e.g., `routes/auth.$.tsx`) to handle magic link callbacks,
 * passkey endpoints, and other Better Auth API routes.
 *
 * @param getAuth - A factory function that returns a fully initialized {@link AuthInstance}.
 *   Called on every request so that the instance uses the correct per-request D1 binding.
 * @returns An object with `loader` and `action` functions compatible with React Router route modules.
 *
 * @example
 * ```ts
 * // routes/auth.$.tsx
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
  function handleRequest({ request }: { request: Request }) {
    return getAuth().handler(request);
  }

  return { loader: handleRequest, action: handleRequest };
}
