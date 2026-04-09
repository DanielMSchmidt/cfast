import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { adminLoader, adminAction } from "~/admin.server";
import { createAdminComponent, introspectSchema } from "@cfast/admin";
import * as schema from "~/db/schema";

// Client-safe: Component built from schema introspection only
const tableMetas = await introspectSchema({
  users: schema.users,
  posts: schema.posts,
  roles: schema.roles,
});

const AdminComponent = createAdminComponent(tableMetas);

export async function loader({ request }: LoaderFunctionArgs) {
  return adminLoader(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return adminAction(request);
}

export default AdminComponent;
