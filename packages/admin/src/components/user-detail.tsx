import { type ReactElement, useState } from "react";
import { Link, useSubmit } from "react-router";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Divider from "@mui/joy/Divider";
import { RoleBadge, AvatarWithInitials } from "@cfast/joy";
import { buildAdminUrl } from "../utils.js";
import { ActionResultDisplay } from "./action-result.js";
import type { AdminActionResult, AdminUser } from "../types.js";

type UserDetailProps = {
  targetUser: AdminUser & { createdAt?: string };
  assignableRoles: string[];
  currentUser: AdminUser;
  actionResult: AdminActionResult | undefined;
};

export function UserDetail({
  targetUser,
  assignableRoles,
  currentUser,
  actionResult,
}: UserDetailProps): ReactElement {
  const submit = useSubmit();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const availableRoles = assignableRoles.filter(
    (role) => !targetUser.roles.includes(role),
  );

  function handleAddRole(): void {
    if (!selectedRole) return;

    const formData = new FormData();
    formData.set("_action", "setRole");
    formData.set("_id", targetUser.id);
    formData.set("role", selectedRole);
    submit(formData, { method: "post" });
    setSelectedRole(null);
  }

  function handleRemoveRole(role: string): void {
    const formData = new FormData();
    formData.set("_action", "removeRole");
    formData.set("_id", targetUser.id);
    formData.set("role", role);
    submit(formData, { method: "post" });
  }

  function handleImpersonate(): void {
    const formData = new FormData();
    formData.set("_action", "impersonate");
    formData.set("_id", targetUser.id);
    submit(formData, { method: "post" });
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography
          component={Link}
          to={buildAdminUrl({ kind: "user-list", page: 1, search: "" })}
          level="body-sm"
        >
          Users
        </Typography>
        <Typography level="body-sm">/</Typography>
        <Typography level="body-sm">{targetUser.name}</Typography>
      </Stack>

      <ActionResultDisplay result={actionResult} />

      {/* Profile card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <AvatarWithInitials
            src={targetUser.avatarUrl}
            name={targetUser.name}
            size="lg"
          />
          <Box>
            <Typography level="h3">{targetUser.name}</Typography>
            <Typography level="body-md" textColor="text.secondary">
              {targetUser.email}
            </Typography>
            {targetUser.createdAt && (
              <Typography level="body-xs" textColor="text.tertiary">
                Joined {targetUser.createdAt}
              </Typography>
            )}
          </Box>
          {targetUser.id !== currentUser.id && (
            <Box sx={{ ml: "auto" }}>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleImpersonate}
              >
                Impersonate
              </Button>
            </Box>
          )}
        </Stack>
      </Card>

      {/* Roles section */}
      <Card variant="outlined">
        <Typography level="title-lg" sx={{ mb: 2 }}>
          Roles
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {targetUser.roles.map((role) => (
            <Chip
              key={role}
              variant="soft"
              endDecorator={
                <Button
                  size="sm"
                  variant="plain"
                  color="danger"
                  sx={{ minWidth: 0, px: 0.5 }}
                  onClick={() => handleRemoveRole(role)}
                >
                  x
                </Button>
              }
            >
              <RoleBadge role={role} />
            </Chip>
          ))}
          {targetUser.roles.length === 0 && (
            <Typography level="body-sm" textColor="text.tertiary">
              No roles assigned.
            </Typography>
          )}
        </Stack>

        {availableRoles.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Select
                placeholder="Select role..."
                value={selectedRole}
                onChange={(_e, value) => setSelectedRole(value)}
                sx={{ minWidth: 200 }}
              >
                {availableRoles.map((role) => (
                  <Option key={role} value={role}>
                    {role}
                  </Option>
                ))}
              </Select>
              <Button
                onClick={handleAddRole}
                disabled={!selectedRole}
                size="sm"
              >
                Add Role
              </Button>
            </Stack>
          </>
        )}
      </Card>
    </Box>
  );
}

