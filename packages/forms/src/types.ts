import type React from "react";
import type { UseFormRegister, FieldValues } from "react-hook-form";

/** Validation rules that can be attached to a Drizzle column via {@link v}. */
export type ValidationRules = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
};

/** The HTML input type for a form field. */
export type InputType = "text" | "number" | "checkbox" | "select";

/** A field definition produced by {@link introspectTable}, describing a single form field. */
export type FieldDefinition = {
  name: string;
  inputType: InputType;
  label: string;
  required: boolean;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  enumValues?: string[];
  validation: ValidationRules;
};

/** Per-field overrides for customizing auto-generated form fields. */
export type FieldConfig = {
  label?: string;
  placeholder?: string;
  hidden?: boolean;
  default?: unknown;
  component?: React.ComponentType<FieldComponentProps>;
  validate?: (value: unknown) => string | undefined;
};

/** Props passed to field components by the auto-generated form. */
export type FieldComponentProps = {
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  error?: string;
  enumValues?: string[];
  register: UseFormRegister<FieldValues>;
};

/** The set of UI components a {@link FormPlugin} must provide. */
export type FormPluginComponents = {
  textInput: React.ComponentType<FieldComponentProps>;
  numberInput: React.ComponentType<FieldComponentProps>;
  select: React.ComponentType<FieldComponentProps>;
  checkbox: React.ComponentType<FieldComponentProps>;
  form: React.ComponentType<FormWrapperProps>;
  submitButton: React.ComponentType<SubmitButtonProps>;
};

/** Props for the form wrapper component. */
export type FormWrapperProps = {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
};

/** Props for the submit button component. */
export type SubmitButtonProps = {
  isSubmitting: boolean;
  children: React.ReactNode;
};

/** A form plugin created by {@link createFormPlugin}. */
export type FormPlugin = {
  components: FormPluginComponents;
};
