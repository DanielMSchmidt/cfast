import { createAuthRouteHandlers } from "@cfast/auth";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";

const { loader, action } = createAuthRouteHandlers(() => {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
});

export { loader, action };
