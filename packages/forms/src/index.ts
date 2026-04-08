/** @module forms */
export { introspectTable } from "./introspect";
export { createResolver } from "./resolver";
export { createFormPlugin } from "./plugin";
export { createAutoForm } from "./auto-form";
export { DefaultChildTable } from "./child-table";
export { v, upload, getUploadMetadata } from "./validate";

export type {
  ValidationRules,
  FieldDefinition,
  FieldConfig,
  FieldComponentProps,
  FormPlugin,
  FormPluginComponents,
  FormWrapperProps,
  SubmitButtonProps,
  InputType,
  ChildTableConfig,
  ChildTableComponentProps,
  NestedTableConfig,
  InferAutoFormValues,
  InferTableRow,
  InferNestedValues,
  NestedKey,
  UploadFieldMetadata,
} from "./types";
