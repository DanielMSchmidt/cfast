import type { Db, Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";
import { getTableName } from "@cfast/permissions";

import { extractActionName, parseInput } from "./parse-input.js";
import type {
  ActionContext,
  ActionDefinition,
  ActionPermissionStatus,
  ActionPermissionsMap,
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
 * @typeParam TUser - The shape of the authenticated user object.
 * @param config - The {@link ActionsConfig} providing the `getContext` callback.
 * @returns An object with `createAction` and `composeActions` functions.
 *
 * @example
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createActions<TUser = any>(config: ActionsConfig<TUser>) {
  let counter = 0;

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
    operationsFn: OperationsFn<TInput, TResult, TUser>,
  ): ActionDefinition<TInput, TResult, TUser> {
    const actionId = `action_${++counter}`;

    const action = async (args: RequestArgs): Promise<TResult> => {
      const ctx = await config.getContext(args);
      const input = await parseInput(args.request) as TInput;
      const operation = operationsFn(ctx.db, input, ctx);
      return operation.run({});
    };

    const loader = <TLoaderData extends Record<string, Serializable>>(
      loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
    ) => {
      return async (
        args: RequestArgs,
      ): Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }> => {
        const [loaderData, ctx] = await Promise.all([
          loaderFn(args),
          config.getContext(args),
        ]);

        // Build a dummy input to extract permission descriptors
        const operation = operationsFn(ctx.db, {} as TInput, ctx);
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
      return operationsFn(db, input, ctx);
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
          config.getContext(args),
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
