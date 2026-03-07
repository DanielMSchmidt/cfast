import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireUser, hasRole } from "~/auth.helpers.server";
import { createAuth } from "~/auth.server";
import { createCfDb } from "~/db/cfast.server";
import { impersonationLogs } from "~/db/schema";
import { nanoid } from "nanoid";

export async function action({ request, context, params }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
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

  const cfDb = createCfDb(env.DB, user);
  await cfDb.unsafe().insert(impersonationLogs).values({
    id: nanoid(),
    adminId: user.id,
    targetUserId: targetUserId,
  }).run({});

  throw redirect("/");
}
