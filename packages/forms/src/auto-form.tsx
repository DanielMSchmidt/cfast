import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { introspectTable } from "./introspect";
import { createResolver } from "./resolver";
import {
  DefaultChildTable,
  buildEmptyChildRow,
  useChildTableArray,
} from "./child-table";
import type {
  ChildTableConfig,
  FieldConfig,
  FieldDefinition,
  FormPlugin,
} from "./types";

/**
 * Props for the AutoForm component returned by {@link createAutoForm}.
 */
type AutoFormProps = {
  /** The Drizzle SQLite table to generate the form from. */
  table: SQLiteTable;
  /** Form mode: `"create"` renders empty fields, `"edit"` pre-fills from `data`. */
  mode: "create" | "edit";
  /** Existing record data to pre-fill when `mode` is `"edit"`. */
  data?: Record<string, unknown>;
  /** Callback invoked with validated form values on successful submission. */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Per-field overrides for customizing labels, components, visibility, and validation. */
  fields?: Partial<Record<string, FieldConfig>>;
  /**
   * Per-array child table configuration. Each entry becomes a `useFieldArray`
   * with add / remove / reorder controls and full schema-derived validation.
   *
   * @example
   * ```tsx
   * <AutoForm
   *   table={recipes}
   *   mode="create"
   *   children={{
   *     ingredients: {
   *       table: ingredients,
   *       foreignKey: "recipe_id",
   *       minRows: 1,
   *       fields: { name: { placeholder: "Flour" } },
   *     },
   *   }}
   *   onSubmit={async (values) => {
   *     // values.ingredients is the array of typed child rows
   *   }}
   * />
   * ```
   */
  children?: Record<string, ChildTableConfig>;
  /** Column names to exclude from the rendered form. */
  exclude?: string[];
  /** External react-hook-form instance for advanced use cases (e.g., multi-step wizards). */
  form?: UseFormReturn<Record<string, unknown>>;
};

function getComponentForField(plugin: FormPlugin, field: FieldDefinition) {
  switch (field.inputType) {
    case "number":
      return plugin.components.numberInput;
    case "checkbox":
      return plugin.components.checkbox;
    case "select":
      return plugin.components.select;
    default:
      return plugin.components.textInput;
  }
}

/**
 * Inner component that renders one child table section. Lives in a child
 * component so we can call `useFieldArray` once per child without breaking
 * the rules of hooks.
 *
 * @internal
 */
function ChildTableSection({
  name,
  config,
  introspectedFields,
  form,
  plugin,
  error,
}: {
  name: string;
  config: ChildTableConfig;
  introspectedFields: FieldDefinition[];
  form: UseFormReturn<FieldValues>;
  plugin: FormPlugin;
  error?: string;
}) {
  const { fieldArray, visibleFields, append, remove, moveUp, moveDown } =
    useChildTableArray(form, name, config, introspectedFields);

  const ChildTable = plugin.components.childTable ?? DefaultChildTable;

  const max = config.maxRows;
  const min = config.minRows ?? 0;
  const canAddRow = max === undefined || fieldArray.fields.length < max;
  const canRemoveRow = fieldArray.fields.length > min;

  return (
    <ChildTable
      name={name}
      label={config.label ?? humaniseKey(name)}
      fields={visibleFields}
      fieldOverrides={config.fields}
      rowIds={fieldArray.fields.map((f) => f.id)}
      canAddRow={canAddRow}
      canRemoveRow={canRemoveRow}
      reorderable={config.reorderable ?? false}
      onAddRow={append}
      onRemoveRow={remove}
      onMoveUp={moveUp}
      onMoveDown={moveDown}
      error={error}
      form={form}
      plugin={plugin}
    />
  );
}

/**
 * Subscribes to all form value changes and pushes computed field values back
 * into the form via `setValue` whenever any input changes.
 *
 * Uses `form.watch` with a subscription callback (rather than `useWatch`) so
 * computed updates don't trigger component re-renders. A re-entrancy guard
 * prevents the `setValue` calls made from inside the subscription from
 * recursively triggering the subscription again.
 *
 * @internal
 */
