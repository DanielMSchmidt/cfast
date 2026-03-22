import { redirect, useLoaderData } from "react-router";
import { LoginPage } from "@cfast/auth/client";
import { joyLoginComponents } from "@cfast/joy";
import { app } from "~/cfast.server";
import { authClient } from "~/auth.client";

export const loader = app.loader(async (ctx) => {
  if (ctx.auth.user) throw redirect("/");
  return {};
});

export default function Login() {
  useLoaderData<typeof loader>();

  return (
    <LoginPage
      authClient={authClient}
      components={joyLoginComponents}
      title="Sign In"
      subtitle="Sign in to Team Blog"
    />
  );
}
