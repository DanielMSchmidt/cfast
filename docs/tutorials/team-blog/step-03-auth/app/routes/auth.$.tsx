import { createAuthRouteHandlers } from "@cfast/auth";
import { getAuth } from "../auth.server";

const { loader, action } = createAuthRouteHandlers(() => getAuth());

export { loader, action };
