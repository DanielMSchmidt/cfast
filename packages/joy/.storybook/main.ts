import type { StorybookConfig } from "@storybook/react-vite";
import type { InlineConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  addons: [],
  viteFinal(config: InlineConfig): InlineConfig {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        // Allow TypeScript's .js extension convention: foo.js resolves to foo.tsx
        extensionAlias: {
          ".js": [".tsx", ".ts", ".js"],
        },
      },
    };
  },
};

export default config;
