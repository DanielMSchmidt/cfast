import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { getTableName, type Table } from "drizzle-orm";
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
  InferAutoFormValues,
  NestedTableConfig,
} from "./types";

/**
 * Props for the AutoForm component returned by {@link createAutoForm}.
 *
 * @typeParam TTable - The Drizzle table that drives the parent fields. Used to
 *   infer the shape of the values passed to {@link AutoFormProps.onSubmit}.
 * @typeParam TNested - The readonly tuple of {@link NestedTableConfig} entries.
 *   Used together with `TTable` to infer the submitted value shape. Leave
 *   undefined when the form has no nested tables.
 */
type AutoFormProps<
  TTable extends Table = SQLiteTable,
  TNested extends readonly NestedTableConfig[] | undefined = undefined,
> = {
  /** The Drizzle SQLite table to generate the form from. */
  table: TTable;
  /** Form mode: `"create"` renders empty fields, `"edit"` pre-fills from `data`. Defaults to `"create"`. */
  mode?: "create" | "edit";
  /**
   * Existing record data to pre-fill when `mode` is `"edit"`.
   *
   * Allows extra keys beyond the inferred parent row so callers using the
   * deprecated `children` config can still hydrate nested arrays without a
   * cast. When using the new `nested` API, the compiler narrows
   * `data.<nested-key>` via {@link InferAutoFormValues}.
   */
  data?: Partial<InferAutoFormValues<TTable, TNested>> & Record<string, unknown>;
  /** Callback invoked with validated form values on successful submission. */
  onSubmit: (
    values: InferAutoFormValues<TTable, TNested>,
  ) => void | Promise<void>;
  /** Per-field overrides for customizing labels, components, visibility, and validation. */
  fields?: Partial<Record<string, FieldConfig>>;
  /**
   * Nested child tables rendered as dynamic field arrays. Each entry becomes a
   * `useFieldArray` with add / remove / reorder controls and full schema-derived
   * validation. The submitted value type is inferred from `table` + each entry's
   * `table`, so `onSubmit` receives a fully-typed object with no manual generics
   * or casts.
   *
   * @example
   * ```tsx
   * <AutoForm
   *   table={recipes}
   *   nested={[
   *     {
   *       table: ingredients,
   *       foreignKey: "recipeId",
   *       min: 1,
   *       max: 50,
   *       reorderable: true,
   *     },
   *   ]}
   *   onSubmit={async (values) => {
   *     // values.title: string, values.ingredients: Array<InferRow<typeof ingredients>>
   *   }}
   * />
   * ```
   */
  nested?: TNested;
  /**
   * @deprecated Use {@link AutoFormProps.nested} instead — the record shape
   * collides with JSX's reserved `children` attribute and loses type inference
   * because it requires a manual generic. The `children` shim normalizes to
   * `nested` internally and logs a one-time deprecation warning in development.
   * Removal is scheduled for the next major release.
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
 * Inner component that renders one nested table section. Lives in a child
 * component so we can call `useFieldArray` once per nested entry without
 * breaking the rules of hooks.
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
 * nested arrays, and computed fields.
 *
 * @internal
 */
function buildDefaultValues({
  mode,
  data,
  visibleFields,
  fieldOverrides,
  nestedConfigs,
  childIntrospection,
}: {
  mode: "create" | "edit";
  data?: Record<string, unknown>;
  visibleFields: FieldDefinition[];
  fieldOverrides?: Partial<Record<string, FieldConfig>>;
  nestedConfigs: Record<string, ChildTableConfig>;
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

  for (const [key, config] of Object.entries(nestedConfigs)) {
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

  return defaults;
}

/**
 * One-shot deprecation warning for the old `children` config. We log once
 * per process so dev consoles don't fill up with repeated notices when a
 * form re-renders.
 *
 * @internal
 */
let childrenDeprecationWarned = false;
function warnChildrenDeprecated() {
  if (childrenDeprecationWarned) return;
  childrenDeprecationWarned = true;
  console.warn(
    "[@cfast/forms] AutoForm: the `children` config is deprecated and will " +
      "be removed in the next major release. Use `nested` instead — it's an " +
      "array, it avoids the JSX-reserved `children` attribute, and it infers " +
      "the submitted values type so `onSubmit` is fully typed without casts. " +
      "See packages/forms/llms.txt for migration examples.",
  );
}

/**
 * Normalize a {@link NestedTableConfig} to the internal {@link ChildTableConfig}
 * shape used by the resolver and child-table internals. The internal shape is
 * identical to the deprecated public type, so the resolver and default child
 * table can continue to work unchanged.
 *
 * @internal
 */
function nestedToChildConfig(nested: NestedTableConfig): ChildTableConfig {
  return {
    table: nested.table as SQLiteTable,
    foreignKey: nested.foreignKey,
    minRows: nested.min,
    maxRows: nested.max,
    reorderable: nested.reorderable,
    fields: nested.fields as Partial<Record<string, FieldConfig>> | undefined,
    exclude: nested.exclude as string[] | undefined,
    label: nested.label,
    addLabel: nested.addLabel,
  };
}

/**
 * Derive the form key for a nested entry at runtime.
 *
 * Prefers the explicit `as` override, then falls back to the Drizzle table's
 * runtime name. This mirrors the compile-time {@link NestedKey} type so the
 * type inference and runtime behaviour stay in lockstep.
 *
 * @internal
 */
function nestedKey(nested: NestedTableConfig): string {
  if (nested.as) return nested.as;
  return getTableName(nested.table as Table);
}

/**
 * Build the normalized map of nested child-table configs from either the new
 * `nested` prop or the deprecated `children` prop. Returns an empty object
 * when neither is provided.
 *
 * @internal
 */
function normalizeNestedConfigs(
  nested: readonly NestedTableConfig[] | undefined,
  children: Record<string, ChildTableConfig> | undefined,
): Record<string, ChildTableConfig> {
  const result: Record<string, ChildTableConfig> = {};

  if (nested) {
    for (const entry of nested) {
      const key = nestedKey(entry);
      if (result[key]) {
        throw new Error(
          `[@cfast/forms] AutoForm: duplicate nested key "${key}". ` +
            `Two nested entries resolved to the same form key. Pass an ` +
            `explicit \`as\` on one of them to disambiguate.`,
        );
      }
      result[key] = nestedToChildConfig(entry);
    }
  }

  if (children) {
    warnChildrenDeprecated();
    for (const [key, config] of Object.entries(children)) {
      if (result[key]) {
        throw new Error(
          `[@cfast/forms] AutoForm: nested key "${key}" is defined in both ` +
            `\`nested\` and the deprecated \`children\` prop. Remove it from ` +
            `\`children\` (preferred) or rename the \`nested\` entry via \`as\`.`,
        );
      }
      result[key] = config;
    }
  }

  return result;
}

/**
 * Create an AutoForm React component bound to a specific UI {@link FormPlugin}.
 *
 * The returned component introspects a Drizzle table via {@link introspectTable},
 * builds validation via {@link createResolver}, and renders fields using the
 * plugin's components. Supports:
 *
 * - **Create and edit modes** — `mode="create"` (default) starts empty,
 *   `mode="edit"` pre-fills from `data`.
 * - **Per-field overrides** via {@link FieldConfig}: labels, placeholders, hidden,
 *   defaults, custom components, custom validation, `readOnly`, and `computed`.
 * - **Column exclusion** via the `exclude` prop.
 * - **Nested parent-child tables** via the `nested` prop. Each entry is
 *   introspected like the parent table and rendered as a `useFieldArray` with
 *   add / remove / reorder controls. The submitted value type is inferred from
 *   `table` + each nested `table`, so `onSubmit` is fully typed without manual
 *   generics or casts.
 * - **Computed fields** via `fields[name].computed`. Computed fields are
 *   recalculated whenever any watched value changes (including nested rows)
 *   and pushed into the form via `setValue`.
 * - **External react-hook-form instances** via the `form` prop.
 *
 * @param plugin - A {@link FormPlugin} providing the UI components for rendering.
 * @returns A generic React component (`AutoForm`) that accepts {@link AutoFormProps}.
 *
 * @example
 * ```tsx
 * import { createAutoForm, createFormPlugin } from "@cfast/forms";
 *
 * const plugin = createFormPlugin({ components: joyComponents });
 * const AutoForm = createAutoForm(plugin);
 *
 * // Recipe + ingredients + computed totals — fully inferred, no casts.
 * <AutoForm
 *   table={recipes}
 *   nested={[
 *     {
 *       table: ingredients,
 *       foreignKey: "recipeId",
 *       min: 1,
 *       reorderable: true,
 *     },
 *   ]}
 *   fields={{
 *     totalCalories: {
 *       computed: (values) =>
 *         (values.ingredients as Array<{ calories: number; amount: number }> ?? [])
 *           .reduce((sum, ing) => sum + (ing.calories * ing.amount) / 100, 0),
 *       readOnly: true,
 *     },
 *   }}
 *   onSubmit={async (values) => {
 *     // values.title: string, values.ingredients: Array<InferRow<typeof ingredients>>
 *   }}
 * />
 * ```
 */
export function createAutoForm(plugin: FormPlugin) {
  function AutoForm<
    TTable extends Table = SQLiteTable,
    TNested extends readonly NestedTableConfig[] | undefined = undefined,
  >({
    table,
    mode = "create",
    data,
    onSubmit,
    fields: fieldOverrides,
    nested,
    children: childrenConfig,
    exclude,
    form: externalForm,
  }: AutoFormProps<TTable, TNested>) {
    // Normalize the new `nested` array and deprecated `children` record into a
    // single internal map keyed by form-field name. The resolver, default
    // child-table renderer, and default-values builder all consume this shape.
    const nestedConfigs = useMemo(
      () => normalizeNestedConfigs(nested, childrenConfig),
      [nested, childrenConfig],
    );

    const allFields = useMemo(
      () => introspectTable(table as SQLiteTable),
      [table],
    );

    const visibleFields = useMemo(() => {
      const excludeSet = new Set(exclude ?? []);
      return allFields.filter((f) => {
        if (excludeSet.has(f.name)) return false;
        if (fieldOverrides?.[f.name]?.hidden) return false;
        return true;
      });
    }, [allFields, exclude, fieldOverrides]);

    // Pre-introspect nested tables (excluding the foreign key + primary key columns).
    const childIntrospection = useMemo(() => {
      const result: Record<string, FieldDefinition[]> = {};
      for (const [key, config] of Object.entries(nestedConfigs)) {
        const excludeSet = new Set([
          config.foreignKey,
          ...(config.exclude ?? []),
        ]);
        result[key] = introspectTable(config.table).filter(
          (f) => !excludeSet.has(f.name) && !f.isPrimaryKey,
        );
      }
      return result;
    }, [nestedConfigs]);

    const resolver = useMemo(
      () => createResolver(visibleFields, fieldOverrides, nestedConfigs),
      [visibleFields, fieldOverrides, nestedConfigs],
    );

    const defaultValues = useMemo(
      () =>
        buildDefaultValues({
          mode,
          data: data as Record<string, unknown> | undefined,
          visibleFields,
          fieldOverrides,
          nestedConfigs,
          childIntrospection,
        }),
      [mode, data, visibleFields, fieldOverrides, nestedConfigs, childIntrospection],
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
      // Shallow-clone each nested row so callers that mutate the payload do
      // not accidentally mutate react-hook-form's internal state. The
      // foreign-key column is still the action layer's responsibility — we
      // leave the value as-is if the caller already provided one.
      for (const [key] of Object.entries(nestedConfigs)) {
        const rows = (values as Record<string, unknown>)[key];
        if (Array.isArray(rows)) {
          (values as Record<string, unknown>)[key] = rows.map((row) => ({
            ...(row as Record<string, unknown>),
          }));
        }
      }
      // The runtime shape has been validated by the resolver, so we can
      // cast back to the inferred generic here.
      await onSubmit(
        values as unknown as InferAutoFormValues<TTable, TNested>,
      );
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
        {Object.entries(nestedConfigs).map(([key, config]) => {
          const childErrorRaw = form.formState.errors[key];
          // Only top-level (min/max) nested errors carry a string `message` —
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

// Re-export for test-only access to the deprecation warning state. Not part
// of the public API — tests use this to reset between runs.
/** @internal */
export function __resetChildrenDeprecationWarning() {
  childrenDeprecationWarned = false;
}
