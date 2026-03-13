import { createActions } from "@cfast/actions";
import { requireAuthContext } from "~/auth.helpers.server";
import { createCfDb } from "~/db/cfast.server";
import { env } from "~/env";

export const { createAction, composeActions } = createActions({
  getContext: async ({ request }) => {
    const ctx = await requireAuthContext(request);
    const e = env.get();
    const db = createCfDb(e.DB, ctx);
    return { db, user: ctx.user, grants: ctx.grants };
  },
});
