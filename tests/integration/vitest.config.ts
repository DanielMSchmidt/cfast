import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

function workersProject(
  name: string,
  include: string[],
  wranglerConfig: string,
) {
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: wranglerConfig },
      }),
    ],
    test: {
      name,
      include,
      globals: true,
    },
  };
}

export default defineConfig({
  test: {
    projects: [
      workersProject(
        "db-permissions",
        ["db-permissions/**/*.test.ts"],
        "wrangler/db-permissions.toml",
      ),
      workersProject(
        "auth-flow",
        ["auth-flow/**/*.test.ts"],
        "wrangler/auth-flow.toml",
      ),
      workersProject(
        "core-plugins",
        ["core-plugins/**/*.test.ts"],
        "wrangler/core-plugins.toml",
      ),
      workersProject(
        "actions",
        ["actions/**/*.test.ts"],
        "wrangler/actions.toml",
      ),
      workersProject(
        "storage",
        ["storage/**/*.test.ts"],
        "wrangler/storage.toml",
      ),
      workersProject(
        "env",
        ["env/**/*.test.ts"],
        "wrangler/env.toml",
      ),
      workersProject(
        "email",
        ["email/**/*.test.ts"],
        "wrangler/email.toml",
      ),
      workersProject(
        "permissions",
        ["permissions/**/*.test.ts"],
        "wrangler/db-permissions.toml",
      ),
    ],
  },
});
