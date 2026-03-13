import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  integrations: [
    starlight({
      title: "CFast",
      description:
        "Composable TypeScript libraries for Cloudflare Workers + React Router + Drizzle ORM.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/danielschmidt/cfast",
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
