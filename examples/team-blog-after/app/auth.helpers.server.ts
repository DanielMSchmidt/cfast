import { createAuthHelpers } from "@cfast/auth/helpers";
import { initAuth } from "./auth.setup.server";
import { env } from "./env";

export type { UserRole } from "./permissions";
export type { AuthUser } from "./permissions";

function getAuth() {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
}

export const { getAuthContext, requireAuthContext, getUser, requireUser } =
  createAuthHelpers({ getAuth });
