/**
 * Tiny schema-based input parser for `createAction`.
 *
 * The motivation (#159) is that `Number(formData.get("position"))` silently
 * returns `NaN` for missing or non-numeric inputs and quietly persists garbage.
 * This module exposes a minimal Zod-like field DSL whose `.parse()` method
 * coerces and validates raw form/JSON input into a typed object, throwing an
 * {@link InvalidInputError} (with field-keyed messages) on failure instead of
 * letting the bad value reach the database.
 *
 * The DSL intentionally only covers the field types `@cfast/forms` already
 * derives from a Drizzle schema (string / number / integer / boolean) plus
 * optional/nullable wrappers. Anything more exotic should fall back to a real
 * validator like Zod via the `custom()` escape hatch.
 */

/**
 * Thrown by {@link InputSchema.parse} when the raw input fails validation.
 *
 * `errors` is keyed by field name and contains the human-readable reason for
 * each failure. Action handlers can re-throw the error directly from a
 * `createAction` body to surface form-level errors to the client.
 */
export class InvalidInputError extends Error {
  /** Field-keyed map of validation errors. */
  readonly errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    const summary = Object.entries(errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join("; ");
    super(`Invalid input: ${summary}`);
    this.name = "InvalidInputError";
    this.errors = errors;
  }
}

/**
 * A single field validator. Implementations receive the raw value (string from
 * a `FormData`, anything from a JSON body, or `undefined` if the field is
 * missing) and return either a parsed value or a validation error message.
 */
export type InputField<T> = {
  /**
   * Parses a single raw input value. Returns `{ ok: true, value }` on success
   * or `{ ok: false, error }` with a human-readable explanation on failure.
   */
  parse(raw: unknown): { ok: true; value: T } | { ok: false; error: string };
};

/**
 * Internal helper: detect "no value provided" — covers `undefined`, `null`,
 * and the empty string that browsers submit for blank form fields.
 */
function isMissing(raw: unknown): boolean {
  return raw === undefined || raw === null || raw === "";
}

/**
 * String field. Coerces `FormDataEntryValue` (which is `File | string`) to a
 * string. Rejects missing values unless wrapped in {@link optional}.
 */
function stringField(): InputField<string> {
  return {
    parse(raw) {
      if (isMissing(raw)) {
        return { ok: false, error: "is required" };
      }
      if (typeof raw === "string") {
        return { ok: true, value: raw };
      }
      // FormData files / unexpected JSON shapes — surface as a clear failure
      // instead of silently coercing to "[object Object]".
      return { ok: false, error: "must be a string" };
    },
  };
}

/**
 * Number field. The core fix for #159: parses a numeric value and rejects
 * `NaN`, `Infinity`, and unparseable strings outright. Used by every action
 * handler that previously did `Number(formData.get("x"))`.
 */
function numberField(): InputField<number> {
  return {
    parse(raw) {
      if (isMissing(raw)) {
        return { ok: false, error: "is required" };
      }
      let parsed: number;
      if (typeof raw === "number") {
        parsed = raw;
      } else if (typeof raw === "string") {
        // The empty string is already handled by isMissing(); a string of
        // whitespace would coerce to 0 via Number(), which is exactly the
        // class of bug this validator exists to prevent. Trim and reject
        // empty-after-trim explicitly.
        const trimmed = raw.trim();
        if (trimmed === "") return { ok: false, error: "is required" };
        parsed = Number(trimmed);
      } else {
        return { ok: false, error: "must be a number" };
      }
      if (!Number.isFinite(parsed)) {
        return { ok: false, error: "must be a finite number" };
      }
      return { ok: true, value: parsed };
    },
  };
}

/**
 * Integer field. Same semantics as {@link numberField} but additionally
 * rejects fractional values. Maps to Drizzle's `integer()` columns.
 */
function integerField(): InputField<number> {
  const num = numberField();
  return {
    parse(raw) {
      const result = num.parse(raw);
      if (!result.ok) return result;
      if (!Number.isInteger(result.value)) {
        return { ok: false, error: "must be an integer" };
      }
      return result;
    },
  };
}

/**
 * Boolean field. Accepts the form-typical strings (`"true"`, `"false"`,
 * `"on"`, `"off"`, `"1"`, `"0"`) plus native booleans from JSON bodies.
 * Rejects everything else so a typo doesn't silently coerce to `false`.
 */
