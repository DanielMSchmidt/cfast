import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { introspectTable } from "./introspect";
import { buildResolver } from "./resolver";
import type { FieldConfig, FieldDefinition, FormPlugin } from "./types";

type AutoFormProps = {
  table: SQLiteTable;
  mode: "create" | "edit";
  data?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  fields?: Partial<Record<string, FieldConfig>>;
  exclude?: string[];
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
      () => buildResolver(visibleFields),
      [visibleFields],
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
