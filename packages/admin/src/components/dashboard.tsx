import { type ReactElement } from "react";
import { Link } from "react-router";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import { buildAdminUrl } from "../utils.js";
import type { DashboardStat, RecentItem } from "../types.js";

type DashboardProps = {
  stats: DashboardStat[];
  recentItems: RecentItem[];
};

export function Dashboard({ stats, recentItems }: DashboardProps): ReactElement {
  return (
    <Box>
      <Typography level="h2" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {stats.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 2,
            mb: 4,
          }}
        >
          {stats.map((stat) => (
            <Card key={stat.label} variant="outlined">
              <Typography level="body-sm" textColor="text.secondary">
                {stat.label}
              </Typography>
              <Typography level="h3">{stat.value}</Typography>
            </Card>
          ))}
        </Box>
      )}

      {recentItems.map((section) => (
        <Box key={section.table} sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography level="title-lg">{section.label}</Typography>
            <Typography
              component={Link}
              to={buildAdminUrl({
                kind: "list",
                table: section.table,
                page: 1,
                sort: null,
                direction: "desc",
                search: "",
              })}
              level="body-sm"
            >
              View all
            </Typography>
          </Box>

          <Sheet variant="outlined" sx={{ borderRadius: "sm", overflow: "auto" }}>
            <Table hoverRow>
              <thead>
                <tr>
                  {section.columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, idx) => (
                  <tr key={idx}>
                    {section.columns.map((col) => (
                      <td key={col}>{formatCellValue(item[col])}</td>
                    ))}
                  </tr>
                ))}
                {section.items.length === 0 && (
                  <tr>
                    <td colSpan={section.columns.length}>
                      <Typography level="body-sm" textAlign="center" sx={{ py: 2 }}>
                        No items yet.
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Sheet>
        </Box>
      ))}
    </Box>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
