import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { getUser } from "~/auth.helpers.server";
import { createAuth } from "~/auth.server";
import { createCfDb } from "~/db/cfast.server";
import { impersonationLogs } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(request, env);

  if (!user) {
    throw redirect("/login");
  }

  if (!user.isImpersonating || !user.realUser) {
    throw redirect("/");
  }

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session) {
    throw redirect("/login");
  }

  await env.CACHE.delete(`impersonation:${session.session.id}`);

  const cfDb = createCfDb(env.DB, user);
  await cfDb.unsafe().update(impersonationLogs).set({ endedAt: new Date() }).where(
    and(
      eq(impersonationLogs.adminId, user.realUser.id),
      eq(impersonationLogs.targetUserId, user.id),
      isNull(impersonationLogs.endedAt)
    )
  ).run({});

  throw redirect("/admin");
}
