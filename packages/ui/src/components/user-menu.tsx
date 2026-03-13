import { useCurrentUser } from "@cfast/auth/client";
import { AvatarWithInitials } from "./avatar-with-initials.js";
import { RoleBadge } from "./role-badge.js";
import type { UserMenuProps, UserMenuLink } from "../types.js";
import { useActionStatus } from "../hooks/use-action-status.js";

/**
 * Header dropdown showing the current user's avatar, name, email, role badges, and navigation links.
 *
 * Reads the authenticated user via `useCurrentUser()` from `@cfast/auth`. Renders
 * an {@link AvatarWithInitials} trigger and a dropdown with user info, {@link RoleBadge}
 * chips, permission-filtered navigation links, and an optional sign-out button.
 * Returns `null` when no user is authenticated.
 *
 * @param props - See {@link UserMenuProps}.
 *
 * @example
 * ```tsx
 * <UserMenu
 *   links={[
 *     { label: "Profile", to: "/profile" },
 *     { label: "Admin", to: "/admin", action: adminAccess.client },
 *   ]}
 *   onSignOut={() => signOut()}
 * />
 * ```
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
