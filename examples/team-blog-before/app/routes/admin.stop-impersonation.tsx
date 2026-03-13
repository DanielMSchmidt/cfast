import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import type { Env } from "~/env";
import { getUser } from "~/auth.helpers.server";
import { createAuth } from "~/auth.server";
import { createDbClient } from "~/db/client";
import { impersonationLogs } from "~/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
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

  const db = createDbClient(env.DB);
  await db
    .update(impersonationLogs)
    .set({ endedAt: new Date() })
    .where(
      and(
        eq(impersonationLogs.adminId, user.realUser.id),
        eq(impersonationLogs.targetUserId, user.id),
        isNull(impersonationLogs.endedAt)
      )
    );

  throw redirect("/admin");
}
