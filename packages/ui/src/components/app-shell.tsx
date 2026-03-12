import { useComponent } from "../plugin.js";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { AppShellProps, NavigationItem } from "../types.js";
import type { ReactNode } from "react";

/**
 * AppShell provides a sidebar + header + content layout.
 */
export function AppShell({ children, sidebar, header }: AppShellProps) {
  const Shell = useComponent("appShell");
  return <Shell sidebar={sidebar} header={header}>{children}</Shell>;
}

/**
 * Sidebar component that filters navigation items based on permissions.
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
 * Header slot for AppShell.
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
