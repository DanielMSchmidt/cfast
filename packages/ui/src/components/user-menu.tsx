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

  return (
    <div style={{ position: "relative" as const }}>
      <AvatarWithInitials
        src={user.avatarUrl}
        name={user.name}
        size="sm"
      />
      <div className="user-menu-dropdown">
        <div>
          <strong>{user.name}</strong>
          <br />
          <small>{user.email}</small>
        </div>
        {user.roles.length > 0
          ? (
              <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                {user.roles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            )
          : null}
        {links.map((link) =>
          link.action
            ? <PermissionFilteredLink key={link.to} link={link} />
            : <a key={link.to} href={link.to}>{link.label}</a>,
        )}
        {onSignOut
          ? (
              <button
                onClick={onSignOut}
                style={{ border: "none", background: "none", cursor: "pointer", padding: "4px 0" }}
              >
                Sign out
              </button>
            )
          : null}
      </div>
    </div>
  );
}

function PermissionFilteredLink({ link }: { link: UserMenuLink }) {
  const status = useActionStatus(link.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return <a href={link.to}>{link.label}</a>;
}
