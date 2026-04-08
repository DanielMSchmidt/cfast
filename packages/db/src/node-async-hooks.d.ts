/**
 * Narrow ambient declaration for `node:async_hooks`.
 *
 * `@cfast/db` targets Cloudflare Workers and only depends on
 * `@cloudflare/workers-types`. The Workers runtime provides
 * `node:async_hooks` under the `nodejs_compat` flag, but `workers-types`
 * does not ship a type definition for it, and pulling in `@types/node`
 * would drag the rest of Node's global shape into the package.
 *
 * The declaration here is intentionally minimal: only the
 * `AsyncLocalStorage` class with the two methods `@cfast/db` actually
 * uses (`getStore` and `run`). The shape is structurally compatible with
 * both Node's native definition and the Workers polyfill, so consumers
 * that already have `@types/node` in scope (e.g. the docs build via
 * starlight-typedoc) merge cleanly with this declaration instead of
 * conflicting.
 */
declare module "node:async_hooks" {
  export class AsyncLocalStorage<T> {
    getStore(): T | undefined;
    run<R>(store: T, fn: () => R): R;
  }
}
