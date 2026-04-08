import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Force a single instance of @emotion/react across SSR and client
    // bundles so MUI Joy + React Router HMR don't end up with two emotion
    // caches (which manifests as a "Cannot read properties of null
    // (reading 'useContext')" error from JoyButton component={Link} after
    // navigation, plus an emotion warning about "multiple builds of the
    // same version").
    dedupe: ["@emotion/react", "@emotion/styled", "react", "react-dom"],
  },
  optimizeDeps: {
    // Pre-bundle workspace packages used by routes loaded via client-side
    // navigation, so Vite doesn't 504 "Outdated Optimize Dep" mid-navigation.
    include: [
      "@cfast/joy",
      "@cfast/actions/client",
      "@cfast/auth/client",
    ],
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
});
