import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

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
      ],
    }),
  ],
});
