import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, Form, redirect } from "react-router";
import Input from "@mui/joy/Input";
import Table from "@mui/joy/Table";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import type { Env } from "~/env";
import { requireUser, hasRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { users, roles } from "~/db/schema";
import { eq, like, or, count, desc, asc, sql } from "drizzle-orm";
import { RoleChip } from "~/components/RoleChip";
import { Pagination } from "~/components/Pagination";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const search = url.searchParams.get("search") ?? "";
  const sortColumn = url.searchParams.get("sort") ?? "createdAt";
  const sortOrder = url.searchParams.get("order") ?? "desc";
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    : undefined;

  const sortableColumns = {
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
  } as const;

  const column = sortableColumns[sortColumn as keyof typeof sortableColumns] ?? users.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const userList = await db
    .select()
    .from(users)
    .where(searchCondition)
    .orderBy(orderFn(column))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ total: count() })
    .from(users)
    .where(searchCondition)
    .get();
  const total = totalResult?.total ?? 0;

  const usersWithRoles = await Promise.all(
    userList.map(async (u) => {
      const userRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.userId, u.id));
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        roles: userRoles.map((r) => r.role),
        createdAt: u.createdAt,
      };
    })
  );

  return { users: usersWithRoles, total, page, limit, search, sort: sortColumn, order: sortOrder };
}

function SortHeader({
  column,
  label,
  currentSort,
  currentOrder,
  baseUrl,
}: {
  column: string;
  label: string;
  currentSort: string;
  currentOrder: string;
  baseUrl: string;
}) {
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";
  const url = new URL(baseUrl, "http://localhost");
  url.searchParams.set("sort", column);
  url.searchParams.set("order", nextOrder);
  const href = `${url.pathname}?${url.searchParams.toString()}`;

  return (
    <th>
      <Link to={href} style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
        {label} {isActive ? (currentOrder === "asc" ? "\u2191" : "\u2193") : ""}
      </Link>
    </th>
  );
}

export default function AdminUsers() {
  const { users: userList, total, page, limit, search, sort, order } = useLoaderData<typeof loader>();
  const totalPages = Math.ceil(total / limit);

  const filterUrl = search
    ? `/admin/users?search=${encodeURIComponent(search)}`
    : "/admin/users";

  return (
    <Stack spacing={3}>
      <Typography level="h2">Users</Typography>

      <Form method="get" action="/admin/users">
        <Stack direction="row" spacing={1} alignItems="center">
          <Input
            name="search"
            placeholder="Search by name or email..."
            defaultValue={search}
            sx={{ maxWidth: 400, flex: 1 }}
          />
          <Button type="submit" variant="outlined">
            Search
          </Button>
          {search && (
            <Button
              component={Link}
              to="/admin/users"
              variant="plain"
              color="neutral"
            >
              Clear
            </Button>
          )}
        </Stack>
      </Form>

      <Typography level="body-sm" sx={{ color: "neutral.500" }}>
        {total} user{total !== 1 ? "s" : ""} found
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Table hoverRow>
          <thead>
            <tr>
              <SortHeader column="name" label="Name" currentSort={sort} currentOrder={order} baseUrl={filterUrl} />
              <SortHeader column="email" label="Email" currentSort={sort} currentOrder={order} baseUrl={filterUrl} />
              <th>Roles</th>
              <SortHeader column="createdAt" label="Joined" currentSort={sort} currentOrder={order} baseUrl={filterUrl} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {u.roles.map((role) => (
                      <RoleChip key={role} role={role} />
                    ))}
                    {u.roles.length === 0 && <RoleChip role="reader" />}
                  </Stack>
                </td>
                <td>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      to={`/admin/users/${u.id}`}
                      size="sm"
                      variant="outlined"
                    >
                      View
                    </Button>
                    <Form method="post" action={`/admin/impersonate/${u.id}`}>
                      <Button
                        type="submit"
                        size="sm"
                        variant="soft"
                        color="warning"
                      >
                        Impersonate
                      </Button>
                    </Form>
                  </Stack>
                </td>
              </tr>
            ))}
            {userList.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <Typography
                    level="body-sm"
                    sx={{ textAlign: "center", py: 2, color: "neutral.500" }}
                  >
                    No users found
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Box>

      <Pagination currentPage={page} totalPages={totalPages} baseUrl={filterUrl} />
    </Stack>
  );
}
