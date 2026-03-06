import type { LoaderFunctionArgs } from "react-router";
import type { Env } from "~/env";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const key = params["*"];

  if (!key) {
    throw new Response("Not Found", { status: 404 });
  }

  const object = await env.UPLOADS.get(key);

  if (!object) {
    throw new Response("Not Found", { status: 404 });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType ?? "application/octet-stream"
  );
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  return new Response(object.body as ReadableStream, {
    status: 200,
    headers,
  });
}
