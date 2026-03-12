import { createElement, Fragment, type ReactElement, type ComponentType } from "react";
import Sheet from "@mui/joy/Sheet";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import { Link } from "react-router";
import { useActionStatus } from "../hooks/use-action-status.js";
import type { AppShellProps, NavigationItem } from "../types.js";
import type { ReactNode } from "react";

// MUI Joy's polymorphic `component` prop doesn't work with createElement's types.
// Cast to ComponentType to work around this — runtime behavior is correct.
const AnyListItemButton = ListItemButton as ComponentType<Record<string, unknown>>;
const AnySheet = Sheet as ComponentType<Record<string, unknown>>;

/**
 * Joy UI AppShell — sidebar + header + content layout.
 */
export function AppShell({
  children,
  sidebar,
  header,
}: AppShellProps): ReactElement {
  return createElement(
    "div",
    { style: { display: "flex", minHeight: "100vh" } },
    sidebar ?? null,
    createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column" as const } },
      header ?? null,
      createElement("main", { style: { flex: 1 } }, children),
    ),
  );
}

/**
 * Joy UI Sidebar — Sheet with List navigation items.
 */
export function AppShellSidebar({ items }: { items: NavigationItem[] }): ReactElement {
  return createElement(
    Sheet,
    {
      sx: {
        width: 240,
        borderRight: "1px solid",
        borderColor: "divider",
        p: 2,
      },
    },
    createElement(
      List,
      { size: "sm" },
      ...items.map((item) =>
        createElement(SidebarItem, { key: item.to, item }),
      ),
    ),
  );
}

function SidebarItem({ item }: { item: NavigationItem }): ReactElement | null {
  if (item.action) {
    return createElement(PermissionFilteredItem, { item });
  }

  return createElement(
    ListItem,
    null,
    createElement(AnyListItemButton, {
      component: Link,
      to: item.to,
      children: item.label,
    }),
  );
}

function PermissionFilteredItem({ item }: { item: NavigationItem }): ReactElement | null {
  const status = useActionStatus(item.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return createElement(
    ListItem,
    null,
    createElement(AnyListItemButton, {
      component: Link,
      to: item.to,
      children: item.label,
    }),
  );
}

/**
 * Joy UI AppShell Header — Sheet with flex layout.
 */
export function AppShellHeader({
  children,
  userMenu,
}: {
  children?: ReactNode;
  userMenu?: ReactNode;
}): ReactElement {
  return createElement(
    AnySheet,
    {
      component: "header",
      sx: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      },
    },
    children ?? createElement(Fragment, null),
    userMenu ?? null,
  );
}

AppShell.Sidebar = AppShellSidebar;
AppShell.Header = AppShellHeader;
