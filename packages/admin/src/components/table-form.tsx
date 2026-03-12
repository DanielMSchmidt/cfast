import { type ReactElement } from "react";
import { Link, useSubmit } from "react-router";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { AutoForm } from "@cfast/forms/joy";
import { buildAdminUrl } from "../utils.js";
import type { AdminActionResult, AdminColumnConfig } from "../types.js";

type TableFormProps = {
  tableName: string;
  tableLabel: string;
  mode: "create" | "edit";
  drizzleTable: SQLiteTable;
  item?: Record<string, unknown>;
  columns: AdminColumnConfig[];
  primaryKey: string;
  actionResult: AdminActionResult | undefined;
};

/**
 * Timestamp-like column names that are auto-managed and should be excluded from forms.
 */
const AUTO_TIMESTAMP_NAMES = new Set([
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
]);

export function TableForm({
  tableName,
  tableLabel,
  mode,
  drizzleTable,
  item,
  columns,
  primaryKey,
  actionResult,
}: TableFormProps): ReactElement {
  const submit = useSubmit();
  const id = item ? String(item[primaryKey] ?? "") : undefined;

  // Exclude PK and auto-timestamp columns
  const excludeFields = columns
    .filter((c) => c.isPrimaryKey || AUTO_TIMESTAMP_NAMES.has(c.name))
    .map((c) => c.name);

  function handleSubmit(values: Record<string, unknown>): void {
    const formData = new FormData();
    formData.set("_action", mode === "create" ? "create" : "update");
    formData.set("_table", tableName);
    if (id) {
      formData.set("_id", id);
    }

    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined) {
        formData.set(key, String(value));
      }
    }

    submit(formData, { method: "post" });
  }

  // Breadcrumb path
  const listUrl = buildAdminUrl({
    kind: "list",
    table: tableName,
    page: 1,
    sort: null,
    direction: "desc",
    search: "",
  });

  return (
    <Box>
      {/* Breadcrumb */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography component={Link} to={listUrl} level="body-sm">
          {tableLabel}
        </Typography>
        <Typography level="body-sm">/</Typography>
        {mode === "edit" && id ? (
          <>
            <Typography
              component={Link}
              to={buildAdminUrl({ kind: "detail", table: tableName, id })}
              level="body-sm"
            >
              {id}
            </Typography>
            <Typography level="body-sm">/</Typography>
            <Typography level="body-sm">Edit</Typography>
          </>
        ) : (
          <Typography level="body-sm">Create</Typography>
        )}
      </Stack>

      <Typography level="h2" sx={{ mb: 3 }}>
        {mode === "create" ? `Create ${tableLabel}` : `Edit ${tableLabel}`}
      </Typography>

      <ActionResultDisplay result={actionResult} />

      <AutoForm
        table={drizzleTable}
        mode={mode}
        data={item}
        onSubmit={handleSubmit}
        exclude={excludeFields}
      />
    </Box>
  );
}

function ActionResultDisplay({ result }: { result: AdminActionResult | undefined }): ReactElement | null {
  if (!result) return null;

  if ("success" in result) {
    return (
      <Chip color="success" variant="soft" sx={{ mb: 2 }}>
        {result.success}
      </Chip>
    );
  }

  if ("error" in result) {
    return (
      <Chip color="danger" variant="soft" sx={{ mb: 2 }}>
        {result.error}
      </Chip>
    );
  }

  if ("fieldErrors" in result) {
    return (
      <Box sx={{ mb: 2 }}>
        {Object.entries(result.fieldErrors).map(([field, error]) => (
          <Chip key={field} color="danger" variant="soft" sx={{ mr: 1, mb: 1 }}>
            {field}: {error}
          </Chip>
        ))}
      </Box>
    );
  }

  return null;
}
