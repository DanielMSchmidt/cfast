"use client";

import { type ReactElement } from "react";
import { Link, useSearchParams } from "react-router";
import Sheet from "@mui/joy/Sheet";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/joy/Divider";
import { buildAdminUrl } from "../utils.js";

type SidebarProps = {
  tables: Array<{ name: string; label: string }>;
};

export function Sidebar({ tables }: SidebarProps): ReactElement {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view");

  return (
    <Sheet
      sx={{
        width: 240,
        minHeight: "100vh",
        borderRight: "1px solid",
        borderColor: "divider",
        p: 2,
      }}
    >
      <Typography level="h4" sx={{ mb: 2 }}>
        Admin
      </Typography>

      <List size="sm">
        <ListItem>
          <ListItemButton
            selected={currentView === null}
            component={Link}
            to={buildAdminUrl({ kind: "dashboard" }) || "."}
          >
            Dashboard
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        {tables.map((table) => (
          <ListItem key={table.name}>
            <ListItemButton
              selected={currentView === table.name}
              component={Link}
              to={buildAdminUrl({
                kind: "list",
                table: table.name,
                page: 1,
                sort: null,
                direction: "desc",
                search: "",
              })}
            >
              {table.label}
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemButton
            selected={currentView === "_users"}
            component={Link}
            to={buildAdminUrl({ kind: "user-list", page: 1, search: "" })}
          >
            Users
          </ListItemButton>
        </ListItem>
      </List>
    </Sheet>
  );
}
