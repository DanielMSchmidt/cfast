import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { LoginPage } from "@cfast/auth/client";
import { joyLoginComponents } from "@cfast/joy";
import { getUser } from "~/auth.helpers.server";
import { authClient } from "~/auth.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return {};
}

export default function Login() {
  useLoaderData<typeof loader>();

  return (
    <LoginPage
      authClient={authClient}
      components={joyLoginComponents}
      title="Sign In"
      subtitle="Sign in to {{projectName}}"
    />
  );
}
