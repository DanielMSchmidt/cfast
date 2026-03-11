import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { getAuthContext } from "~/auth.helpers.server";
import { initAuth } from "~/auth.setup.server";
import { createCfDb } from "~/db/cfast.server";
import { impersonationLogs } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function action({ request, context }: ActionFunctionArgs) {
  const e = context.cloudflare.env;
  const ctx = await getAuthContext(request);

  if (!ctx.user) {
    throw redirect("/login");
  }

  if (!ctx.user.isImpersonating || !ctx.user.realUser) {
    throw redirect("/");
  }

  const auth = initAuth({ d1: e.DB, appUrl: e.APP_URL });
  const betterAuth = auth.api as { api: { getSession: (opts: { headers: Headers }) => Promise<{ session: { id: string } } | null> } };
  const session = await betterAuth.api.getSession({ headers: request.headers });

  if (!session?.session) {
    throw redirect("/login");
  }

  await e.CACHE.delete(`impersonation:${session.session.id}`);

  const cfDb = createCfDb(e.DB, ctx);
  await cfDb.unsafe().update(impersonationLogs).set({ endedAt: new Date() }).where(
    and(
      eq(impersonationLogs.adminId, ctx.user.realUser.id),
      eq(impersonationLogs.targetUserId, ctx.user.id),
      isNull(impersonationLogs.endedAt)
    )
  ).run({});

  throw redirect("/admin");
}
