import type React from "react";
import type {
  UseFormRegister,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Table } from "drizzle-orm";

/**
 * Validation rules that can be attached to a Drizzle column via the {@link v} helper.
 *
 * These rules are stored as metadata on the column builder and read back by
 * {@link introspectTable} to generate client-side validation via {@link createResolver}.
 *
 * @example
 * ```ts
 * import { v } from "@cfast/forms";
 * import { text, integer } from "drizzle-orm/sqlite-core";
 *
 * const title = v(text("title").notNull(), { minLength: 3, maxLength: 200 });
 * const views = v(integer("views"), { min: 0, message: "Views cannot be negative" });
 * ```
 */
export type ValidationRules = {
  /** Minimum string length. Applied to text/varchar inputs. */
  minLength?: number;
  /** Maximum string length. Applied to text/varchar inputs. */
  maxLength?: number;
  /** Minimum numeric value. Applied to number inputs. */
  min?: number;
  /** Maximum numeric value. Applied to number inputs. */
  max?: number;
  /** Regex pattern the string value must match. */
  pattern?: RegExp;
  /** Custom error message displayed when any rule fails. Overrides the auto-generated message. */
  message?: string;
};

/**
 * The HTML input type mapped from a Drizzle column type.
 *
 * Used by {@link FieldDefinition} to determine which UI component to render.
 */
export type InputType = "text" | "number" | "checkbox" | "select";

/**
 * A field definition produced by {@link introspectTable}, describing a single form field.
 *
 * Contains all metadata needed to render and validate a field: input type, label,
 * required status, enum options, and validation rules derived from both the Drizzle
 * schema and any rules attached via {@link v}.
 */
export type FieldDefinition = {
  /** The column key from the Drizzle table (e.g., `"title"`, `"authorId"`). */
  name: string;
  /** The resolved input type based on the Drizzle column type. */
  inputType: InputType;
  /** Human-readable label derived from the column name (e.g., `"Author Id"` from `"authorId"`). */
  label: string;
  /** Whether the column is NOT NULL (and therefore required in the form). */
  required: boolean;
  /** Whether the column has a default value defined in the schema. */
  hasDefault: boolean;
  /** Whether the column is the table's primary key. */
  isPrimaryKey: boolean;
  /** Available options for enum/select fields, copied from the Drizzle column definition. */
  enumValues?: string[];
  /** Merged validation rules from schema introspection and {@link v} annotations. */
  validation: ValidationRules;
};

/**
 * Per-field overrides for customizing auto-generated form fields.
 *
 * Pass a record of `{ [columnName]: FieldConfig }` to the AutoForm `fields` prop
 * to override labels, placeholders, visibility, defaults, components, or validation
 * for individual fields.
 *
 * @example
 * ```tsx
 * <AutoForm
 *   table={posts}
 *   mode="create"
 *   fields={{
 *     title: { label: "Post Title", placeholder: "Enter a title..." },
 *     content: { component: RichTextEditor },
 *     authorId: { hidden: true, default: currentUser.id },
 *   }}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export type FieldConfig = {
  /** Override the auto-generated label for this field. */
  label?: string;
  /** Placeholder text shown inside the input. */
  placeholder?: string;
  /** Hide this field from the rendered form. The field is still submitted if a default is set. */
  hidden?: boolean;
  /** Default value for the field in create mode. */
  default?: unknown;
  /** Custom React component to render instead of the plugin's default for this input type. */
  component?: React.ComponentType<FieldComponentProps>;
  /** Custom validation function. Return an error message string to fail, or `undefined` to pass. */
  validate?: (value: unknown) => string | undefined;
  /**
   * Mark the field as read-only. Read-only fields are still rendered and submitted
   * but cannot be edited by the user. Pairs naturally with `computed`.
   */
  readOnly?: boolean;
  /**
   * Compute this field's value from the rest of the form values. The function is
   * re-evaluated whenever any watched form value changes, and the result is written
   * back into the form via `setValue` so it shows up in the rendered input and the
   * submitted payload.
   *
   * Computed fields are typically combined with `readOnly: true`.
   *
   * @example
   * ```ts
   * fields: {
   *   totalCalories: {
   *     computed: (values) =>
   *       values.ingredients.reduce(
   *         (sum, ing) => sum + (ing.calories * ing.amount) / 100,
   *         0,
   *       ),
   *     readOnly: true,
   *   },
   * }
   * ```
   */
  computed?: (values: Record<string, unknown>) => unknown;
};

