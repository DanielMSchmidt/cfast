import type { BindingDef, BindingType, EnvValidationError } from "./types";

const BINDING_LABELS: Record<BindingType, string> = {
  d1: "D1",
  kv: "KV",
  r2: "R2",
  queue: "Queue",
  "durable-object": "DurableObject",
  service: "Service",
  secret: "secret",
  var: "variable",
};

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function hasMethod(obj: Record<string, unknown>, method: string): boolean {
  return typeof obj[method] === "function";
}

const DUCK_CHECKS: Record<string, string[]> = {
  d1: ["prepare"],
  kv: ["get", "put"],
  r2: ["put", "head"],
  queue: ["send"],
  "durable-object": ["get", "idFromName"],
  service: ["fetch"],
};

export function validateBinding(
  key: string,
  def: BindingDef,
  value: unknown,
): EnvValidationError | undefined {
  const label = BINDING_LABELS[def.type];

  // For var bindings, defaults must be resolved by the caller before calling validateBinding.
  if (def.type === "var") {
    if (value == null) {
      return { key, message: `Missing required variable '${key}'. Check your wrangler.toml.` };
    }
    if (typeof value !== "string") {
      return { key, message: `Expected string for variable '${key}', got ${typeof value}.` };
    }
    if (def.validate && !def.validate(value)) {
      return { key, message: `Variable '${key}' failed validation.` };
    }
    return undefined;
  }

  if (def.type === "secret") {
    if (value == null) {
      return { key, message: `Missing required secret '${key}'. Check your wrangler.toml.` };
    }
    if (typeof value !== "string") {
      return { key, message: `Expected string for secret '${key}', got ${typeof value}.` };
    }
    if (value.length === 0) {
      return { key, message: `Secret '${key}' is empty. Secrets must be non-empty strings.` };
    }
    return undefined;
  }

  // Object bindings: d1, kv, r2, queue, durable-object, service
  if (value == null) {
    return { key, message: `Missing required ${label} binding '${key}'. Check your wrangler.toml.` };
  }

  if (!isObject(value)) {
    return { key, message: `Expected ${label} binding for '${key}', got ${typeof value}.` };
  }

  const methods = DUCK_CHECKS[def.type];
  if (methods) {
    for (const method of methods) {
      if (!hasMethod(value, method)) {
        return {
          key,
          message: `Expected ${label} binding for '${key}' (missing .${method}() method). Check your wrangler.toml.`,
        };
      }
    }
  }

  return undefined;
}
