import type { Schema, ParsedEnv, BindingDef, EnvironmentName, EnvValidationError } from "./types";
import { EnvError } from "./errors";
import { validateBinding } from "./validators";

const VALID_ENVIRONMENTS: ReadonlySet<string> = new Set([
  "development",
  "staging",
  "production",
]);

function isEnvironmentName(value: string): value is EnvironmentName {
  return VALID_ENVIRONMENTS.has(value);
}

type Env<S extends Schema> = {
  init(rawEnv: Record<string, unknown>): void;
  get(): ParsedEnv<S>;
};

function resolveDefault(
  def: BindingDef,
  environment: EnvironmentName,
): string | undefined {
  if (def.type !== "var" || def.default === undefined) return undefined;
  if (typeof def.default === "string") return def.default;
  return def.default[environment];
}

/**
 * Creates a type-safe, runtime-validated environment object for Cloudflare Worker bindings.
 *
 * Declare your bindings once and get a fully typed environment. Validation runs once
 * at startup via `init()`, catching missing or misconfigured bindings before any
 * request is processed.
 *
 * @param schema - A record mapping binding names to their definitions (type, defaults, validation).
 * @returns An object with `init()` and `get()` methods for initializing and accessing the typed environment.
 *
 * @example
 * ```typescript
 * import { defineEnv } from "@cfast/env";
 *
 * const env = defineEnv({
 *   DB: { type: "d1" },
 *   CACHE: { type: "kv" },
 *   MAILGUN_API_KEY: { type: "secret" },
 *   APP_URL: { type: "var", default: "http://localhost:8787" },
 * });
 *
 * export default {
 *   async fetch(request, rawEnv) {
 *     env.init(rawEnv);
 *     const { DB, MAILGUN_API_KEY } = env.get();
 *   },
 * };
 * ```
 */
export function defineEnv<S extends Schema>(schema: S): Env<S> {
  let cached: ParsedEnv<S> | null = null;

  return {
    init(rawEnv: Record<string, unknown>) {
      if (cached !== null) return;

      const rawEnvironment =
        typeof rawEnv["ENVIRONMENT"] === "string"
          ? rawEnv["ENVIRONMENT"]
          : "development";

      if (!isEnvironmentName(rawEnvironment)) {
        throw new EnvError([
          {
            key: "ENVIRONMENT",
            message: `Invalid environment '${rawEnvironment}'. Must be one of: development, staging, production.`,
          },
        ]);
      }

      const errors: EnvValidationError[] = [];
      const result: Record<string, unknown> = {};

      for (const [key, def] of Object.entries(schema)) {
        let value = rawEnv[key];

        // Apply defaults for var bindings
        if (value == null) {
          const defaultValue = resolveDefault(def, rawEnvironment);
          if (defaultValue !== undefined) {
            value = defaultValue;
          } else if (
            def.type === "var" &&
            def.default !== undefined &&
            typeof def.default === "object"
          ) {
            // Environment-aware default with no matching key for this environment
            errors.push({
              key,
              message: `Missing required variable '${key}'. No default for environment '${rawEnvironment}'.`,
            });
            continue;
          }
        }

        const error = validateBinding(key, def, value);
        if (error) {
          errors.push(error);
        } else {
          result[key] = value;
        }
      }

      if (errors.length > 0) {
        throw new EnvError(errors);
      }

      // Safe: every key in schema has been validated and assigned to result
      cached = result as ParsedEnv<S>;
    },

    get(): ParsedEnv<S> {
      if (cached === null) {
        throw new Error(
          "@cfast/env: Environment not initialized. Call env.init() before env.get().",
        );
      }
      return cached;
    },
  };
}
