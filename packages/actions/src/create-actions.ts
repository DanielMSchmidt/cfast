import type { Db, Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";

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
        (typeof grant.subject === "object" && grant.subject._.name === desc.table._.name);
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
    .map((d) => `${d.action} on ${d.table._.name}`)
    .join(", ");

  return {
    permitted: false,
    invisible: denied.length === descriptors.length,
    reason: `Missing permissions: ${reason}`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createActions<TUser = any>(config: ActionsConfig<TUser>) {
  let counter = 0;

  function createAction<TInput, TResult>(
    operationsFn: OperationsFn<TInput, TResult, TUser>,
  ): ActionDefinition<TInput, TResult, TUser> {
    const actionId = `action_${++counter}`;

    const action = async (args: RequestArgs): Promise<TResult> => {
      const ctx = await config.getContext(args);
      const formData = await args.request.formData();
      const input = Object.fromEntries(formData.entries()) as TInput;
      const operation = operationsFn(ctx.db, input, ctx);
      return operation.run({});
    };

    const loader = <TLoaderData extends Serializable>(
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function composeActions<TActions extends Record<string, ActionDefinition<any, any, any>>>(
    actions: TActions,
  ): ComposedActions<TActions> {
    const actionNames = Object.keys(actions);

    const composedAction = async (args: RequestArgs): Promise<unknown> => {
      const formData = await args.request.clone().formData();
      const actionName = formData.get("_action") as string;

      if (!actionName || !(actionName in actions)) {
        throw new Error(
          `Unknown action: "${actionName}". Available actions: ${actionNames.join(", ")}`,
        );
      }

      return actions[actionName].action(args);
    };

    const composedLoader = <TLoaderData extends Serializable>(
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
