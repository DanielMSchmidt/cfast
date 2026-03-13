import { defineEnv } from "@cfast/env";

export const envSchema = {
  DB: { type: "d1" as const },
  APP_URL: { type: "var" as const, default: "http://localhost:5173" },
};

export const env = defineEnv(envSchema);

export type Env = ReturnType<typeof env.get>;
