import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { introspectTable } from "./introspect";
import { createResolver } from "./resolver";
import type { FieldConfig, FieldDefinition, FormPlugin } from "./types";

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
 * Create an AutoForm React component bound to a specific UI {@link FormPlugin}.
 *
 * The returned component introspects a Drizzle table via {@link introspectTable},
 * builds validation via {@link createResolver}, and renders fields using the
 * plugin's components. Supports both create and edit modes, per-field overrides
 * via {@link FieldConfig}, column exclusion, and external react-hook-form instances.
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
 * // Create mode
 * <AutoForm table={posts} mode="create" onSubmit={handleSubmit} />
 *
 * // Edit mode with field overrides
 * <AutoForm
 *   table={posts}
 *   mode="edit"
 *   data={existingPost}
 *   fields={{ title: { label: "Post Title" } }}
 *   exclude={["createdAt"]}
 *   onSubmit={handleSubmit}
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

    const resolver = useMemo(
      () => createResolver(visibleFields, fieldOverrides),
      [visibleFields, fieldOverrides],
    );

    const defaultValues = useMemo(() => {
      if (mode === "edit" && data) return data;
      const defaults: Record<string, unknown> = {};
      for (const field of visibleFields) {
        const override = fieldOverrides?.[field.name];
        if (override?.default !== undefined) {
          defaults[field.name] = override.default;
        }
      }
      return defaults;
    }, [mode, data, visibleFields, fieldOverrides]);

    const internalForm = useForm({
      resolver,
      defaultValues,
    });

    const form = externalForm ?? internalForm;

    const handleSubmit = form.handleSubmit(async (values) => {
      await onSubmit(values);
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
              error={error}
              enumValues={field.enumValues}
              register={form.register}
            />
          );
        })}
        <SubmitButton isSubmitting={form.formState.isSubmitting}>
          Submit
        </SubmitButton>
      </FormWrapper>
    );
  }

  return AutoForm;
}
