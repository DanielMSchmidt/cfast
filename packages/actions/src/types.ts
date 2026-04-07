import type { Db, Operation } from "@cfast/db";
import type { Grant } from "@cfast/permissions";

/**
 * A JSON-serializable value that can safely cross the server/client boundary.
 *
 * Used to constrain loader data so that {@link ActionDefinition.loader} and
 * {@link ComposedActions.loader} can merge `_actionPermissions` into it.
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable };

/**
 * A record of arbitrary external services an action handler may depend on.
 *
 * Services are registered once at {@link createActions} time and made
 * available on every action's {@link ActionContext} via `ctx.services`.
 * Use this to inject HTTP clients, email providers, cache adapters,
 * third-party APIs, etc., without each handler having to import them
 * directly — which both improves testability (services can be mocked
 * per-suite) and keeps action modules decoupled from concrete providers.
 *
 * @example
 * ```ts
 * type Services = {
 *   nutritionApi: { lookup: (name: string) => Promise<Nutrition> };
 *   mailer: { sendWelcome: (to: string) => Promise<void> };
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionServices = Record<string, any>;

/**
 * Context provided to every action's {@link OperationsFn}.
 *
 * Created by the `getContext` callback in {@link ActionsConfig} and passed
 * alongside the database instance and parsed input to each action. When
 * `services` are registered with {@link createActions}, they appear on
 * `ctx.services` so handlers can access them without importing module-
 * level singletons.
 *
 * @typeParam TUser - The shape of the authenticated user object.
 * @typeParam TServices - The shape of the registered services map. Defaults
 *   to an empty record when no services are registered.
 *
 * @example
 * ```ts
 * const ctx: ActionContext<{ id: string; role: string }, { nutritionApi: NutritionApi }> = {
 *   db,
 *   user: { id: "u_1", role: "author" },
 *   grants: [{ action: "manage", subject: "all" }],
 *   services: { nutritionApi },
 * };
 * ```
 */
export type ActionContext<TUser, TServices extends ActionServices = ActionServices> = {
  /** The Drizzle database instance from `@cfast/db`. */
  db: Db;
  /** The authenticated user for the current request. */
  user: TUser;
  /** The user's permission {@link Grant | grants}, used for permission checking. */
  grants: Grant[];
  /**
   * External services registered with {@link createActions}. Defaults to
   * an empty object `{}` when no services are provided at factory time,
   * so handlers can always safely destructure `ctx.services`.
   */
  services: TServices;
};

/**
 * Subset of React Router loader/action arguments consumed by `@cfast/actions`.
 *
 * Mirrors the shape React Router passes to `loader` and `action` exports,
 * trimmed to only the fields the actions system needs.
 */
export type RequestArgs = {
  /** The incoming HTTP request. */
  request: Request;
  /** URL parameters from the route pattern (e.g., `{ postId: "abc" }`). */
  params: Record<string, string | undefined>;
  /** Optional context object (e.g., Cloudflare Workers env via `context.cloudflare.env`). */
  context?: unknown;
};

/**
 * Configuration for the {@link createActions} factory.
 *
 * Provides a `getContext` callback that resolves the per-request
 * {@link ActionContext} (database, user, grants) for every action
 * invocation, plus an optional `services` bag that is injected into
 * every action's context as `ctx.services`.
 *
 * `getContext` is allowed to return an `ActionContext` without the
 * `services` field (the backward-compatible shape) — the factory will
 * fill it in with the registered services (or an empty object) so that
 * every handler can always rely on `ctx.services` being defined.
 *
 * @typeParam TUser - The shape of the authenticated user object.
 * @typeParam TServices - The shape of the registered services map.
 *
 * @example Basic usage without services
 * ```ts
 * const config: ActionsConfig<AppUser> = {
 *   getContext: async ({ request }) => {
 *     const ctx = await requireAuthContext(request);
 *     const db = createCfDb(env.DB, ctx);
 *     return { db, user: ctx.user, grants: ctx.grants };
 *   },
 * };
 * ```
 *
 * @example With service injection
 * ```ts
 * const { createAction } = createActions<AppUser, { nutritionApi: NutritionApi }>({
 *   getContext: async ({ request }) => { ... },
 *   services: { nutritionApi: createNutritionApi(env.NUTRITION_API_KEY) },
 * });
 *
 * const lookupFood = createAction((db, input, ctx) => ({
 *   permissions: [],
 *   run: async () => ctx.services.nutritionApi.lookup(input.name),
 * }));
 * ```
 */
export type ActionsConfig<TUser, TServices extends ActionServices = ActionServices> = {
  /**
   * Resolves the per-request action context from the route handler arguments.
   *
   * The returned context does not need to include `services` — the factory
   * merges the registered `services` config in automatically. This keeps
   * the callback ergonomic for the common case (auth + DB only) while
   * still letting advanced users return a fully-formed context.
   */
  getContext: (
    args: RequestArgs,
  ) => Promise<Omit<ActionContext<TUser, TServices>, "services"> & { services?: TServices }>;
  /**
   * External services made available to every action handler as
   * `ctx.services`. Registering services here keeps handlers free of
   * module-level imports of third-party APIs and makes it trivial to
   * mock them in tests. Defaults to `{}` when omitted.
   */
  services?: TServices;
};

