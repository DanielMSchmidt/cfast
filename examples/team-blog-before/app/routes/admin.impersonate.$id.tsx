import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import type { Env } from "~/env";
import { requireUser, hasRole } from "~/auth.helpers.server";
import { createAuth } from "~/auth.server";
import { createDbClient } from "~/db/client";
import { impersonationLogs } from "~/db/schema";
import { nanoid } from "nanoid";

export async function action({ request, context, params }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const targetUserId = params.id!;
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session) {
    throw redirect("/login");
  }

  await env.CACHE.put(
    `impersonation:${session.session.id}`,
    targetUserId,
    { expirationTtl: 3600 }
  );

  const db = createDbClient(env.DB);
  await db.insert(impersonationLogs).values({
    id: nanoid(),
    adminId: user.id,
    targetUserId: targetUserId,
  });

  throw redirect("/");
}
