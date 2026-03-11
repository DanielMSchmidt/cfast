import type { Db, Operation } from "@cfast/db";
import type { Grant, PermissionDescriptor } from "@cfast/permissions";

// --- Serializable ---

export type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable };

// --- Context ---

export type ActionContext<TUser> = {
  db: Db;
  user: TUser;
  grants: Grant[];
};

// --- Request args (subset of React Router loader/action args) ---

export type RequestArgs = {
  request: Request;
  params: Record<string, string | undefined>;
  context?: unknown;
};

// --- Factory config ---

export type ActionsConfig<TUser> = {
  getContext: (args: RequestArgs) => Promise<ActionContext<TUser>>;
};

// --- Operations function ---

export type OperationsFn<TInput, TResult, TUser> = (
  db: Db,
  input: TInput,
  ctx: ActionContext<TUser>,
) => Operation<TResult>;

// --- Permission status ---

export type ActionPermissionStatus = {
  permitted: boolean;
  invisible: boolean;
  reason: string | null;
};

export type ActionPermissionsMap = Record<string, ActionPermissionStatus>;

// --- Client descriptor ---

export type ClientDescriptor = {
  _brand: "ActionClientDescriptor";
  actionNames: readonly string[];
  permissionsKey: string;
};

// --- Action definition ---

export type ActionDefinition<TInput, TResult, TUser> = {
  action: (args: RequestArgs) => Promise<TResult>;
  loader: <TLoaderData extends Serializable>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  client: ClientDescriptor;
  buildOperation: (db: Db, input: TInput, ctx: ActionContext<TUser>) => Operation<TResult>;
};

// --- Composed actions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComposedActions<TActions extends Record<string, ActionDefinition<any, any, any>>> = {
  action: (args: RequestArgs) => Promise<unknown>;
  loader: <TLoaderData extends Serializable>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  client: ClientDescriptor;
  actions: TActions;
};
