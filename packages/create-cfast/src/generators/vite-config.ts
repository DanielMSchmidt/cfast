import type { Config } from "../types";

export function generateViteConfig(config: Config): string {
  const optimizeDeps: string[] = [];
  if (config.features.ui && config.uiLibrary === "joy") {
    optimizeDeps.push(`"@cfast/joy"`);
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

  // When using the Joy UI plugin we have to dedupe @emotion/react and
  // @emotion/styled across SSR + client environments. Without this, the
  // dev server gives each environment its own optimized copy and emotion
  // warns about "multiple builds of the same version" — under React 19,
  // the duplicate emotion contexts also surface as a "Cannot read
  // properties of null (reading 'useContext')" error from JoyButton
  // component={Link} after navigation (issue #187).
  const dedupeList: string[] = ['"react"', '"react-dom"'];
  if (config.features.ui && config.uiLibrary === "joy") {
    dedupeList.unshift('"@emotion/react"', '"@emotion/styled"');
  }
  const dedupeBlock = `
    dedupe: [${dedupeList.join(", ")}],`;

  return `import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { cfastRoutesCheckPlugin } from "./vite-plugin-cfast-routes";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,${dedupeBlock}
  },${optimizeDepsBlock}
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    cfastRoutesCheckPlugin(),
  ],
});
`;
}
