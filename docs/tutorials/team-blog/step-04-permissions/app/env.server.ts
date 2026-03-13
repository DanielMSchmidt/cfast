import { defineEnv } from "@cfast/env";

export const env = defineEnv({
  DB: { type: "d1" },
  APP_URL: { type: "var", default: "http://localhost:5173" },
});

export type Env = ReturnType<typeof env.get>;