/**
 * A function that builds a database {@link Operation} for an action.
 *
 * Receives the Drizzle database, the parsed input, and the full
 * {@link ActionContext}. Returns an `Operation` (from `@cfast/db`) that
 * encapsulates both the query/mutation and its permission descriptors.
 *
 * @typeParam TInput - The expected input shape for this action.
 * @typeParam TResult - The return type of the operation.
 * @typeParam TUser - The shape of the authenticated user object.
 *
 * @example
 * ```ts
 * const deletePostOps: OperationsFn<{ postId: string }, Response, AppUser> =
 *   (db, input, ctx) =>
 *     compose(
 *       [db.delete(posts).where(eq(posts.id, input.postId))],
 *       async (runDelete) => {
 *         await runDelete({});
 *         return redirect("/");
 *       },
 *     );
 * ```
 */
export type OperationsFn<TInput, TResult, TUser> = (
  db: Db,
  input: TInput,
  ctx: ActionContext<TUser>,
) => Operation<TResult>;

/**
 * The resolved permission status for a single action.
 *
 * Computed by {@link checkPermissionStatus} and sent to the client
 * via `_actionPermissions` in loader data.
 */
export type ActionPermissionStatus = {
  /** Whether the user has all required permissions for this action. */
  permitted: boolean;
  /** `true` when the user lacks every permission — the UI should hide the control entirely. */
  invisible: boolean;
  /** Human-readable explanation when `permitted` is `false`, otherwise `null`. */
  reason: string | null;
};

/**
 * A map from action name to its {@link ActionPermissionStatus}.
 *
 * Injected into loader data under the `_actionPermissions` key by
 * {@link ActionDefinition.loader} or {@link ComposedActions.loader}.
 */
export type ActionPermissionsMap = Record<string, ActionPermissionStatus>;

/**
 * An opaque descriptor passed to the client to configure the `useActions` hook.
 *
 * Created by {@link ActionDefinition.client} or {@link ComposedActions.client}.
 * Contains the action names and the key used to read permission data from loader results.
 */
export type ClientDescriptor = {
  /** Brand field to distinguish this type at the type level. */
  _brand: "ActionClientDescriptor";
  /** The list of action names this descriptor covers. */
  actionNames: readonly string[];
  /** The loader-data key where {@link ActionPermissionsMap} is stored. */
  permissionsKey: string;
};

/**
 * A single action definition returned by `createAction()`.
 *
 * Provides four facets: a React Router action handler, a loader wrapper
 * that injects permission status, a client descriptor for `useActions`,
 * and a `buildOperation` method for advanced composition.
 *
 * @typeParam TInput - The expected input shape for this action.
 * @typeParam TResult - The return type of the action handler.
 * @typeParam TUser - The shape of the authenticated user object.
 *
 * @example
 * ```ts
 * const deletePost = createAction<{ postId: string }, Response>(
 *   (db, input, ctx) =>
 *     compose(
 *       [db.delete(posts).where(eq(posts.id, input.postId))],
 *       async (runDelete) => { await runDelete({}); return redirect("/"); },
 *     ),
 * );
 *
 * // Use as a route action
 * export const action = deletePost.action;
 * // Wrap a loader to inject permissions
 * export const loader = deletePost.loader(myLoader);
 * ```
 */
export type ActionDefinition<TInput, TResult, TUser> = {
  /** React Router action handler. Parses input, resolves context, and runs the operation. */
  action: (args: RequestArgs) => Promise<TResult>;
  /**
   * Wraps a loader function to inject {@link ActionPermissionsMap} into its return value.
   *
   * The wrapper resolves the action context, builds the operation to extract
   * permission descriptors, checks them against the user's grants, and merges
   * the result as `_actionPermissions`.
   */
  loader: <TLoaderData extends Record<string, Serializable>>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  /** Opaque descriptor for the `useActions` client hook. */
  client: ClientDescriptor;
  /** Builds the raw {@link Operation} for this action, useful for cross-action composition. */
  buildOperation: (db: Db, input: TInput, ctx: ActionContext<TUser>) => Operation<TResult>;
};

/**
 * The result of combining multiple {@link ActionDefinition | action definitions}
 * via `composeActions()`.
 *
 * Provides a single action handler that dispatches by the `_action` discriminator,
 * a loader wrapper that checks permissions for all actions at once, a client
 * descriptor covering all action names, and the original action map.
 *
 * @typeParam TActions - A record mapping action names to their {@link ActionDefinition} types.
 *
 * @example
 * ```ts
 * const composed = composeActions({
 *   deletePost,
 *   publishPost,
 *   unpublishPost,
 * });
 *
 * export const action = composed.action;
 * export const loader = composed.loader(myLoader);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComposedActions<TActions extends Record<string, ActionDefinition<any, any, any>>> = {
  /** Combined action handler that dispatches to the correct action based on `_action` field. */
  action: (args: RequestArgs) => Promise<unknown>;
  /**
   * Wraps a loader function to inject {@link ActionPermissionsMap} for all composed actions.
   *
   * Checks permissions for every action in the map and merges the results
   * into loader data under `_actionPermissions`.
   */
  loader: <TLoaderData extends Record<string, Serializable>>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  /** Opaque descriptor covering all composed action names, for the `useActions` client hook. */
  client: ClientDescriptor;
  /** The original action definitions, keyed by name. */
  actions: TActions;
};
