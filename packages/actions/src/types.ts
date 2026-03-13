import type { Db, Operation } from "@cfast/db";
import type { Grant } from "@cfast/permissions";

// --- Serializable ---

/** A JSON-serializable value that can safely cross the server/client boundary. */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable };

// --- Context ---

/** Context provided to every action's operations function. */
export type ActionContext<TUser> = {
  /** The Drizzle database instance. */
  db: Db;
  /** The authenticated user. */
  user: TUser;
  /** The user's permission grants, used for permission checking. */
  grants: Grant[];
};

// --- Request args (subset of React Router loader/action args) ---

/** Subset of React Router loader/action arguments used by `@cfast/actions`. */
export type RequestArgs = {
  /** The incoming HTTP request. */
  request: Request;
  /** URL parameters from the route pattern. */
  params: Record<string, string | undefined>;
  /** Optional context (e.g. Cloudflare Workers env). */
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
  loader: <TLoaderData extends Record<string, Serializable>>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  client: ClientDescriptor;
  buildOperation: (db: Db, input: TInput, ctx: ActionContext<TUser>) => Operation<TResult>;
};

// --- Composed actions ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComposedActions<TActions extends Record<string, ActionDefinition<any, any, any>>> = {
  action: (args: RequestArgs) => Promise<unknown>;
  loader: <TLoaderData extends Record<string, Serializable>>(
    loaderFn: (args: RequestArgs) => Promise<TLoaderData>,
  ) => (args: RequestArgs) => Promise<TLoaderData & { _actionPermissions: ActionPermissionsMap }>;
  client: ClientDescriptor;
  actions: TActions;
};
