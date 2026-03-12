import { createElement, type ReactElement, type ComponentType } from "react";
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
import { getInitials } from "../components/avatar-with-initials.js";
import { RoleBadge } from "../joy/role-badge.js";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { UserMenuProps, UserMenuLink } from "../types.js";

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

  return createElement(
    Dropdown,
    null,
    createElement(
      MenuButton,
      { slots: { root: IconButton }, slotProps: { root: { variant: "plain", size: "sm" } } },
      createElement(Avatar, {
        src: user.avatarUrl ?? undefined,
        size: "sm",
        children: getInitials(user.name),
      }),
    ),
    createElement(
      Menu,
      { placement: "bottom-end", size: "sm" },
      createElement(MenuItem, { disabled: true },
        createElement("div", null,
          createElement("strong", null, user.name),
          createElement("br"),
          createElement("small", null, user.email),
        ),
      ),
      user.roles.length > 0
        ? createElement(MenuItem, { disabled: true },
            createElement("div", { style: { display: "flex", gap: "4px" } },
              ...user.roles.map((role) =>
                createElement(RoleBadge, { key: role, role }),
              ),
            ),
          )
        : null,
      ...links.map((link) =>
        link.action
          ? createElement(PermissionFilteredLink, { key: link.to, link })
          : createElement(AnyMenuItem, {
              key: link.to,
              component: Link,
              to: link.to,
              children: link.label,
            }),
      ),
      onSignOut
        ? createElement(MenuItem, {
            onClick: onSignOut,
            children: "Sign out",
          })
        : null,
    ),
  );
}

function PermissionFilteredLink({ link }: { link: UserMenuLink }): ReactElement | null {
  const status = useActionStatus(link.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return createElement(AnyMenuItem, {
    component: Link,
    to: link.to,
    children: link.label,
  });
}