function booleanField(): InputField<boolean> {
  return {
    parse(raw) {
      if (isMissing(raw)) {
        return { ok: false, error: "is required" };
      }
      if (typeof raw === "boolean") return { ok: true, value: raw };
      if (typeof raw === "string") {
        const lowered = raw.toLowerCase();
        if (lowered === "true" || lowered === "on" || lowered === "1") {
          return { ok: true, value: true };
        }
        if (lowered === "false" || lowered === "off" || lowered === "0") {
          return { ok: true, value: false };
        }
      }
      return { ok: false, error: "must be a boolean" };
    },
  };
}

/**
 * Wraps a field so missing values produce `undefined` instead of an error.
 * Use for genuinely optional inputs.
 */
function optionalField<T>(inner: InputField<T>): InputField<T | undefined> {
  return {
    parse(raw) {
      if (isMissing(raw)) return { ok: true, value: undefined };
      return inner.parse(raw);
    },
  };
}

/**
 * Wraps a field so missing values produce `null` instead of an error.
 * Use for nullable database columns.
 */
function nullableField<T>(inner: InputField<T>): InputField<T | null> {
  return {
    parse(raw) {
      if (isMissing(raw)) return { ok: true, value: null };
      return inner.parse(raw);
    },
  };
}

/**
 * Custom field — escape hatch for cases the built-in fields don't cover
 * (enums, regex matches, etc.). The callback receives the raw value and
 * returns either the parsed result or throws to signal failure.
 *
 * @example
 * ```ts
 * const slugField = z.custom<string>((raw) => {
 *   if (typeof raw !== "string") throw new Error("must be a string");
 *   if (!/^[a-z0-9-]+$/.test(raw)) throw new Error("must be slug-safe");
 *   return raw;
 * });
 * ```
 */
function customField<T>(parser: (raw: unknown) => T): InputField<T> {
  return {
    parse(raw) {
      try {
        return { ok: true, value: parser(raw) };
      } catch (e) {
        const message = e instanceof Error ? e.message : "is invalid";
        return { ok: false, error: message };
      }
    },
  };
}

/**
 * Minimal Zod-like field DSL exposed from `@cfast/actions`. Pair with
 * {@link defineInput} to build a typed parser for an action's input.
 *
 * Names match Zod (`z.string`, `z.number`, ...) so callers familiar with
 * Zod can read the schema at a glance, but this is intentionally a
 * tiny standalone implementation so `@cfast/actions` doesn't pull in
 * Zod's bundle weight on the worker.
 */
export const z = {
  string: stringField,
  number: numberField,
  integer: integerField,
  boolean: booleanField,
  optional: optionalField,
  nullable: nullableField,
  custom: customField,
};

/** A schema is a record of field names to validators. */
export type InputSchema<T> = {
  [K in keyof T]: InputField<T[K]>;
};

/**
 * Result type produced by an {@link InputParser} — the typed object the
 * caller's action handler receives.
 */
export type InferInput<S> = S extends InputSchema<infer T> ? T : never;

/**
 * A function that parses a raw input record into a typed object, throwing
 * {@link InvalidInputError} on failure. Returned by {@link defineInput}.
 */
export type InputParser<T> = (raw: Record<string, unknown>) => T;

/**
 * Builds a typed parser from a {@link InputSchema}. The returned function
 * walks every field, collects errors, and either returns the typed object
 * or throws {@link InvalidInputError} with all field errors at once.
 *
 * @example
 * ```ts
 * import { createAction, defineInput, z } from "@cfast/actions";
 *
 * const moveCard = createAction({
 *   input: defineInput({
 *     cardId: z.string(),
 *     position: z.integer(),     // rejects NaN, fractional, missing
 *     pinned: z.optional(z.boolean()),
 *   }),
 *   handler: (db, input, ctx) =>
 *     db.update(cards).set({ position: input.position }).where(eq(cards.id, input.cardId)),
 * });
 * ```
 */
export function defineInput<S extends InputSchema<unknown>>(
  schema: S,
): InputParser<{ [K in keyof S]: S[K] extends InputField<infer V> ? V : never }> {
  return (raw: Record<string, unknown>) => {
    const result: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    for (const [field, validator] of Object.entries(schema) as Array<
      [string, InputField<unknown>]
    >) {
      const parsed = validator.parse(raw[field]);
      if (parsed.ok) {
        result[field] = parsed.value;
      } else {
        errors[field] = parsed.error;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new InvalidInputError(errors);
    }

    return result as { [K in keyof S]: S[K] extends InputField<infer V> ? V : never };
  };
}
