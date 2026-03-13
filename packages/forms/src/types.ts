import type React from "react";
import type { UseFormRegister, FieldValues } from "react-hook-form";

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
