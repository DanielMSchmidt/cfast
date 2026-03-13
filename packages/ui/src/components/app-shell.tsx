import { useComponent } from "../plugin.js";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { AppShellProps, NavigationItem } from "../types.js";
import type { ReactNode } from "react";

/**
 * Base application layout with sidebar navigation, header, and content area.
 *
 * Delegates rendering to the UI plugin's `appShell` slot. Compose with
 * {@link AppShellSidebar} (`AppShell.Sidebar`) and {@link AppShellHeader}
 * (`AppShell.Header`) for a complete layout.
 *
 * @param props - See {@link AppShellProps}.
 *
 * @example
 * ```tsx
 * <AppShell
 *   sidebar={<AppShell.Sidebar items={navigationItems} />}
 *   header={<AppShell.Header userMenu={<UserMenu />} />}
 * >
 *   {children}
 * </AppShell>
 * ```
 */
export function AppShell({ children, sidebar, header }: AppShellProps) {
  const Shell = useComponent("appShell");
  return <Shell sidebar={sidebar} header={header}>{children}</Shell>;
}

/**
 * Sidebar navigation for {@link AppShell} that automatically filters items by permission.
 *
 * Each {@link NavigationItem} can optionally carry an `action` descriptor. Items whose
 * action is invisible or forbidden are hidden from the sidebar automatically.
 *
 * @param props.items - Navigation items to render.
 *
 * @example
 * ```tsx
 * <AppShell.Sidebar items={[
 *   { label: "Posts", to: "/posts", icon: DocumentIcon },
 *   { label: "Users", to: "/users", icon: UsersIcon, action: manageUsers.client },
 * ]} />
 * ```
 */
export function AppShellSidebar({ items }: { items: NavigationItem[] }) {
  return (
    <nav>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} />
        ))}
      </ul>
    </nav>
  );
}

function SidebarItem({ item }: { item: NavigationItem }) {
  // If item has an action, check permission
  if (item.action) {
    return <PermissionFilteredItem item={item} />;
  }

  return (
    <li>
      <a href={item.to}>{item.label}</a>
    </li>
  );
}

function PermissionFilteredItem({ item }: { item: NavigationItem }) {
  const status = useActionStatus(item.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return (
    <li>
      <a href={item.to}>{item.label}</a>
    </li>
  );
}

/**
 * Header bar for {@link AppShell} with flexible content and an optional user menu.
 *
 * Renders a horizontal bar at the top of the shell. Pass a {@link UserMenu}
 * element via the `userMenu` prop for authenticated user controls.
 *
 * @param props.children - Custom header content (logo, search, etc.).
 * @param props.userMenu - User menu element rendered at the far right.
 *
 * @example
 * ```tsx
 * <AppShell.Header userMenu={<UserMenu links={[{ label: "Profile", to: "/profile" }]} />}>
 *   <Logo />
 * </AppShell.Header>
 * ```
 */
export function AppShellHeader({
  children,
  userMenu,
}: {
  children?: ReactNode;
  userMenu?: ReactNode;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: "1px solid #ddd",
      }}
    >
      {children ?? <></>}
      {userMenu ?? null}
    </header>
  );
}

// Attach sub-components
AppShell.Sidebar = AppShellSidebar;
AppShell.Header = AppShellHeader;
