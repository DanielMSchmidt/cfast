import type { FormPlugin, FormPluginComponents } from "./types";

/**
 * Create a form plugin that provides UI components for auto-generated forms.
 *
 * @param config - Configuration object containing the UI component implementations.
 * @returns A {@link FormPlugin} to pass to {@link createAutoForm}.
 *
 * @example
 * ```ts
 * import { createFormPlugin } from "@cfast/forms";
 *
 * const plugin = createFormPlugin({
 *   components: { textInput, numberInput, select, checkbox, form, submitButton },
 * });
 * ```
 */
export function createFormPlugin(config: {
  components: FormPluginComponents;
}): FormPlugin {
  return { components: config.components };
}