/**
 * Configuration for a child table rendered as a dynamic field array under a parent
 * AutoForm.
 *
 * Child tables are introspected the same way the parent table is — column types,
 * required flags, enums, and `v()` validation rules all flow through. The rendered
 * form exposes add / remove (and optionally reorder) controls and submits a typed
 * array of rows under the configured key.
 *
 * @example
 * ```ts
 * createAutoForm({
 *   table: recipes,
 *   children: {
 *     ingredients: {
 *       table: ingredients,
 *       foreignKey: "recipe_id",
 *       minRows: 1,
 *       maxRows: 50,
 *       reorderable: true,
 *       fields: { name: {}, amount: { placeholder: "g" } },
 *     },
 *   },
 *   onSubmit: async (values) => {
 *     // values.ingredients is the typed array of child rows
 *   },
 * });
 * ```
 */
export type ChildTableConfig = {
  /** The Drizzle SQLite table that backs each row of the array. */
  table: SQLiteTable;
  /**
   * Foreign key column on the child table that points back at the parent. The
   * column is automatically excluded from the rendered child fields and stamped
   * onto each row at submit time.
   */
  foreignKey: string;
  /** Minimum number of rows the user must provide. Defaults to 0. */
  minRows?: number;
  /** Maximum number of rows the user is allowed to add. Defaults to unlimited. */
  maxRows?: number;
  /** Show reorder controls (move up / move down). Defaults to false. */
  reorderable?: boolean;
  /** Per-column overrides for the child table fields, identical in shape to the parent {@link FieldConfig}. */
  fields?: Partial<Record<string, FieldConfig>>;
  /** Additional column names to omit from the rendered child rows. */
  exclude?: string[];
  /** Override the heading rendered above the child table (defaults to a humanised key). */
  label?: string;
  /** Override the "Add row" button label. */
  addLabel?: string;
};

/**
 * Configuration for a nested child table rendered as a dynamic field array
 * under an {@link AutoForm}.
 *
 * This is the successor to the deprecated {@link ChildTableConfig} record
 * shape. Pass an array of these via the {@link AutoForm} `nested` prop:
 *
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
 *       fields: { name: { placeholder: "Flour" } },
 *     },
 *   ]}
 *   onSubmit={async (values) => {
 *     // values.ingredients is fully typed — no casts needed.
 *   }}
 * />
 * ```
 *
 * The array shape (as opposed to `Record<string, ChildTableConfig>`) avoids
 * the JSX-reserved `children` attribute collision and enables the whole form
 * value type to be inferred via {@link InferAutoFormValues}.
 *
 * The key the nested array appears under in the submitted values is either:
 * - `as` (explicit override), or
 * - the table's runtime name from `getTableName(table)` (e.g.
 *   `sqliteTable("ingredients", ...)` → `ingredients`).
 */
export type NestedTableConfig<
  TTable extends Table = SQLiteTable,
  TAs extends string | undefined = string | undefined,
