import type { Config } from "../types";

export function generateEnv(config: Config): string {
  const bindings: string[] = [];
  bindings.push(
    `  APP_URL: { type: "var" as const, default: "http://localhost:5173" },`,
  );

  if (config.features.db) {
    bindings.push(`  DB: { type: "d1" as const },`);
  }
  if (config.features.storage) {
    bindings.push(`  UPLOADS: { type: "r2" as const },`);
  }
  if (config.features.auth) {
    bindings.push(`  CACHE: { type: "kv" as const },`);
  }
  if (config.features.email) {
    bindings.push(`  MAILGUN_API_KEY: { type: "secret" as const },`);
    bindings.push(`  MAILGUN_DOMAIN: { type: "var" as const },`);
  }

  return `import { defineEnv } from "@cfast/env";

export const envSchema = {
${bindings.join("\n")}
};

export const env = defineEnv(envSchema);

export type Env = ReturnType<typeof env.get>;
`;
}
