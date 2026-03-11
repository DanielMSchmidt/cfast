import type { LoaderFunctionArgs } from "react-router";
import { storage } from "~/storage.server";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const key = params["*"];

  if (!key) {
    throw new Response("Not Found", { status: 404 });
  }

  // Determine the storage type from the key prefix
  const storageName = key.startsWith("avatars/") ? "avatars" : "postCovers";

  return storage.serve(storageName, key, {
    env: env as unknown as Record<string, unknown>,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
