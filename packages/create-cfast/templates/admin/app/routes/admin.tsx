import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { AdminPanel } from "@cfast/admin/client";
import { joyAdminComponents } from "@cfast/joy";
import { adminLoader, adminAction } from "~/admin.server";

export async function loader(args: LoaderFunctionArgs) {
  return adminLoader(args.request);
}

export async function action(args: ActionFunctionArgs) {
  return adminAction(args.request);
}

export default function Admin() {
  const data = useLoaderData<typeof loader>();
  return <AdminPanel data={data} components={joyAdminComponents} />;
}
