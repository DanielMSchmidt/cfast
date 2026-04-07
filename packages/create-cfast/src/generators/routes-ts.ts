import type { Config } from "../types";

export function generateRoutesTs(config: Config): string {
  const imports = [
    `import { type RouteConfig, index, route } from "@react-router/dev/routes";`,
  ];
  const routes: string[] = [`  index("routes/_index.tsx"),`];

  if (config.features.auth) {
    routes.push(`  route("login", "routes/login.tsx"),`);
    routes.push(`  route("api/auth/*", "routes/auth.$.tsx"),`);
  }

  if (config.features.admin) {
    routes.push(`  route("admin", "routes/admin.tsx"),`);
  }

  const jsdoc = `/**
 * Route registry for this app.
 *
 * IMPORTANT: React Router v7 does NOT auto-discover files in \`app/routes/\`.
 * Every new route file you create under \`app/routes/\` MUST be added here,
 * otherwise the URL will 404 even though the file compiles.
 *
 * Patterns:
 *   index("routes/_index.tsx")               → renders at "/"
 *   route("foo", "routes/foo.tsx")           → renders at "/foo"
 *   route("foo/:id", "routes/foo.$id.tsx")   → dynamic segment
 *   route("api/x/*", "routes/api.x.$.tsx")   → catch-all
 *
 * Naming convention: dotted file names like \`projects.$projectId.tsx\` are a
 * convention for readability — they are NOT auto-parsed. The URL is whatever
 * you pass as the first argument to route().
 *
 * After adding a route here, verify locally with \`pnpm dev\` before committing.
 */`;

  return `${imports.join("\n")}

${jsdoc}
export default [
${routes.join("\n")}
] satisfies RouteConfig;
`;
}
