import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import { initAuth } from "~/auth.setup.server";
import { createCfDb } from "~/db/cfast.server";
import { impersonationLogs } from "~/db/schema";
import { nanoid } from "nanoid";

export async function action({ request, context, params }: ActionFunctionArgs) {
  const e = context.cloudflare.env;
  const ctx = await requireAuthContext(request);

  if (!hasRole(ctx.user, "admin")) {
    throw redirect("/");
  }

  const targetUserId = params.id!;
  const auth = initAuth({ d1: e.DB, appUrl: e.APP_URL });
  const betterAuth = auth.api as { api: { getSession: (opts: { headers: Headers }) => Promise<{ session: { id: string } } | null> } };
  const session = await betterAuth.api.getSession({ headers: request.headers });

  if (!session?.session) {
    throw redirect("/login");
  }

  await e.CACHE.put(
    `impersonation:${session.session.id}`,
    targetUserId,
    { expirationTtl: 3600 }
  );

  const cfDb = createCfDb(e.DB, ctx);
  await cfDb.unsafe().insert(impersonationLogs).values({
    id: nanoid(),
    adminId: ctx.user.id,
    targetUserId: targetUserId,
  }).run({});

  throw redirect("/");
}
