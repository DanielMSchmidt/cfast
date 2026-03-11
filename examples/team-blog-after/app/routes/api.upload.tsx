import type { ActionFunctionArgs } from "react-router";
import { requireUser } from "~/auth.helpers.server";
import { storage } from "~/storage.server";
import { StorageError } from "@cfast/storage";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await requireUser(request);

  // Clone request so storage.handle can read the original body
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const type = formData.get("type") as string;

  if (!type || !["cover", "avatar"].includes(type)) {
    return Response.json(
      { error: "Invalid upload type. Must be 'cover' or 'avatar'." },
      { status: 400 }
    );
  }

  const storageName = type === "cover" ? "postCovers" : "avatars";

  try {
    const result = await storage.handle(storageName, request, {
      env: env as unknown as Record<string, unknown>,
      user: { id: user.id },
      input:
        type === "cover"
          ? { postId: (formData.get("postId") as string) ?? "unknown" }
          : {},
    });

    return Response.json({ key: result.key, url: `/api/file/${result.key}` });
  } catch (e) {
    if (e instanceof StorageError) {
      return Response.json({ error: e.detail }, { status: e.status });
    }
    throw e;
  }
}
