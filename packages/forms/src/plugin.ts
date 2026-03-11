import type { FormPlugin, FormPluginComponents } from "./types";

export function createFormPlugin(config: {
  components: FormPluginComponents;
}): FormPlugin {
  return { components: config.components };
}
