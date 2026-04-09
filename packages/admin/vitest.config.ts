import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    server: {
      deps: {
        // node:sqlite is experimental (Node 22+) and not in builtinModules,
        // so vitest won't auto-externalise it.  See #189.
        external: [/^node:sqlite$/],
      },
    },
  },
});
