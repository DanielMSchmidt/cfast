import type React from "react";
import type { UseFormRegister, FieldValues } from "react-hook-form";

export type ValidationRules = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
};

export type InputType = "text" | "number" | "checkbox" | "select";

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

export type FieldConfig = {
  label?: string;
  placeholder?: string;
  hidden?: boolean;
  default?: unknown;
  component?: React.ComponentType<FieldComponentProps>;
  validate?: (value: unknown) => string | undefined;
};

export type FieldComponentProps = {
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  error?: string;
  enumValues?: string[];
  register: UseFormRegister<FieldValues>;
};

export type FormPluginComponents = {
  textInput: React.ComponentType<FieldComponentProps>;
  numberInput: React.ComponentType<FieldComponentProps>;
  select: React.ComponentType<FieldComponentProps>;
  checkbox: React.ComponentType<FieldComponentProps>;
  form: React.ComponentType<FormWrapperProps>;
  submitButton: React.ComponentType<SubmitButtonProps>;
};

export type FormWrapperProps = {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  method?: string;
  formRef?: React.RefObject<HTMLFormElement | null>;
};

export type SubmitButtonProps = {
  isSubmitting: boolean;
  children: React.ReactNode;
};

export type FormPlugin = {
  components: FormPluginComponents;
};
