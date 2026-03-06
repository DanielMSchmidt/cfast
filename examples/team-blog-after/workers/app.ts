import { createRequestHandler } from "react-router";
import { env } from "../app/env";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

type Env = ReturnType<typeof env.get>;

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, rawEnv: Record<string, unknown>, ctx: ExecutionContext) {
    env.init(rawEnv);
    return requestHandler(request, {
      cloudflare: { env: env.get(), ctx },
    });
  },
};
