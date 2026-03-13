import { defineEnv } from "@cfast/env";

export const env = defineEnv({
  DB: { type: "d1" },
});

export type Env = ReturnType<typeof env.get>;
