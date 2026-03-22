import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { createAdminComponent, introspectSchema } from "@cfast/admin";
import { adminLoader, adminAction } from "~/admin.server";
import * as schema from "~/db/schema";

const tableMetas = introspectSchema(schema);
const AdminComponent = createAdminComponent(tableMetas);

export async function loader(args: LoaderFunctionArgs) {
  return adminLoader(args.request);
}

export async function action(args: ActionFunctionArgs) {
  return adminAction(args.request);
}

export default AdminComponent;
