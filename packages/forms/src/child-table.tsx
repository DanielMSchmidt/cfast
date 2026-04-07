import { useFieldArray } from "react-hook-form";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type {
  ChildTableComponentProps,
  ChildTableConfig,
  FieldDefinition,
  FieldConfig,
  FormPlugin,
} from "./types";

/**
 * Build a default empty row for a child table by walking the introspected fields
 * and applying any per-field `default` overrides.
 *
 * @internal
 */
export function buildEmptyChildRow(
  fields: FieldDefinition[],
  fieldOverrides: Partial<Record<string, FieldConfig>> | undefined,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of fields) {
    const override = fieldOverrides?.[field.name];
    if (override?.default !== undefined) {
      row[field.name] = override.default;
      continue;
    }
    if (override?.computed !== undefined) {
      // Computed fields will be filled in by the watcher; leave undefined for now.
      continue;
    }
    if (field.inputType === "checkbox") {
      row[field.name] = false;
    } else if (field.inputType === "number") {
      row[field.name] = 0;
    } else {
      row[field.name] = "";
    }
  }
  return row;
}

/**
 * Pick the right plugin component for a given field's input type.
 *
 * @internal
 */
function pickComponent(plugin: FormPlugin, field: FieldDefinition) {
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
 * Default child-table renderer.
 *
 * Used automatically by `createAutoForm` when a plugin does not provide its own
 * `childTable` component. Renders each row as a stack of plugin field components,
 * plus add / remove / reorder controls.
 *
 * Plugins are encouraged to ship their own implementation that matches their
 * design system, but this fallback keeps `createAutoForm` usable with any plugin
 * out of the box.
 */
export function DefaultChildTable({
  name,
  label,
  fields,
  fieldOverrides,
  rowIds,
  canAddRow,
  canRemoveRow,
  reorderable,
  onAddRow,
  onRemoveRow,
  onMoveUp,
  onMoveDown,
  error,
  form,
  plugin,
}: ChildTableComponentProps) {
  return (
    <fieldset
      data-cfast-child-table={name}
      style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}
    >
      <legend>{label}</legend>
      {error && (
        <div role="alert" style={{ color: "red", marginBottom: 8 }}>
          {error}
        </div>
      )}
      {rowIds.map((rowId, index) => (
        <div
          key={rowId}
          data-cfast-child-row={index}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: "1px dashed #eee",
          }}
        >
          {fields.map((field) => {
            const override = fieldOverrides?.[field.name];
            if (override?.hidden) return null;
            const Component = override?.component ?? pickComponent(plugin, field);
            const fieldName = `${name}.${index}.${field.name}`;
            const errors = form.formState.errors[name];
            const rowError =
              Array.isArray(errors) && errors[index]
                ? (errors[index] as Record<string, { message?: string }>)
                : undefined;
            const message = rowError?.[field.name]?.message;
            return (
              <Component
                key={field.name}
                name={fieldName}
                label={override?.label ?? field.label}
                placeholder={override?.placeholder}
                required={field.required}
                readOnly={override?.readOnly || !!override?.computed}
                error={typeof message === "string" ? message : undefined}
                enumValues={field.enumValues}
                register={form.register}
              />
            );
          })}
          <div style={{ display: "flex", gap: 4 }}>
            {reorderable && (
              <>
                <button
                  type="button"
                  aria-label={`Move ${label} row ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => onMoveUp(index)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${label} row ${index + 1} down`}
                  disabled={index === rowIds.length - 1}
                  onClick={() => onMoveDown(index)}
                >
                  ↓
                </button>
              </>
            )}
            <button
              type="button"
              aria-label={`Remove ${label} row ${index + 1}`}
              disabled={!canRemoveRow}
              onClick={() => onRemoveRow(index)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        aria-label={`Add ${label} row`}
        disabled={!canAddRow}
        onClick={onAddRow}
      >
        Add row
      </button>
    </fieldset>
  );
}

/**
 * Internal hook used by `AutoForm` to wire up a single child table to its
 * `useFieldArray` instance and produce the props needed by the plugin's
 * `childTable` component.
 *
 * @internal
 */
export function useChildTableArray(
  form: UseFormReturn<FieldValues>,
  name: string,
  config: ChildTableConfig,
  introspectedFields: FieldDefinition[],
) {
  const fieldArray = useFieldArray({
    control: form.control,
    name,
  });

  const visibleFields = introspectedFields.filter(
    (f) => !config.fields?.[f.name]?.hidden,
  );

  const append = () => {
    const max = config.maxRows;
    if (max !== undefined && fieldArray.fields.length >= max) return;
    fieldArray.append(buildEmptyChildRow(introspectedFields, config.fields));
  };

  const remove = (index: number) => {
    const min = config.minRows ?? 0;
    if (fieldArray.fields.length <= min) return;
    fieldArray.remove(index);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    fieldArray.move(index, index - 1);
  };

  const moveDown = (index: number) => {
    if (index >= fieldArray.fields.length - 1) return;
    fieldArray.move(index, index + 1);
  };

  return {
    fieldArray,
    visibleFields,
    append,
    remove,
    moveUp,
    moveDown,
  };
}
