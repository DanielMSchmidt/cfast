import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { initAuth } from "~/auth.setup.server";
import { env } from "~/env";

function getAuthHandler() {
  const e = env.get();
  return initAuth({ d1: e.DB, appUrl: e.APP_URL });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = getAuthHandler();
  return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  const auth = getAuthHandler();
  return auth.handler(request);
}
