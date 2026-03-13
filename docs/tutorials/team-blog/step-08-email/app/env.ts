import { defineEnv } from "@cfast/env";

export const envSchema = {
  DB: { type: "d1" as const },
  UPLOADS: { type: "r2" as const },
  APP_URL: { type: "var" as const, default: "http://localhost:5173" },
  MAILGUN_API_KEY: { type: "secret" as const },
  MAILGUN_DOMAIN: { type: "var" as const },
};

export const env = defineEnv(envSchema);

export type Env = ReturnType<typeof env.get>;
