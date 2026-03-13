import type { FormPlugin, FormPluginComponents } from "./types";

/**
 * Create a form plugin that provides UI components for rendering auto-generated forms.
 *
 * The plugin encapsulates all UI-specific rendering: one component per input type
 * (`textInput`, `numberInput`, `select`, `checkbox`), a form wrapper, and a submit button.
 * The headless core ({@link introspectTable}, {@link createResolver}) remains UI-agnostic;
 * the plugin bridges it to a specific component library.
 *
 * @param config - Configuration object containing the {@link FormPluginComponents} implementations.
 * @returns A {@link FormPlugin} to pass to {@link createAutoForm}.
 *
 * @example
 * ```ts
 * import { createFormPlugin, createAutoForm } from "@cfast/forms";
 *
 * const plugin = createFormPlugin({
 *   components: {
 *     textInput: MyTextInput,
 *     numberInput: MyNumberInput,
 *     select: MySelect,
 *     checkbox: MyCheckbox,
 *     form: MyFormWrapper,
 *     submitButton: MySubmitButton,
 *   },
 * });
 *
 * export const AutoForm = createAutoForm(plugin);
 * ```
 */
export function createFormPlugin(config: {
  components: FormPluginComponents;
}): FormPlugin {
  return { components: config.components };
}
