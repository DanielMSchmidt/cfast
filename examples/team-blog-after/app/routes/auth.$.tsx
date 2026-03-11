import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const e = context.cloudflare.env;
  const auth = initAuth({ d1: e.DB, appUrl: e.APP_URL });
  return auth.handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const e = context.cloudflare.env;
  const auth = initAuth({ d1: e.DB, appUrl: e.APP_URL });
  return auth.handler(request);
}
