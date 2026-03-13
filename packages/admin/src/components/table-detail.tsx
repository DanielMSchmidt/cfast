import { type ReactElement } from "react";
import { Link, useSubmit } from "react-router";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import Stack from "@mui/joy/Stack";
import { useConfirm } from "@cfast/ui";
import { buildAdminUrl } from "../utils.js";
import type { AdminColumnConfig } from "../types.js";

type TableDetailProps = {
  tableName: string;
  tableLabel: string;
  item: Record<string, unknown>;
  columns: AdminColumnConfig[];
  primaryKey: string;
};

export function TableDetail({
  tableName,
  tableLabel,
  item,
  columns,
  primaryKey,
}: TableDetailProps): ReactElement {
  const submit = useSubmit();
  const confirm = useConfirm();
  const id = String(item[primaryKey] ?? "");

  async function handleDelete(): Promise<void> {
    const confirmed = await confirm({
      title: "Delete record",
      description: `Are you sure you want to delete this ${tableLabel} record?`,
      variant: "danger",
      confirmLabel: "Delete",
    });

    if (!confirmed) return;

    const formData = new FormData();
    formData.set("_action", "delete");
    formData.set("_table", tableName);
    formData.set("_id", id);
    submit(formData, { method: "post" });
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography
          component={Link}
          to={buildAdminUrl({
            kind: "list",
            table: tableName,
            page: 1,
            sort: null,
            direction: "desc",
            search: "",
          })}
          level="body-sm"
        >
          {tableLabel}
        </Typography>
        <Typography level="body-sm">/</Typography>
        <Typography level="body-sm">{id}</Typography>
      </Stack>

      {/* Title + actions */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography level="h2">
          {tableLabel} Detail
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to={buildAdminUrl({ kind: "edit", table: tableName, id })}
            variant="outlined"
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="danger"
            onClick={() => { void handleDelete(); }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* Field grid */}
      <Card variant="outlined">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {columns.map((col) => (
            <Box key={col.name}>
              <Typography level="body-xs" textColor="text.secondary" fontWeight="lg">
                {col.label}
              </Typography>
              <Typography level="body-md">
                {formatFieldValue(item[col.name])}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
}
