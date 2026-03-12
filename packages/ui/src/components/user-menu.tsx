import { createElement } from "react";
import { useCurrentUser } from "@cfast/auth/client";
import { AvatarWithInitials } from "./avatar-with-initials.js";
import { RoleBadge } from "./role-badge.js";
import type { UserMenuProps, UserMenuLink } from "../types.js";
import { useActionStatus } from "../hooks/use-action-status.js";

/**
 * User menu dropdown showing current user info, role badges, and links.
 * Headless implementation with basic HTML.
 */
export function UserMenu({
  links = [],
  onSignOut,
}: UserMenuProps) {
  const user = useCurrentUser();

  if (!user) {
    return null;
  }

  return createElement(
    "div",
    { style: { position: "relative" as const } },
    createElement(AvatarWithInitials, {
      src: user.avatarUrl,
      name: user.name,
      size: "sm",
    }),
    createElement(
      "div",
      { className: "user-menu-dropdown" },
      createElement("div", null,
        createElement("strong", null, user.name),
        createElement("br"),
        createElement("small", null, user.email),
      ),
      user.roles.length > 0
        ? createElement(
            "div",
            { style: { display: "flex", gap: "4px", marginTop: "4px" } },
            ...user.roles.map((role) =>
              createElement(RoleBadge, { key: role, role }),
            ),
          )
        : null,
      ...links.map((link) =>
        link.action
          ? createElement(PermissionFilteredLink, { key: link.to, link })
          : createElement("a", { key: link.to, href: link.to }, link.label),
      ),
      onSignOut
        ? createElement(
            "button",
            { onClick: onSignOut, style: { border: "none", background: "none", cursor: "pointer", padding: "4px 0" } },
            "Sign out",
          )
        : null,
    ),
  );
}

function PermissionFilteredLink({ link }: { link: UserMenuLink }) {
  const status = useActionStatus(link.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return createElement("a", { href: link.to }, link.label);
}
