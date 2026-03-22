import { type ReactElement, type ComponentType } from "react";
import Sheet from "@mui/joy/Sheet";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import { Link } from "react-router";
import { useActionStatus } from "@cfast/ui";
import type { AppShellProps, NavigationItem } from "@cfast/ui";
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
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {sidebar ?? null}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const }}>
        {header ?? null}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

/**
 * Joy UI Sidebar — Sheet with List navigation items.
 */
export function AppShellSidebar({ items }: { items: NavigationItem[] }): ReactElement {
  return (
    <Sheet
      sx={{
        width: 240,
        borderRight: "1px solid",
        borderColor: "divider",
        p: 2,
      }}
    >
      <List size="sm">
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} />
        ))}
      </List>
    </Sheet>
  );
}

function SidebarItem({ item }: { item: NavigationItem }): ReactElement | null {
  if (item.action) {
    return <PermissionFilteredItem item={item} />;
  }

  return (
    <ListItem>
      <AnyListItemButton component={Link} to={item.to}>
        {item.label}
      </AnyListItemButton>
    </ListItem>
  );
}

function PermissionFilteredItem({ item }: { item: NavigationItem }): ReactElement | null {
  const status = useActionStatus(item.action!);

  if (status.invisible || !status.permitted) {
    return null;
  }

  return (
    <ListItem>
      <AnyListItemButton component={Link} to={item.to}>
        {item.label}
      </AnyListItemButton>
    </ListItem>
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
  return (
    <AnySheet
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {children ?? <></>}
      {userMenu ?? null}
    </AnySheet>
  );
}

AppShell.Sidebar = AppShellSidebar;
AppShell.Header = AppShellHeader;
