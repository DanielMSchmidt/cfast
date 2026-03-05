import type { Schema, ParsedEnv, BindingDef, EnvironmentName } from "./types";
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

      const environment: EnvironmentName = rawEnvironment;

      const errors: { key: string; message: string }[] = [];
      const result: Record<string, unknown> = {};

      for (const [key, def] of Object.entries(schema)) {
        let value = rawEnv[key];

        // Apply defaults for var bindings
        if (value === undefined || value === null) {
          const defaultValue = resolveDefault(def, environment);
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
              message: `Missing required variable '${key}'. No default for environment '${environment}'.`,
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
