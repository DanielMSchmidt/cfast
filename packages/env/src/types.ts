/**
 * Maps each Cloudflare binding type string to its corresponding TypeScript type.
 *
 * Uses global types from `@cloudflare/workers-types` (peer dependency).
 * Consumers must have `@cloudflare/workers-types` installed for full type safety.
 */
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

/** Union of all supported Cloudflare binding type strings. */
export type BindingType = keyof BindingTypeMap;

/** Valid Cloudflare Worker environment names. */
export type EnvironmentName = "development" | "staging" | "production";

/**
 * Per-environment default values for a `var` binding.
 *
 * Keys are environment names; not every environment needs an entry.
 */
export type EnvironmentDefaults = Partial<Record<EnvironmentName, string>>;

/**
 * Binding definition for a `var` (string environment variable).
 *
 * Supports optional defaults (simple string or per-environment) and
 * an optional validation callback.
 */
export type VarBindingDef = {
  type: "var";
  default?: string | EnvironmentDefaults;
  validate?: (value: string) => boolean;
};

/**
 * Binding definition for an object-type Cloudflare binding
 * (D1, KV, R2, Queue, Durable Object, or Service).
 */
export type ObjectBindingDef = {
  type: Exclude<BindingType, "var" | "secret">;
};

/** Binding definition for a secret (non-empty string, no defaults allowed). */
export type SecretBindingDef = {
  type: "secret";
};

/** Discriminated union of all binding definition types. */
export type BindingDef = VarBindingDef | ObjectBindingDef | SecretBindingDef;

/** A record mapping binding names to their definitions. */
export type Schema = Record<string, BindingDef>;

/** Describes a single validation failure for a binding. */
export type EnvValidationError = {
  /** The binding name that failed validation (e.g., `"DB"`). */
  key: string;
  /** Human-readable description of the validation failure. */
  message: string;
};

/**
 * Mapped type that resolves a schema to its validated environment object.
 *
 * Each key in the schema maps to the TypeScript type corresponding to its
 * binding type (e.g., a `d1` binding becomes `D1Database`).
 */
export type ParsedEnv<S extends Schema> = {
  [K in keyof S]: BindingTypeMap[S[K]["type"]];
};
