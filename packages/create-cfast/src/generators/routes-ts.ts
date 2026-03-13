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

  return `${imports.join("\n")}

export default [
${routes.join("\n")}
] satisfies RouteConfig;
`;
}