> = {
  /** The Drizzle SQLite table that backs each row of the array. */
  table: TTable;
  /**
   * Foreign key column on the nested table that points back at the parent.
   * The column is automatically excluded from the rendered nested fields and
   * stamped onto each row at submit time.
   */
  foreignKey: keyof InferTableRow<TTable> & string;
  /**
   * Override the key the nested array appears under in submitted form values.
   *
   * Defaults to the table's runtime name (e.g. `sqliteTable("ingredients", …)`
   * → `"ingredients"`). Pass `as` when two nested tables would otherwise
   * collide, or when you want the form key to differ from the table name.
   */
  as?: TAs;
  /** Minimum number of rows the user must provide. Defaults to 0. */
  min?: number;
  /** Maximum number of rows the user is allowed to add. Defaults to unlimited. */
  max?: number;
  /** Show reorder controls (move up / move down). Defaults to false. */
  reorderable?: boolean;
  /** Per-column overrides for the nested table fields, identical in shape to the parent {@link FieldConfig}. */
  fields?: Partial<Record<keyof InferTableRow<TTable> & string, FieldConfig>>;
  /** Additional column names to omit from the rendered nested rows. */
  exclude?: Array<keyof InferTableRow<TTable> & string>;
  /** Override the heading rendered above the nested table (defaults to a humanised key). */
  label?: string;
  /** Override the "Add row" button label. */
  addLabel?: string;
};

// --- Type inference helpers for the `nested` API ----------------------------

/**
 * Extract the row type from a Drizzle table type.
 *
 * Mirrors `InferRow` from `@cfast/db`, duplicated here to avoid a cross-package
 * dependency (forms depends only on `drizzle-orm`, not on `@cfast/db`). If the
 * table exposes `$inferSelect` (every Drizzle v0.30+ table does), its row type
 * is extracted; otherwise we fall back to `Record<string, unknown>`.
 *
 * @internal
 */
export type InferTableRow<TTable> = TTable extends { $inferSelect: infer R }
  ? R
  : Record<string, unknown>;

/**
 * Derive the form key for a nested entry.
 *
 * Precedence:
 * 1. Explicit `as` on the {@link NestedTableConfig}.
 * 2. The table's runtime name (`T['_']['name']` in Drizzle's internal type).
 * 3. `string` as a last-ditch fallback for opaque tables.
 *
 * @internal
 */
export type NestedKey<TConfig> = TConfig extends { as: infer A extends string }
  ? A
  : TConfig extends { table: infer T }
    ? T extends { _: { name: infer N extends string } }
      ? N
      : string
    : string;

/**
 * Merge a tuple of {@link NestedTableConfig} entries into a `{ [key]: Row[] }`
 * object, using {@link NestedKey} as the key for each entry.
 *
 * @internal
 */
export type InferNestedValues<TNested extends readonly NestedTableConfig[]> = {
  [K in TNested[number] as NestedKey<K>]: Array<InferTableRow<K["table"]>>;
};

/**
 * The fully inferred form value shape for an {@link AutoForm} given a parent
 * table and a tuple of nested configs.
 *
 * `InferAutoFormValues<typeof recipes, [{ table: typeof ingredients; foreignKey: "recipeId" }]>`
 * resolves to
 * `InferTableRow<typeof recipes> & { ingredients: Array<InferTableRow<typeof ingredients>> }`.
 */
export type InferAutoFormValues<
  TTable extends Table,
  TNested extends readonly NestedTableConfig[] | undefined,
> = TNested extends readonly NestedTableConfig[]
  ? InferTableRow<TTable> & InferNestedValues<TNested>
  : InferTableRow<TTable>;

/**
 * Props for the {@link FormPluginComponents.childTable} component.
 *
 * Receives the introspected child fields, the live row values, and a set of
 * row-level callbacks. The plugin is responsible for rendering inputs for each
 * row and wiring up the add / remove / reorder buttons.
 */
export type ChildTableComponentProps = {
  /** Stable name (object key) under which the array is stored in form values. */
  name: string;
  /** Heading rendered above the table (label override or humanised name). */
  label: string;
  /** Visible field definitions for each row. */
  fields: FieldDefinition[];
  /** Per-field overrides for the child rows. */
  fieldOverrides?: Partial<Record<string, FieldConfig>>;
  /** Stable ids for each row, in render order. Use these as React keys. */
  rowIds: string[];
  /** Whether the user is allowed to add another row. */
  canAddRow: boolean;
  /** Whether the user is allowed to remove a row right now. */
  canRemoveRow: boolean;
  /** Whether reorder controls should be rendered. */
  reorderable: boolean;
  /** Append a new empty row, applying configured field defaults. */
  onAddRow: () => void;
  /** Remove the row at the given index. */
  onRemoveRow: (index: number) => void;
  /** Move the row at `index` one slot up (no-op at the top). */
  onMoveUp: (index: number) => void;
  /** Move the row at `index` one slot down (no-op at the bottom). */
  onMoveDown: (index: number) => void;
  /** Optional validation error displayed above the rows (e.g. min row violations). */
  error?: string;
  /** The underlying react-hook-form instance for binding row inputs via `register`. */
  form: UseFormReturn<FieldValues>;
  /** Plugin used to render individual cells. */
  plugin: FormPlugin;
};