function ComputedFieldRunner({
  form,
  computedFields,
}: {
  form: UseFormReturn<FieldValues>;
  computedFields: Array<{ name: string; compute: (values: Record<string, unknown>) => unknown }>;
}) {
  // Track previously written values per field so we don't fire an update when
  // the computed result is unchanged.
  const lastValues = useRef<Record<string, unknown>>({});
  // Re-entrancy guard: `form.setValue` triggers the watch subscription again,
  // which would recursively call `run` — we ignore those nested invocations.
  const isRunning = useRef(false);

  useEffect(() => {
    if (computedFields.length === 0) return;

    const run = (rawValues: unknown) => {
      if (isRunning.current) return;
      isRunning.current = true;
      try {
        const snapshot = (rawValues ?? {}) as Record<string, unknown>;
        for (const { name, compute } of computedFields) {
          let next: unknown;
          try {
            next = compute(snapshot);
          } catch {
            // Swallow compute errors so a transient invalid state (e.g. mid-edit)
            // does not crash the entire form.
            continue;
          }
          if (!Object.is(lastValues.current[name], next)) {
            lastValues.current[name] = next;
            form.setValue(name, next as never, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          }
        }
      } finally {
        isRunning.current = false;
      }
    };

    // Seed once with the current values so the initial render is correct.
    run(form.getValues());

    const subscription = form.watch((value) => {
      run(value);
    });

    return () => subscription.unsubscribe();
  }, [computedFields, form]);

  return null;
}

function humaniseKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Build the initial default values for the form, including parent fields,
 * child arrays, and computed fields.
 *
 * @internal
 */
function buildDefaultValues({
  mode,
  data,
  visibleFields,
  fieldOverrides,
  children,
  childIntrospection,
}: {
  mode: "create" | "edit";
  data?: Record<string, unknown>;
  visibleFields: FieldDefinition[];
  fieldOverrides?: Partial<Record<string, FieldConfig>>;
  children?: Record<string, ChildTableConfig>;
  childIntrospection: Record<string, FieldDefinition[]>;
}): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  if (mode === "edit" && data) {
    Object.assign(defaults, data);
  } else {
    for (const field of visibleFields) {
      const override = fieldOverrides?.[field.name];
      if (override?.default !== undefined) {
        defaults[field.name] = override.default;
      }
    }
  }

  if (children) {
    for (const [key, config] of Object.entries(children)) {
      const fields = childIntrospection[key] ?? [];
      const existing = defaults[key];
      if (Array.isArray(existing) && existing.length > 0) continue;
      const min = config.minRows ?? 0;
      const initialRows: Record<string, unknown>[] = [];
      for (let i = 0; i < min; i++) {
        initialRows.push(buildEmptyChildRow(fields, config.fields));
      }
      defaults[key] = initialRows;
    }
  }

  return defaults;
}

/**
 * Create an AutoForm React component bound to a specific UI {@link FormPlugin}.
 *
 * The returned component introspects a Drizzle table via {@link introspectTable},
 * builds validation via {@link createResolver}, and renders fields using the
 * plugin's components. Supports:
 *
 * - **Create and edit modes** — `mode="create"` starts empty, `mode="edit"` pre-fills `data`.
 * - **Per-field overrides** via {@link FieldConfig}: labels, placeholders, hidden, defaults,
 *   custom components, custom validation, `readOnly`, and `computed`.
 * - **Column exclusion** via the `exclude` prop.
 * - **Parent-child / dynamic field arrays** via the `children` prop. Each entry is
 *   introspected like the parent table and rendered as a `useFieldArray` with add /
 *   remove / reorder controls.
 * - **Computed fields** via `fields[name].computed`. Computed fields are recalculated
 *   whenever any watched value changes (including child rows) and pushed into the
 *   form via `setValue`.
 * - **External react-hook-form instances** via the `form` prop.
 *
 * @param plugin - A {@link FormPlugin} providing the UI components for rendering.
 * @returns A React component (`AutoForm`) that accepts {@link AutoFormProps}.
 *
 * @example
 * ```tsx
 * import { createAutoForm, createFormPlugin } from "@cfast/forms";
 *
 * const plugin = createFormPlugin({ components: joyComponents });
 * const AutoForm = createAutoForm(plugin);
 *
 * // Recipe + ingredients + computed totals
 * <AutoForm
 *   table={recipes}
 *   mode="create"
 *   children={{
 *     ingredients: {
 *       table: ingredients,
 *       foreignKey: "recipe_id",
 *       minRows: 1,
 *       reorderable: true,
 *     },
 *   }}
 *   fields={{
 *     totalCalories: {
 *       computed: (values) =>
 *         (values.ingredients as Array<{ calories: number; amount: number }> ?? [])
 *           .reduce((sum, ing) => sum + (ing.calories * ing.amount) / 100, 0),
 *       readOnly: true,
 *     },
 *   }}
 *   onSubmit={async (values) => { ... }}
 * />
 * ```
 */
