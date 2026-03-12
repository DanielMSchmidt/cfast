import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  optimizeDeps: {
    // Pre-bundle workspace packages used by routes loaded via client-side
    // navigation, so Vite doesn't 504 "Outdated Optimize Dep" mid-navigation.
    include: [
      "@cfast/ui/joy",
      "@cfast/actions/client",
      "@cfast/auth/client",
    ],
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
