import type { LoaderFunctionArgs } from "react-router";
import { env } from "~/env";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const key = params["*"];
  if (!key) throw new Response("Not Found", { status: 404 });

  const e = env.get();
  const object = await e.UPLOADS.get(key);
  if (!object) throw new Response("Not Found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
