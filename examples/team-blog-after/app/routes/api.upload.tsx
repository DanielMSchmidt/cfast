import type { ActionFunctionArgs } from "react-router";
import { requireUser } from "~/auth.helpers.server";
import { nanoid } from "nanoid";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await requireUser(request);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  if (!type || !["cover", "avatar"].includes(type)) {
    return Response.json({ error: "Invalid upload type. Must be 'cover' or 'avatar'." }, { status: 400 });
  }

  // Validate MIME type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, and WebP images are allowed." },
      { status: 400 }
    );
  }

  // Validate size based on type
  const maxSize = type === "cover" ? 10 * 1024 * 1024 : 2 * 1024 * 1024;
  const maxLabel = type === "cover" ? "10MB" : "2MB";
  if (file.size > maxSize) {
    return Response.json(
      { error: `File size must be under ${maxLabel}.` },
      { status: 400 }
    );
  }

  // Generate R2 key based on type
  let key: string;
  if (type === "cover") {
    key = `covers/${user.id}/${nanoid()}-${file.name}`;
  } else {
    key = `avatars/${user.id}/${nanoid()}-${file.name}`;
  }

  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ key, url: `/api/file/${key}` });
}
