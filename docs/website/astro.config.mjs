import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  site: "https://danielmschmidt.github.io",
  base: "/cfast",
  integrations: [
    starlight({
      title: "CFast",
      description:
        "Composable TypeScript libraries for Cloudflare Workers + React Router + Drizzle ORM.",
      logo: {
        src: "./src/assets/cfast-logo.png",
        alt: "CFast",
      },
      favicon: "/favicon.ico",
      head: [
        { tag: "link", attrs: { rel: "icon", type: "image/png", sizes: "32x32", href: "/cfast/favicon-32x32.png" } },
        { tag: "link", attrs: { rel: "icon", type: "image/png", sizes: "16x16", href: "/cfast/favicon-16x16.png" } },
        { tag: "link", attrs: { rel: "apple-touch-icon", sizes: "180x180", href: "/cfast/apple-touch-icon.png" } },
        { tag: "link", attrs: { rel: "manifest", href: "/cfast/site.webmanifest" } },
      ],
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/DanielMSchmidt/cfast",
        },
      ],
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Tutorial: Build a Team Blog",
          autogenerate: { directory: "tutorial" },
        },
        typeDocSidebarGroup,
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            "../../packages/env/src/index.ts",
            "../../packages/permissions/src/index.ts",
            "../../packages/core/src/index.ts",
            "../../packages/db/src/index.ts",
            "../../packages/auth/src/index.ts",
            "../../packages/storage/src/index.ts",
            "../../packages/actions/src/index.ts",
            "../../packages/ui/src/index.ts",
            "../../packages/forms/src/index.ts",
            "../../packages/email/src/index.ts",
            "../../packages/pagination/src/index.ts",
            "../../packages/admin/src/index.ts",
          ],
          tsconfig: "./tsconfig.typedoc.json",
          output: "api",
          sidebar: {
            label: "API Reference",
            collapsed: true,
          },
        }),
      ],
    }),
  ],
});
