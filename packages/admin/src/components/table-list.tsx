import { type ReactElement, useState } from "react";
import { Link, useSubmit } from "react-router";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import { useConfirm } from "@cfast/ui";
import { buildAdminUrl } from "../utils.js";
import type { AdminActionResult, AdminColumnConfig } from "../types.js";

type TableListProps = {
  tableName: string;
  tableLabel: string;
  items: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
  columns: AdminColumnConfig[];
  searchable: string[];
  sort: { column: string; direction: string };
  search: string;
  primaryKey: string;
  actionResult: AdminActionResult | undefined;
};

export function TableList({
  tableName,
  tableLabel,
  items,
  total,
  page,
  totalPages,
  columns,
  searchable,
  sort,
  search,
  primaryKey,
  actionResult,
}: TableListProps): ReactElement {
  const submit = useSubmit();
  const confirm = useConfirm();
  const [searchValue, setSearchValue] = useState(search);

  const listColumns = columns.filter((c) => !c.isPrimaryKey);

  function sortUrl(columnName: string): string {
    const isSameColumn = sort.column === columnName;
    const newDirection = isSameColumn && sort.direction === "asc" ? "desc" : "asc";
    return buildAdminUrl({
      kind: "list",
      table: tableName,
      page: 1,
      sort: columnName,
      direction: newDirection,
      search,
    });
  }

  function handleSearchSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const url = buildAdminUrl({
      kind: "list",
      table: tableName,
      page: 1,
      sort: sort.column,
      direction: sort.direction as "asc" | "desc",
      search: searchValue,
    });
    window.location.search = url.startsWith("?") ? url : "";
  }

  async function handleDelete(id: string): Promise<void> {
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography level="h2">{tableLabel}</Typography>
        <Button
          component={Link}
          to={buildAdminUrl({ kind: "create", table: tableName })}
        >
          Create
        </Button>
      </Box>

      <ActionResultDisplay result={actionResult} />

      {searchable.length > 0 && (
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
          <Input
            placeholder={`Search ${tableLabel.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            endDecorator={
              <Button type="submit" variant="soft" size="sm">
                Search
              </Button>
            }
          />
        </Box>
      )}

      <Sheet variant="outlined" sx={{ borderRadius: "sm", overflow: "auto" }}>
        <Table hoverRow>
          <thead>
            <tr>
              {listColumns.map((col) => (
                <th key={col.name}>
                  <Typography
                    component={Link}
                    to={sortUrl(col.name)}
                    level="body-sm"
                    fontWeight="lg"
                    sx={{ textDecoration: "none", color: "inherit" }}
                  >
                    {col.label}
                    {sort.column === col.name
                      ? sort.direction === "asc"
                        ? " \u2191"
                        : " \u2193"
                      : ""}
                  </Typography>
                </th>
              ))}
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const id = String(item[primaryKey] ?? "");
              return (
                <tr key={id}>
                  {listColumns.map((col) => (
                    <td key={col.name}>{formatCellValue(item[col.name])}</td>
                  ))}
                  <td>
                    <Stack direction="row" spacing={1}>
                      <Button
                        component={Link}
                        to={buildAdminUrl({ kind: "detail", table: tableName, id })}
                        size="sm"
                        variant="plain"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="plain"
                        color="danger"
                        onClick={() => { void handleDelete(id); }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={listColumns.length + 1}>
                  <Typography level="body-sm" textAlign="center" sx={{ py: 2 }}>
                    No records found.
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Sheet>

      {totalPages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
          {page > 1 && (
            <Button
              component={Link}
              to={buildAdminUrl({
                kind: "list",
                table: tableName,
                page: page - 1,
                sort: sort.column,
                direction: sort.direction as "asc" | "desc",
                search,
              })}
              size="sm"
              variant="outlined"
            >
              Previous
            </Button>
          )}
          <Typography level="body-sm">
            Page {page} of {totalPages} ({total} total)
          </Typography>
          {page < totalPages && (
            <Button
              component={Link}
              to={buildAdminUrl({
                kind: "list",
                table: tableName,
                page: page + 1,
                sort: sort.column,
                direction: sort.direction as "asc" | "desc",
                search,
              })}
              size="sm"
              variant="outlined"
            >
              Next
            </Button>
          )}
        </Stack>
      )}
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

  return null;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
