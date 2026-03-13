/**
 * Maps each Cloudflare binding type string to its corresponding TypeScript type.
 *
 * Uses global types from `@cloudflare/workers-types` (peer dependency).
 * Consumers must have `@cloudflare/workers-types` installed for full type safety.
 *
 * @example
 * ```typescript
 * // Access the TypeScript type for a specific binding type:
 * type MyD1 = BindingTypeMap["d1"]; // D1Database
 * type MyKV = BindingTypeMap["kv"]; // KVNamespace
 * ```
 */
export type BindingTypeMap = {
  /** Cloudflare D1 SQLite database. */
  d1: D1Database;
  /** Cloudflare Workers KV key-value namespace. */
  kv: KVNamespace;
  /** Cloudflare R2 object storage bucket. */
  r2: R2Bucket;
  /** Cloudflare Queue for message passing. */
  queue: Queue;
  /** Cloudflare Durable Object namespace. */
  "durable-object": DurableObjectNamespace;
  /** Cloudflare Service binding (Worker-to-Worker RPC). */
  service: Fetcher;
  /** A secret string value (non-empty, set via `wrangler secret put`). */
  secret: string;
  /** A string environment variable (set via `[vars]` in `wrangler.toml`). */
  var: string;
};

/**
 * Union of all supported Cloudflare binding type strings.
 *
 * Includes object bindings (`"d1"`, `"kv"`, `"r2"`, `"queue"`, `"durable-object"`, `"service"`),
 * string bindings (`"secret"`, `"var"`).
 */
export type BindingType = keyof BindingTypeMap;

/**
 * Valid Cloudflare Worker environment names.
 *
 * Determined by the reserved `ENVIRONMENT` binding in `rawEnv`.
 * Defaults to `"development"` when absent.
 */
export type EnvironmentName = "development" | "staging" | "production";

/**
 * Per-environment default values for a `var` binding.
 *
 * Keys are {@link EnvironmentName} values; not every environment needs an entry.
 * When the current environment has no matching key and no value is provided,
 * `init()` throws an error.
 *
 * @example
 * ```typescript
 * const defaults: EnvironmentDefaults = {
 *   development: "http://localhost:8787",
 *   staging: "https://staging.myapp.com",
 *   production: "https://myapp.com",
 * };
 * ```
 */
export type EnvironmentDefaults = Partial<Record<EnvironmentName, string>>;

/**
 * Binding definition for a `var` (string environment variable).
 *
 * Supports optional defaults (simple string or per-environment) and
 * an optional validation callback.
 *
 * @example
 * ```typescript
 * const schema = {
 *   APP_URL: {
 *     type: "var" as const,
 *     default: "http://localhost:8787",
 *     validate: (v: string) => v.startsWith("http"),
 *   },
 * };
 * ```
 */
export type VarBindingDef = {
  /** Must be `"var"` to identify this as a string variable binding. */
  type: "var";
  /** Default value: a simple string, or a per-environment {@link EnvironmentDefaults} map. */
  default?: string | EnvironmentDefaults;
  /** Optional validation callback. Return `true` to accept, `false` to reject. */
  validate?: (value: string) => boolean;
};

/**
 * Binding definition for an object-type Cloudflare binding
 * (D1, KV, R2, Queue, Durable Object, or Service).
 *
 * Object bindings are validated via duck-type method checks at startup.
 *
 * @example
 * ```typescript
 * const schema = {
 *   DB: { type: "d1" as const },
 *   CACHE: { type: "kv" as const },
 *   UPLOADS: { type: "r2" as const },
 * };
 * ```
 */
export type ObjectBindingDef = {
  /** The Cloudflare binding type: `"d1"`, `"kv"`, `"r2"`, `"queue"`, `"durable-object"`, or `"service"`. */
  type: Exclude<BindingType, "var" | "secret">;
};

/**
 * Binding definition for a secret (non-empty string, no defaults allowed).
 *
 * Secrets are set via `wrangler secret put` and must be non-empty at runtime.
 *
 * @example
 * ```typescript
 * const schema = {
 *   MAILGUN_API_KEY: { type: "secret" as const },
 * };
 * ```
 */
export type SecretBindingDef = {
  /** Must be `"secret"` to identify this as a secret string binding. */
  type: "secret";
};

/**
 * Discriminated union of all binding definition types.
 *
 * Discriminated on the `type` field: `"var"` resolves to {@link VarBindingDef},
 * `"secret"` to {@link SecretBindingDef}, and all other binding types to {@link ObjectBindingDef}.
 */
export type BindingDef = VarBindingDef | ObjectBindingDef | SecretBindingDef;

/**
 * A record mapping binding names to their {@link BindingDef} definitions.
 *
 * Passed to {@link defineEnv} to declare the expected Cloudflare Worker bindings.
 *
 * @example
 * ```typescript
 * const schema: Schema = {
 *   DB: { type: "d1" },
 *   API_KEY: { type: "secret" },
 *   LOG_LEVEL: { type: "var", default: "info" },
 * };
 * ```
 */
export type Schema = Record<string, BindingDef>;

/**
 * Describes a single validation failure for a binding.
 *
 * Multiple failures are collected during `init()` and bundled into a single
 * {@link EnvError} so all issues can be fixed in one pass.
 */
export type EnvValidationError = {
  /** The binding name that failed validation (e.g., `"DB"`). */
  key: string;
  /** Human-readable description of the validation failure. */
  message: string;
};

/**
 * Mapped type that resolves a {@link Schema} to its validated environment object.
 *
 * Each key in the schema maps to the TypeScript type corresponding to its
 * binding type (e.g., a `d1` binding becomes `D1Database`, a `"secret"` becomes `string`).
 *
 * @typeParam S - The env schema type.
 *
 * @example
 * ```typescript
 * const schema = {
 *   DB: { type: "d1" as const },
 *   API_KEY: { type: "secret" as const },
 * };
 * type Env = ParsedEnv<typeof schema>;
 * // { DB: D1Database; API_KEY: string }
 * ```
 */
export type ParsedEnv<S extends Schema> = {
  [K in keyof S]: BindingTypeMap[S[K]["type"]];
};
