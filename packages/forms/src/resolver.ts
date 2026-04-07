import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { ChildTableConfig, FieldConfig, FieldDefinition } from "./types";
import { introspectTable } from "./introspect";

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

/**
 * Should the resolver run validation for this parent field?
 * Computed fields are derived from other values, so we trust the computation
 * rather than asking the user to satisfy required/min/max constraints.
 */
function shouldValidateField(
  field: FieldDefinition,
  fieldOverrides?: Partial<Record<string, FieldConfig>>,
): boolean {
  return !fieldOverrides?.[field.name]?.computed;
}

/**
 * Validate a single child row, returning per-column errors keyed by column name.
 */
function validateChildRow(
  fields: FieldDefinition[],
  fieldOverrides: Partial<Record<string, FieldConfig>> | undefined,
  row: Record<string, unknown>,
): Record<string, { type: string; message: string }> {
  const rowErrors: Record<string, { type: string; message: string }> = {};
  for (const field of fields) {
    if (!shouldValidateField(field, fieldOverrides)) continue;

    const value = row[field.name];
    const error = validateField(field, value);
    if (error) {
      rowErrors[field.name] = { type: "validation", message: error };
      continue;
    }

    const customValidate = fieldOverrides?.[field.name]?.validate;
    if (customValidate && value !== undefined && value !== null && value !== "") {
      const customError = customValidate(value);
      if (customError) {
        rowErrors[field.name] = { type: "custom", message: customError };
      }
    }
  }
  return rowErrors;
}

/**
 * Create a react-hook-form resolver that validates form values against
 * introspected {@link FieldDefinition} rules.
 *
 * Checks required fields, string length constraints, numeric range constraints,
 * regex patterns, and any custom `validate` functions from {@link FieldConfig} overrides.
 * Schema-derived rules (from {@link introspectTable}) and custom rules (from {@link v})
 * are both enforced.
 *
 * If `children` is provided, the resolver also validates each child row against
 * its introspected schema and enforces `minRows` / `maxRows` constraints.
 *
 * Computed fields (those with `fieldOverrides[name].computed`) are skipped; they
 * are derived from other form values rather than user input.
 *
 * @param fields - The {@link FieldDefinition} array to validate against (from {@link introspectTable}).
 * @param fieldOverrides - Optional per-field {@link FieldConfig} overrides, including custom `validate` functions.
 * @param children - Optional child table configurations keyed by array name.
 * @returns A react-hook-form `Resolver` that validates form values and returns errors.
 *
 * @example
 * ```ts
 * import { introspectTable, createResolver } from "@cfast/forms";
 * import { posts } from "./schema";
 * import { useForm } from "react-hook-form";
 *
 * const fields = introspectTable(posts);
 * const resolver = createResolver(fields, {
 *   title: { validate: (v) => (v === "test" ? "No test titles" : undefined) },
 * });
 * const form = useForm({ resolver });
 * ```
 */
export function createResolver(
  fields: FieldDefinition[],
  fieldOverrides?: Partial<Record<string, FieldConfig>>,
  children?: Record<string, ChildTableConfig>,
): Resolver<FieldValues> {
  // Pre-introspect each child table once so the resolver doesn't redo it on
  // every keystroke.
  const childIntrospection: Record<
    string,
    { fields: FieldDefinition[]; config: ChildTableConfig }
  > = {};
  if (children) {
    for (const [key, child] of Object.entries(children)) {
      childIntrospection[key] = {
        fields: introspectTable(child.table).filter(
          (f) => f.name !== child.foreignKey && !f.isPrimaryKey,
        ),
        config: child,
      };
    }
  }

  return async (values) => {
    const errors: FieldErrors<FieldValues> = {};
    let hasErrors = false;

    for (const field of fields) {
      if (!shouldValidateField(field, fieldOverrides)) continue;

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

    // Validate child arrays
    for (const [key, { fields: childFields, config }] of Object.entries(
      childIntrospection,
    )) {
      const rawRows = values[key];
      const rows = Array.isArray(rawRows) ? rawRows : [];

      if (config.minRows !== undefined && rows.length < config.minRows) {
        hasErrors = true;
        errors[key] = {
          type: "minRows",
          message: `${config.label ?? key} must have at least ${config.minRows} row${config.minRows === 1 ? "" : "s"}`,
        };
        continue;
      }
      if (config.maxRows !== undefined && rows.length > config.maxRows) {
        hasErrors = true;
        errors[key] = {
          type: "maxRows",
          message: `${config.label ?? key} can have at most ${config.maxRows} row${config.maxRows === 1 ? "" : "s"}`,
        };
        continue;
      }

      const rowErrorEntries: Record<string, unknown>[] = [];
      let childHasErrors = false;
      for (let i = 0; i < rows.length; i++) {
        const row =
          rows[i] && typeof rows[i] === "object"
            ? (rows[i] as Record<string, unknown>)
            : {};
        const rowErrors = validateChildRow(childFields, config.fields, row);
        if (Object.keys(rowErrors).length > 0) {
          childHasErrors = true;
          rowErrorEntries[i] = rowErrors;
        }
      }
      if (childHasErrors) {
        hasErrors = true;
        // react-hook-form represents array field errors as an array indexed by row.
        errors[key] = rowErrorEntries as unknown as FieldErrors<FieldValues>[string];
      }
    }

    if (hasErrors) {
      // On validation failure, react-hook-form expects an empty `values` object
      // (typed as Record<string, never> in ResolverError).
      const emptyValues: Record<string, never> = {};
      return {
        values: emptyValues,
        errors,
      };
    }

    // On success, react-hook-form expects an empty `errors` object
    // (typed as Record<string, never> in ResolverSuccess).
    const noErrors: Record<string, never> = {};
    return {
      values,
      errors: noErrors,
    };
  };
}
