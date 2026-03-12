import { createElement, Fragment } from "react";
import { useComponent } from "../plugin.js";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { AppShellProps, NavigationItem } from "../types.js";
import type { ReactNode } from "react";

/**
 * AppShell provides a sidebar + header + content layout.
 */
export function AppShell({ children, sidebar, header }: AppShellProps) {
  const Shell = useComponent("appShell");
  return createElement(Shell, { sidebar, header, children });
}

/**
 * Sidebar component that filters navigation items based on permissions.
 */
export function AppShellSidebar({ items }: { items: NavigationItem[] }) {
  return createElement(
    "nav",
    null,
    createElement(
      "ul",
      { style: { listStyle: "none", padding: 0, margin: 0 } },
      ...items.map((item) =>
        createElement(SidebarItem, { key: item.to, item }),
      ),
    ),
  );
}

function SidebarItem({ item }: { item: NavigationItem }) {
  // If item has an action, check permission
  if (item.action) {
    return createElement(PermissionFilteredItem, { item });
  }

  return createElement(
    "li",
    null,
    createElement("a", { href: item.to }, item.label),
  );
}

function PermissionFilteredItem({ item }: { item: NavigationItem }) {
  const status = useActionStatus(item.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return createElement(
    "li",
    null,
    createElement("a", { href: item.to }, item.label),
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
  return createElement(
    "header",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: "1px solid #ddd",
      },
    },
    children ?? createElement(Fragment, null),
    userMenu ?? null,
  );
}

// Attach sub-components
AppShell.Sidebar = AppShellSidebar;
AppShell.Header = AppShellHeader;
