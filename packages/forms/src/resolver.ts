import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { FieldConfig, FieldDefinition } from "./types";

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

export function createResolver(
  fields: FieldDefinition[],
  fieldOverrides?: Partial<Record<string, FieldConfig>>,
): Resolver<FieldValues> {
  return async (values) => {
    const errors: FieldErrors<FieldValues> = {};
    let hasErrors = false;

    for (const field of fields) {
      const value = values[field.name];
      const error = validateField(field, value);

      if (error) {
        hasErrors = true;
        errors[field.name] = { type: "validation", message: error };
        continue;
      }

      // Run per-field custom validator from field overrides
      const customValidate = fieldOverrides?.[field.name]?.validate;
      if (customValidate && value !== undefined && value !== null && value !== "") {
        const customError = customValidate(value);
        if (customError) {
          hasErrors = true;
          errors[field.name] = { type: "custom", message: customError };
        }
      }
    }

    if (hasErrors) {
      return {
        values: {} as Record<string, never>,
        errors,
      };
    }

    return {
      values,
      errors: {} as Record<string, never>,
    };
  };
}
