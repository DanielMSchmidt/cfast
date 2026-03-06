import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { createAuth } from "~/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const auth = createAuth(env);
  return auth.handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const auth = createAuth(env);
  return auth.handler(request);
}
