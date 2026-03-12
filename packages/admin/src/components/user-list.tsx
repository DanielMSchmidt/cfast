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
import { RoleBadge } from "@cfast/ui/joy";
import { buildAdminUrl } from "../utils.js";
import type { AdminActionResult, AdminUser } from "../types.js";

type UserListProps = {
  items: Array<AdminUser & { createdAt?: string }>;
  total: number;
  page: number;
  totalPages: number;
  search: string;
  currentUser: AdminUser;
  actionResult: AdminActionResult | undefined;
};

export function UserList({
  items,
  total,
  page,
  totalPages,
  search,
  currentUser,
  actionResult,
}: UserListProps): ReactElement {
  const submit = useSubmit();
  const [searchValue, setSearchValue] = useState(search);

  function handleSearchSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const url = buildAdminUrl({
      kind: "user-list",
      page: 1,
      search: searchValue,
    });
    window.location.search = url.startsWith("?") ? url : "";
  }

  function handleImpersonate(userId: string): void {
    const formData = new FormData();
    formData.set("_action", "impersonate");
    formData.set("_id", userId);
    submit(formData, { method: "post" });
  }

  return (
    <Box>
      <Typography level="h2" sx={{ mb: 2 }}>
        Users
      </Typography>

      <ActionResultDisplay result={actionResult} />

      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
        <Input
          placeholder="Search users..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          endDecorator={
            <Button type="submit" variant="soft" size="sm">
              Search
            </Button>
          }
        />
      </Box>

      <Sheet variant="outlined" sx={{ borderRadius: "sm", overflow: "auto" }}>
        <Table hoverRow>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Joined</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {user.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                    {user.roles.length === 0 && (
                      <Typography level="body-xs" textColor="text.tertiary">
                        No roles
                      </Typography>
                    )}
                  </Stack>
                </td>
                <td>{user.createdAt ?? "-"}</td>
                <td>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      to={buildAdminUrl({ kind: "user-detail", id: user.id })}
                      size="sm"
                      variant="plain"
                    >
                      View
                    </Button>
                    {user.id !== currentUser.id && (
                      <Button
                        size="sm"
                        variant="plain"
                        color="warning"
                        onClick={() => handleImpersonate(user.id)}
                      >
                        Impersonate
                      </Button>
                    )}
                  </Stack>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <Typography level="body-sm" textAlign="center" sx={{ py: 2 }}>
                    No users found.
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
                kind: "user-list",
                page: page - 1,
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
                kind: "user-list",
                page: page + 1,
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
