import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { LoginPage } from "@cfast/auth/client";
import { authClient } from "../auth.client";
import { getAuthContext } from "../auth.server";
import { env } from "../env.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  env.init((context as Record<string, unknown>).cloudflare as Record<string, unknown>);
  const ctx = await getAuthContext(request);
  if (ctx.user) throw redirect("/");
  return {};
}

export default function Login() {
  useLoaderData<typeof loader>();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "24rem", margin: "4rem auto" }}>
      <LoginPage
        authClient={authClient}
        title="Sign In"
        subtitle="Sign in to Team Blog"
      />
    </main>
  );
}