export function createAutoForm(plugin: FormPlugin) {
  function AutoForm({
    table,
    mode,
    data,
    onSubmit,
    fields: fieldOverrides,
    children: childrenConfig,
    exclude,
    form: externalForm,
  }: AutoFormProps) {
    const allFields = useMemo(() => introspectTable(table), [table]);

    const visibleFields = useMemo(() => {
      const excludeSet = new Set(exclude ?? []);
      return allFields.filter((f) => {
        if (excludeSet.has(f.name)) return false;
        if (fieldOverrides?.[f.name]?.hidden) return false;
        return true;
      });
    }, [allFields, exclude, fieldOverrides]);

    // Pre-introspect child tables (excluding the foreign key + primary key columns).
    const childIntrospection = useMemo(() => {
      const result: Record<string, FieldDefinition[]> = {};
      if (!childrenConfig) return result;
      for (const [key, config] of Object.entries(childrenConfig)) {
        const excludeSet = new Set([
          config.foreignKey,
          ...(config.exclude ?? []),
        ]);
        result[key] = introspectTable(config.table).filter(
          (f) => !excludeSet.has(f.name) && !f.isPrimaryKey,
        );
      }
      return result;
    }, [childrenConfig]);

    const resolver = useMemo(
      () => createResolver(visibleFields, fieldOverrides, childrenConfig),
      [visibleFields, fieldOverrides, childrenConfig],
    );

    const defaultValues = useMemo(
      () =>
        buildDefaultValues({
          mode,
          data,
          visibleFields,
          fieldOverrides,
          children: childrenConfig,
          childIntrospection,
        }),
      [mode, data, visibleFields, fieldOverrides, childrenConfig, childIntrospection],
    );

    const internalForm = useForm({
      resolver,
      defaultValues,
    });

    const form = (externalForm as UseFormReturn<FieldValues> | undefined) ?? internalForm;

    // Collect computed parent fields up front so the runner can iterate them.
    const computedFields = useMemo(() => {
      const list: Array<{ name: string; compute: (values: Record<string, unknown>) => unknown }> = [];
      if (!fieldOverrides) return list;
      for (const [name, override] of Object.entries(fieldOverrides)) {
        if (override?.computed) {
          list.push({ name, compute: override.computed });
        }
      }
      return list;
    }, [fieldOverrides]);

    const handleSubmit = form.handleSubmit(async (values) => {
      // Stamp the parent's foreign-key column placeholder onto each child row.
      // The actual parent id is unknown until the row is saved server-side, so
      // we leave the value as-is if the caller already provided one (e.g. in
      // edit mode the rows already have it). Otherwise we just leave the slot
      // empty — the action layer is expected to fill it in after creating the
      // parent.
      if (childrenConfig) {
        for (const [key] of Object.entries(childrenConfig)) {
          const rows = (values as Record<string, unknown>)[key];
          if (Array.isArray(rows)) {
            (values as Record<string, unknown>)[key] = rows.map((row) => ({
              ...(row as Record<string, unknown>),
            }));
          }
        }
      }
      await onSubmit(values as Record<string, unknown>);
    });

    const FormWrapper = plugin.components.form;
    const SubmitButton = plugin.components.submitButton;

    return (
      <FormWrapper onSubmit={handleSubmit}>
        {visibleFields.map((field) => {
          const override = fieldOverrides?.[field.name];
          const Component = override?.component ?? getComponentForField(plugin, field);
          const label = override?.label ?? field.label;
          const error = form.formState.errors[field.name]?.message as
            | string
            | undefined;

          return (
            <Component
              key={field.name}
              name={field.name}
              label={label}
              placeholder={override?.placeholder}
              required={field.required}
              readOnly={override?.readOnly || !!override?.computed}
              error={error}
              enumValues={field.enumValues}
              register={form.register}
            />
          );
        })}
        {childrenConfig &&
          Object.entries(childrenConfig).map(([key, config]) => {
            const childErrorRaw = form.formState.errors[key];
            // Only top-level (min/max) child errors carry a string `message` —
            // per-row errors are nested arrays handled inside the child table.
            const childError =
              childErrorRaw &&
              !Array.isArray(childErrorRaw) &&
              typeof (childErrorRaw as { message?: unknown }).message === "string"
                ? ((childErrorRaw as { message: string }).message)
                : undefined;
            return (
              <ChildTableSection
                key={key}
                name={key}
                config={config}
                introspectedFields={childIntrospection[key] ?? []}
                form={form}
                plugin={plugin}
                error={childError}
              />
            );
          })}
        <ComputedFieldRunner form={form} computedFields={computedFields} />
        <SubmitButton isSubmitting={form.formState.isSubmitting}>
          Submit
        </SubmitButton>
      </FormWrapper>
    );
  }

  return AutoForm;
}
