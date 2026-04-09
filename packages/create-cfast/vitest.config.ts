import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
    testTimeout: 120_000,
    hookTimeout: 60_000,
    server: {
      deps: {
        // node:sqlite is experimental (Node 22+) and not in builtinModules,
        // so vitest won't auto-externalise it.  See #189.
        external: [/^node:sqlite$/],
      },
    },
  },
});
