import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { adminLoader, adminAction } from "~/admin.server";
import { createAdminComponent, introspectSchema } from "@cfast/admin";
import * as schema from "~/db/schema";

// ---------------------------------------------------------------------------
// Client-safe: Component built from schema introspection only (no server deps)
// ---------------------------------------------------------------------------

const tableMetas = await introspectSchema({
  users: schema.users,
  posts: schema.posts,
  comments: schema.comments,
  roles: schema.roles,
  auditLogs: schema.auditLogs,
});

const AdminComponent = createAdminComponent(tableMetas);

// ---------------------------------------------------------------------------
// Route exports
// ---------------------------------------------------------------------------

export async function loader({ request }: LoaderFunctionArgs) {
  return adminLoader(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return adminAction(request);
}

export default AdminComponent;
