import type { Config } from "../types";

export function generateViteConfig(config: Config): string {
  const optimizeDeps: string[] = [];
  if (config.features.ui && config.uiLibrary === "joy") {
    optimizeDeps.push(`"@cfast/ui/joy"`);
  }
  if (config.features.ui) {
    optimizeDeps.push(`"@cfast/actions/client"`);
  }
  if (config.features.auth) {
    optimizeDeps.push(`"@cfast/auth/client"`);
  }

  const optimizeDepsBlock =
    optimizeDeps.length > 0
      ? `
  optimizeDeps: {
    include: [
      ${optimizeDeps.join(",\n      ")},
    ],
  },`
      : "";

  return `import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },${optimizeDepsBlock}
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
});
`;
}
