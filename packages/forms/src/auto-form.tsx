import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { introspectTable } from "./introspect";
import { createResolver } from "./resolver";
import type { FieldConfig, FieldDefinition, FormPlugin } from "./types";

type AutoFormProps = {
  table: SQLiteTable;
  mode: "create" | "edit";
  data?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
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

    const formRef = useRef<HTMLFormElement>(null);
    const validatedRef = useRef(false);

    const rhfHandleSubmit = form.handleSubmit(async (values) => {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // Re-submit the form natively so React Router can intercept it
        validatedRef.current = true;
        formRef.current?.requestSubmit();
      }
    });

    const onFormSubmit = (e: React.FormEvent) => {
      if (validatedRef.current) {
        validatedRef.current = false;
        return; // Let native submission go through
      }
      rhfHandleSubmit(e);
    };

    const FormWrapper = plugin.components.form;
    const SubmitButton = plugin.components.submitButton;

    return (
      <FormWrapper onSubmit={onFormSubmit} method="post" formRef={formRef}>
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
