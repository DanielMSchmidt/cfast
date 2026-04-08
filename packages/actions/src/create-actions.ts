import type { Db, Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";
import { getTableName } from "@cfast/permissions";

import { extractActionName, parseInput } from "./parse-input.js";
import type { InputParser } from "./input-schema.js";
import type {
  ActionContext,
  ActionDefinition,
  ActionPermissionStatus,
  ActionPermissionsMap,
  ActionServices,
  ActionsConfig,
  ClientDescriptor,
  ComposedActions,
  OperationsFn,
  RequestArgs,
  Serializable,
} from "./types.js";

/**
 * Checks a user's {@link Grant | grants} against a set of permission descriptors
 * and returns an {@link ActionPermissionStatus}.
 *
 * If no descriptors are provided the action is unconditionally permitted.
 * When some descriptors are denied, `permitted` is `false` and `reason`
 * lists the missing permissions. When *all* descriptors are denied,
 * `invisible` is also `true` (indicating the UI should hide the control entirely).
 *
 * @param grants - The user's resolved permission grants.
 * @param descriptors - Permission descriptors extracted from an operation.
 * @returns The resolved {@link ActionPermissionStatus} for the action.
 *
 * @example
 * ```ts
 * import { checkPermissionStatus } from "@cfast/actions";
 *
 * const status = checkPermissionStatus(user.grants, operation.permissions);
 * if (!status.permitted) {
 *   console.log(status.reason); // "Missing permissions: delete on posts"
 * }
 * ```
 */
export function checkPermissionStatus(
  grants: Grant[],
  descriptors: PermissionDescriptor[],
): ActionPermissionStatus {
  if (descriptors.length === 0) {
    return { permitted: true, invisible: false, reason: null };
  }

  const denied: PermissionDescriptor[] = [];

  for (const desc of descriptors) {
    const matched = grants.some((grant) => {
      const actionMatch = grant.action === "manage" || grant.action === desc.action;
      const subjectMatch =
        grant.subject === "all" ||
        (typeof grant.subject === "object" && getTableName(grant.subject) === getTableName(desc.table));
      return actionMatch && subjectMatch;
    });

    if (!matched) {
      denied.push(desc);
    }
  }

  if (denied.length === 0) {
    return { permitted: true, invisible: false, reason: null };
  }

  const reason = denied
    .map((d) => `${d.action} on ${getTableName(d.table)}`)
    .join(", ");

  return {
    permitted: false,
    invisible: denied.length === descriptors.length,
    reason: `Missing permissions: ${reason}`,
  };
}

/**
 * Creates a scoped action factory bound to a shared context provider.
 *
 * Returns two functions — `createAction` and `composeActions` — that share the
 * same `getContext` callback. This ensures every action in the application resolves
 * its database, user, and grants consistently.
 *
 * Services registered via the optional `services` config are injected into
 * every action's context as `ctx.services`, so handlers can access shared
 * dependencies (HTTP clients, mailers, third-party APIs) without importing
 * module-level singletons. Services are always defined on `ctx.services`
 * — the factory fills in `{}` when no services are configured so handlers
 * can destructure safely.
 *
 * @typeParam TUser - The shape of the authenticated user object.
 * @typeParam TServices - The shape of the registered services map.
 * @param config - The {@link ActionsConfig} providing the `getContext` callback
 *   and optional `services` bag.
 * @returns An object with `createAction` and `composeActions` functions.
 *
 * @example Basic usage
 * ```ts
 * import { createActions } from "@cfast/actions";
 *
 * export const { createAction, composeActions } = createActions({
 *   getContext: async ({ request }) => {
 *     const ctx = await requireAuthContext(request);
 *     const db = createCfDb(env.DB, ctx);
 *     return { db, user: ctx.user, grants: ctx.grants };
 *   },
 * });
 * ```
 *
 * @example With service injection
 * ```ts
 * type Services = { nutritionApi: NutritionApi };
 *
 * export const { createAction } = createActions<AppUser, Services>({
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
export function createActions<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TUser = any,
  TServices extends ActionServices = ActionServices,
>(config: ActionsConfig<TUser, TServices>) {
  let counter = 0;

  // Normalize services to `{}` when omitted so handlers can always
  // safely access `ctx.services.xxx` without an undefined check.
  const services: TServices = config.services ?? ({} as TServices);

  /**
   * Resolves the per-request action context and guarantees `services` is set.
   *
   * The `getContext` callback may return a context without a `services`
   * field for backward compatibility; this helper merges in the registered
   * services so the caller always sees a fully-formed {@link ActionContext}.
   */
  async function resolveContext(
    args: RequestArgs,
  ): Promise<ActionContext<TUser, TServices>> {
    const ctx = await config.getContext(args);
    return {
      db: ctx.db,
      user: ctx.user,
      grants: ctx.grants,
      services: ctx.services ?? services,
    };
  }

  /**
   * Defines a single permission-aware action.
   *
   * Takes an {@link OperationsFn} that builds a database `Operation` from
   * the parsed input and action context. Returns an {@link ActionDefinition}
   * with `.action`, `.loader()`, `.client`, and `.buildOperation` facets.
   *
   * @typeParam TInput - The expected input shape for this action.
   * @typeParam TResult - The return type of the action handler.
   * @param operationsFn - A function that builds the database operation for this action.
   * @returns An {@link ActionDefinition} with action handler, loader wrapper, client descriptor, and build method.
   *
   * @example
   * ```ts
   * const deletePost = createAction<{ postId: string }, Response>(
   *   (db, input, ctx) =>
   *     compose(
   *       [db.delete(posts).where(eq(posts.id, input.postId))],
   *       async (runDelete) => {
   *         await runDelete({});
   *         return redirect("/");
   *       },
   *     ),
   * );
   *
   * export const action = deletePost.action;
   * ```
   */
  function createAction<TInput, TResult>(
    config:
      | OperationsFn<TInput, TResult, TUser>
      | {
          /**
           * Optional typed input parser, e.g. produced by `defineInput({ ... })`.
           *
           * When set, the parser runs over the request's raw input before the
           * handler is invoked. Validation failures throw {@link InvalidInputError}
           * with field-keyed messages -- the call this fix exists for is
           * `Number(formData.get("position"))` silently producing NaN, which
           * `z.number()` / `z.integer()` rejects upfront.
           */
          input?: InputParser<TInput>;
          /** The operation builder. Same shape as the legacy positional form. */
          handler: OperationsFn<TInput, TResult, TUser>;
        },
  ): ActionDefinition<TInput, TResult, TUser> {
    const actionId = `action_${++counter}`;

    // Both call shapes (positional `operationsFn` and the object form) reduce
    // to the same internal pair: a parser (defaulting to identity) and a
    // handler. Keeping the legacy positional shape working is the whole
    // reason for the union -- existing call sites should not have to migrate.
    const handler: OperationsFn<TInput, TResult, TUser> =
      typeof config === "function" ? config : config.handler;
    const parser: InputParser<TInput> | undefined =
      typeof config === "function" ? undefined : config.input;

    const action = async (args: RequestArgs): Promise<TResult> => {
      const ctx = await resolveContext(args);
      const rawInput = await parseInput(args.request);
      // The parser runs BEFORE permission checks: garbage input shouldn't
      // even reach the database, regardless of whether the user is allowed
      // to perform the underlying operation.
      const input = (parser ? parser(rawInput) : rawInput) as TInput;
      const operation = handler(ctx.db, input, ctx);
      return operation.run();
    };

    const loader = <TLoaderData extends Record<string, Serializable>>(
      loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
    ) => {
      return async (
        args: RequestArgs,
      ): Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }> => {
        const [loaderData, ctx] = await Promise.all([
          loaderFn(args),
          resolveContext(args),
        ]);

        // Build a dummy input to extract permission descriptors
        const operation = handler(ctx.db, {} as TInput, ctx);
        const status = checkPermissionStatus(ctx.grants, operation.permissions);

        const permissions: ActionPermissionsMap = {
          [actionId]: status,
        };

        return {
          ...loaderData,
          _actionPermissions: permissions,
        };
      };
    };

    const client: ClientDescriptor = {
      _brand: "ActionClientDescriptor",
      actionNames: [actionId] as const,
      permissionsKey: "_actionPermissions",
    };

    const buildOperation = (
      db: Db,
      input: TInput,
      ctx: ActionContext<TUser>,
    ): Operation<TResult> => {
      return handler(db, input, ctx);
    };

    return { action, loader, client, buildOperation };
  }

  /**
   * Combines multiple {@link ActionDefinition | action definitions} into a single
   * route handler that dispatches by the `_action` discriminator field.
   *
   * The returned {@link ComposedActions} object provides a unified `.action` handler,
   * a `.loader()` wrapper that checks permissions for all actions at once,
   * and a `.client` descriptor covering every action name.
   *
   * @typeParam TActions - A record mapping action names to their definitions.
   * @param actions - An object of named action definitions to compose.
   * @returns A {@link ComposedActions} object with combined handler, loader, and client descriptor.
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
   * export const loader = composed.loader(async ({ request, params }) => {
   *   return { post: await getPost(params.slug) };
   * });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function composeActions<TActions extends Record<string, ActionDefinition<any, any, any>>>(
    actions: TActions,
  ): ComposedActions<TActions> {
    const actionNames = Object.keys(actions);

    const composedAction = async (args: RequestArgs): Promise<unknown> => {
      const actionName = await extractActionName(args.request);

      if (!actionName || !(actionName in actions)) {
        throw new Error(
          `Unknown action: "${actionName}". Available actions: ${actionNames.join(", ")}`,
        );
      }

      return actions[actionName].action(args);
    };

    const composedLoader = <TLoaderData extends Record<string, Serializable>>(
      loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
    ) => {
      return async (
        args: RequestArgs,
      ): Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }> => {
        const [loaderData, ctx] = await Promise.all([
          loaderFn(args),
          resolveContext(args),
        ]);

        const permissions: ActionPermissionsMap = {};

        for (const [name, actionDef] of Object.entries(actions)) {
          const operation = actionDef.buildOperation(ctx.db, {} as never, ctx);
          permissions[name] = checkPermissionStatus(ctx.grants, operation.permissions);
        }

        return {
          ...loaderData,
          _actionPermissions: permissions,
        };
      };
    };

    const client: ClientDescriptor = {
      _brand: "ActionClientDescriptor",
      actionNames: actionNames as readonly string[],
      permissionsKey: "_actionPermissions",
    };

    return {
      action: composedAction,
      loader: composedLoader,
      client,
      actions,
    };
  }

  return { createAction, composeActions };
}
