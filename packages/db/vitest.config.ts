import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    server: {
      deps: {
        // node:sqlite is experimental (Node 22+) and missing from
        // Node's builtinModules list, so vitest won't auto-externalise it.
        // Without this, any test helper that imports node:sqlite (e.g.
        // in-process D1 via miniflare) crashes with:
        //   "Cannot bundle Node.js built-in 'node:sqlite'"
        // See: https://github.com/DanielMSchmidt/cfast/issues/189
        external: [/^node:sqlite$/],
      },
    },
  },
});
