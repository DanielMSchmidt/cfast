// Uses the global types from @cloudflare/workers-types (peer dependency).
// Consumers must have @cloudflare/workers-types installed for full type safety.
// The package builds with these as ambient globals provided by the peer dep.
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
