import type { AuthInstance } from "./types";

/**
 * Creates `loader` and `action` handlers for a React Router auth catch-all route.
 *
 * The returned handlers forward all requests to the Better Auth handler via
 * the {@link AuthInstance} obtained from the `getAuth` callback. Use this in
 * a splat route (e.g., `routes/auth.$.tsx`) to handle magic link callbacks,
 * passkey endpoints, and other Better Auth API routes.
 *
 * `getAuth` can be either:
 * - `() => AuthInstance` — for the simple, single-tenant case.
 * - `(request) => AuthInstance` — for multi-tenant deployments that need
 *   to construct the auth instance from the request (e.g. resolving
 *   `passkeys.rpId` from the request hostname).
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
 * const { loader, action } = createAuthRouteHandlers((request) => {
 *   const e = env.get();
 *   return initAuth({ d1: e.DB, appUrl: e.APP_URL }, request);
 * });
 *
 * export { loader, action };
 * ```
 */
export function createAuthRouteHandlers(
  getAuth: ((request: Request) => AuthInstance) | (() => AuthInstance),
) {
  function handleRequest({ request }: { request: Request }) {
    // Both 0-arg and 1-arg factories are supported. The `any` cast is
    // safe because each branch only passes the arguments the function
    // actually expects; TS can't narrow the union on `.length`.
    const instance =
      getAuth.length === 0
        ? (getAuth as () => AuthInstance)()
        : (getAuth as (request: Request) => AuthInstance)(request);
    return instance.handler(request);
  }

  return { loader: handleRequest, action: handleRequest };
}
