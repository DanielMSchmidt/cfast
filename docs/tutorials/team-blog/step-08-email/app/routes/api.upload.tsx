import type { ActionFunctionArgs } from "react-router";
import { requireAuthContext } from "~/auth.helpers.server";
import { storage } from "~/storage.server";
import { env } from "~/env";

export async function action({ request }: ActionFunctionArgs) {
  const ctx = await requireAuthContext(request);
  const e = env.get();

  const result = await storage.handle("postCoverImage", request, {
    env: e,
    user: ctx.user,
    input: { postId: new URL(request.url).searchParams.get("postId") ?? "" },
  });

  return Response.json({ key: result.key, url: `/api/file/${result.key}` });
}
