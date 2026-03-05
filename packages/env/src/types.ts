// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

type D1Database = { prepare: AnyFn; dump: AnyFn; batch: AnyFn; exec: AnyFn };
type KVNamespace = { get: AnyFn; put: AnyFn; delete: AnyFn; list: AnyFn };
type R2Bucket = { put: AnyFn; get: AnyFn; head: AnyFn; delete: AnyFn; list: AnyFn };
type Queue = { send: AnyFn; sendBatch: AnyFn };
type DurableObjectNamespace = { get: AnyFn; idFromName: AnyFn; idFromString: AnyFn; newUniqueId: AnyFn };
type Fetcher = { fetch: AnyFn };

export type BindingTypeMap = {
  d1: D1Database;
  kv: KVNamespace;
  r2: R2Bucket;
  queue: Queue;
  "durable-object": DurableObjectNamespace;
  service: Fetcher;
  secret: string;
  var: string;
};

export type BindingType = keyof BindingTypeMap;

export type EnvironmentName = "development" | "staging" | "production";

export type EnvironmentDefaults = Partial<Record<EnvironmentName, string>>;

export type VarBindingDef = {
  type: "var";
  default?: string | EnvironmentDefaults;
  validate?: (value: string) => boolean;
};

export type ObjectBindingDef = {
  type: Exclude<BindingType, "var" | "secret">;
};

export type SecretBindingDef = {
  type: "secret";
};

export type BindingDef = VarBindingDef | ObjectBindingDef | SecretBindingDef;

export type Schema = Record<string, BindingDef>;

export type EnvValidationError = {
  key: string;
  message: string;
};

export type ParsedEnv<S extends Schema> = {
  [K in keyof S]: BindingTypeMap[S[K]["type"]];
};
