import { type ReactElement } from "react";
import { useLoaderData, useActionData, useSubmit } from "react-router";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import { ConfirmProvider } from "@cfast/ui";
import type { AdminActionResult, AdminLoaderData, AdminTableMeta } from "../types.js";
import { Sidebar } from "./sidebar.js";
import { Dashboard } from "./dashboard.js";
import { TableList } from "./table-list.js";
import { TableDetail } from "./table-detail.js";
import { TableForm } from "./table-form.js";
import { UserList } from "./user-list.js";
import { UserDetail } from "./user-detail.js";

/**
 * Create the root admin React component.
 *
 * Takes table metadata (from introspection) so it can pass drizzle table
 * references to forms and find primary key information.
 */
export function createAdminComponent(
  tableMetas: AdminTableMeta[],
): () => ReactElement {
  const tableMetaMap = new Map(tableMetas.map((m) => [m.name, m]));

  function AdminRoot(): ReactElement {
    const data = useLoaderData<AdminLoaderData>();
    const actionData = useActionData<AdminActionResult | undefined>();

    return (
      <ConfirmProvider>
        {data.user.isImpersonating && (
          <ImpersonationBar user={data.user} />
        )}
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar tables={data.tables} />
          <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
            <AdminContent
              data={data}
              actionResult={actionData}
              tableMetaMap={tableMetaMap}
            />
          </Box>
        </Box>
      </ConfirmProvider>
    );
  }

  return AdminRoot;
}

type AdminContentProps = {
  data: AdminLoaderData;
  actionResult: AdminActionResult | undefined;
  tableMetaMap: Map<string, AdminTableMeta>;
};

function AdminContent({ data, actionResult, tableMetaMap }: AdminContentProps): ReactElement {
  switch (data.view) {
    case "dashboard":
      return <Dashboard stats={data.stats} recentItems={data.recentItems} />;

    case "list": {
      const meta = tableMetaMap.get(data.tableName);
      const primaryKey = meta?.primaryKey ?? "id";
      return (
        <TableList
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          items={data.items}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          columns={data.columns}
          searchable={data.searchable}
          sort={data.sort}
          search={data.search}
          primaryKey={primaryKey}
          actionResult={actionResult}
        />
      );
    }

    case "detail": {
      const meta = tableMetaMap.get(data.tableName);
      const primaryKey = meta?.primaryKey ?? "id";
      return (
        <TableDetail
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          item={data.item}
          columns={data.columns}
          primaryKey={primaryKey}
        />
      );
    }

    case "create": {
      const meta = tableMetaMap.get(data.tableName);
      if (!meta) {
        return (
          <Box sx={{ p: 4 }}>
            <Typography color="danger">Table &ldquo;{data.tableName}&rdquo; not found in schema.</Typography>
          </Box>
        );
      }
      return (
        <TableForm
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          mode="create"
          drizzleTable={meta.drizzleTable}
          columns={data.columns}
          primaryKey={meta.primaryKey}
          actionResult={actionResult}
        />
      );
    }

    case "edit": {
      const meta = tableMetaMap.get(data.tableName);
      if (!meta) {
        return (
          <Box sx={{ p: 4 }}>
            <Typography color="danger">Table &ldquo;{data.tableName}&rdquo; not found in schema.</Typography>
          </Box>
        );
      }
      return (
        <TableForm
          tableName={data.tableName}
          tableLabel={data.tableLabel}
          mode="edit"
          drizzleTable={meta.drizzleTable}
          item={data.item}
          columns={data.columns}
          primaryKey={meta.primaryKey}
          actionResult={actionResult}
        />
      );
    }

    case "users":
      return (
        <UserList
          items={data.items}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          search={data.search}
          currentUser={data.user}
          actionResult={actionResult}
        />
      );

    case "user-detail":
      return (
        <UserDetail
          targetUser={data.targetUser}
          assignableRoles={data.assignableRoles}
          currentUser={data.user}
          actionResult={actionResult}
        />
      );

    case "error":
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography level="h3" color="danger">
            Error
          </Typography>
          <Typography level="body-md" sx={{ mt: 1 }}>
            {data.message}
          </Typography>
        </Box>
      );
  }
}

/**
 * Simple impersonation banner for when the admin is viewing as another user.
 */
function ImpersonationBar({ user }: { user: AdminLoaderData["user"] }): ReactElement {
  const submit = useSubmit();

  function handleStopImpersonation(): void {
    const formData = new FormData();
    formData.set("_action", "stopImpersonation");
    submit(formData, { method: "post" });
  }

  return (
    <Box
      sx={{
        bgcolor: "warning.softBg",
        color: "warning.softColor",
        py: 1,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Typography level="body-sm" fontWeight="lg">
        Impersonating {user.name} ({user.email})
        {user.realUser && ` — logged in as ${user.realUser.name}`}
      </Typography>
      <Button
        size="sm"
        variant="solid"
        color="warning"
        onClick={handleStopImpersonation}
      >
        Stop Impersonation
      </Button>
    </Box>
  );
}
