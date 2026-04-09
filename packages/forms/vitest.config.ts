import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // AutoForm tests drive a real react-hook-form instance through jsdom, and
    // `user.type` / `user.click` interactions are noticeably slower than the
    // vitest default. 15s per test is still fast enough to catch hangs while
    // being tolerant of CI variance.
    testTimeout: 15_000,
    // Run test files sequentially in a single worker. Parallel jsdom workers
    // starve each other on slower machines, producing timeouts in tests that
    // perform many `user.type` interactions against react-hook-form. Tests
    // within a single file still run sequentially, so total runtime is
    // dominated by the import graph rather than the worker count.
    fileParallelism: false,
    server: {
      deps: {
        // node:sqlite is experimental (Node 22+) and not in builtinModules,
        // so vitest won't auto-externalise it.  See #189.
        external: [/^node:sqlite$/],
      },
    },
  },
});
