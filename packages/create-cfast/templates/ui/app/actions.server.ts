import { createActions } from "@cfast/actions";
import { app } from "~/cfast.server";

export const { createAction, composeActions } = createActions({
  getContext: async ({ request }) => {
    const ctx = await app.context(request);
    if (!ctx.auth.user) {
      throw new Response(null, { status: 302, headers: { Location: "/login" } });
    }
    return { db: ctx.db.client, user: ctx.auth.user, grants: ctx.auth.grants };
  },
});
