import { type ReactElement, type ComponentType } from "react";
import Avatar from "@mui/joy/Avatar";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuItem from "@mui/joy/MenuItem";
import MenuButton from "@mui/joy/MenuButton";
import IconButton from "@mui/joy/IconButton";
import { Link } from "react-router";

// MUI Joy's polymorphic `component` prop doesn't work with createElement's types.
const AnyMenuItem = MenuItem as ComponentType<Record<string, unknown>>;
import { useCurrentUser } from "@cfast/auth/client";
import { getInitials, useActionStatus } from "@cfast/ui";
import { RoleBadge } from "./role-badge.js";
import type { UserMenuProps, UserMenuLink } from "@cfast/ui";

/**
 * Joy UI UserMenu — Dropdown with Avatar trigger, user info, and links.
 */
export function UserMenu({
  links = [],
  onSignOut,
}: UserMenuProps): ReactElement | null {
  const user = useCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <Dropdown>
      <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: "plain", size: "sm" } }}>
        <Avatar src={user.avatarUrl ?? undefined} size="sm">
          {getInitials(user.name)}
        </Avatar>
      </MenuButton>
      <Menu placement="bottom-end" size="sm">
        <MenuItem disabled>
          <div>
            <strong>{user.name}</strong>
            <br />
            <small>{user.email}</small>
          </div>
        </MenuItem>
        {user.roles.length > 0
          ? (
              <MenuItem disabled>
                <div style={{ display: "flex", gap: "4px" }}>
                  {user.roles.map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              </MenuItem>
            )
          : null}
        {links.map((link) =>
          link.action
            ? <PermissionFilteredLink key={link.to} link={link} />
            : (
                <AnyMenuItem key={link.to} component={Link} to={link.to}>
                  {link.label}
                </AnyMenuItem>
              ),
        )}
        {onSignOut
          ? <MenuItem onClick={onSignOut}>Sign out</MenuItem>
          : null}
      </Menu>
    </Dropdown>
  );
}

function PermissionFilteredLink({ link }: { link: UserMenuLink }): ReactElement | null {
  const status = useActionStatus(link.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return (
    <AnyMenuItem component={Link} to={link.to}>
      {link.label}
    </AnyMenuItem>
  );
}