/**
 * Props passed to field components by the auto-generated form.
 *
 * Both built-in plugin components and custom components provided via
 * {@link FieldConfig.component} receive these props.
 */
export type FieldComponentProps = {
  /** The field name, used as the form registration key. */
  name: string;
  /** Human-readable label for the field. */
  label: string;
  /** Optional placeholder text for the input. */
  placeholder?: string;
  /** Whether the field is required (NOT NULL in the schema). */
  required: boolean;
  /** Whether the field should be rendered as read-only (disables editing). */
  readOnly?: boolean;
  /** Validation error message, if any. */
  error?: string;
  /** Available options for select/enum fields. */
  enumValues?: string[];
  /** The react-hook-form `register` function for binding the input to form state. */
  register: UseFormRegister<FieldValues>;
};

/**
 * The set of UI components a {@link FormPlugin} must provide.
 *
 * Each component handles rendering a specific input type. The `form` and `submitButton`
 * components wrap the overall form structure.
 *
 * @example
 * ```ts
 * const components: FormPluginComponents = {
 *   textInput: MyTextInput,
 *   numberInput: MyNumberInput,
 *   select: MySelect,
 *   checkbox: MyCheckbox,
 *   form: MyFormWrapper,
 *   submitButton: MySubmitButton,
 * };
 * ```
 */
export type FormPluginComponents = {
  /** Component for rendering text/varchar column inputs. */
  textInput: React.ComponentType<FieldComponentProps>;
  /** Component for rendering integer/number column inputs. */
  numberInput: React.ComponentType<FieldComponentProps>;
  /** Component for rendering enum column inputs as a dropdown select. */
  select: React.ComponentType<FieldComponentProps>;
  /** Component for rendering boolean column inputs as a checkbox. */
  checkbox: React.ComponentType<FieldComponentProps>;
  /** Wrapper component for the entire form element. Receives `onSubmit` and children. */
  form: React.ComponentType<FormWrapperProps>;
  /** Component for the form's submit button. Receives loading state and label. */
  submitButton: React.ComponentType<SubmitButtonProps>;
  /**
   * Component for rendering a parent-child / dynamic field array section.
   * Optional — if a plugin omits this, a built-in fallback (`DefaultChildTable`)
   * is used so existing plugins keep working unchanged.
   */
  childTable?: React.ComponentType<ChildTableComponentProps>;
};

/**
 * Props for the form wrapper component provided by a {@link FormPlugin}.
 *
 * The wrapper is responsible for rendering the `<form>` element and wiring up submission.
 */
export type FormWrapperProps = {
  /** Form submission handler, typically bound to react-hook-form's `handleSubmit`. */
  onSubmit: (e: React.FormEvent) => void;
  /** The rendered field components and submit button. */
  children: React.ReactNode;
};

/**
 * Props for the submit button component provided by a {@link FormPlugin}.
 */
export type SubmitButtonProps = {
  /** Whether the form is currently submitting. Use this to show a loading indicator. */
  isSubmitting: boolean;
  /** The button label (e.g., `"Submit"`). */
  children: React.ReactNode;
};

/**
 * A form plugin created by {@link createFormPlugin}.
 *
 * Encapsulates the UI component implementations needed to render auto-generated forms.
 * Pass this to {@link createAutoForm} to produce a ready-to-use `AutoForm` component.
 */
export type FormPlugin = {
  /** The UI components used to render each field type and the form structure. */
  components: FormPluginComponents;
};
