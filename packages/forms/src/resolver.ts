import type { FieldDefinition } from "./types";

export type ResolverResult = {
  values: Record<string, unknown>;
  errors: Record<string, { type: string; message: string }>;
};

export type Resolver = (
  values: Record<string, unknown>,
  context: unknown,
  options: never,
) => Promise<ResolverResult>;

function validateField(
  field: FieldDefinition,
  value: unknown,
): string | undefined {
  const rules = field.validation;
  const customMessage = rules.message;

  if (
    field.required &&
    (value === undefined || value === null || value === "")
  ) {
    return customMessage ?? `${field.label} is required`;
  }

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return (
        customMessage ??
        `${field.label} must be at least ${rules.minLength} characters`
      );
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return (
        customMessage ??
        `${field.label} must be at most ${rules.maxLength} characters`
      );
    }
    if (rules.pattern !== undefined && !rules.pattern.test(value)) {
      return (
        customMessage ??
        `${field.label} does not match the required pattern`
      );
    }
  }

  if (typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      return customMessage ?? `${field.label} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return customMessage ?? `${field.label} must be at most ${rules.max}`;
    }
  }

  return undefined;
}

export function buildResolver(fields: FieldDefinition[]): Resolver {
  return async (values) => {
    const errors: Record<string, { type: string; message: string }> = {};

    for (const field of fields) {
      const value = values[field.name];
      const error = validateField(field, value);

      if (error) {
        errors[field.name] = { type: "validation", message: error };
      }
    }

    return {
      values: Object.keys(errors).length === 0 ? values : {},
      errors,
    };
  };
}
