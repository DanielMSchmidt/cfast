import { defineEnv } from "@cfast/env";

export const env = defineEnv({
  DB: { type: "d1" },
  UPLOADS: { type: "r2" },
  CACHE: { type: "kv" },
  APP_URL: { type: "var", default: "http://localhost:5173" },
  MAILGUN_API_KEY: { type: "secret" },
  MAILGUN_DOMAIN: { type: "var" },
});

export type Env = ReturnType<typeof env.get>;
