import { type ReactElement } from "react";
import Typography from "@mui/joy/Typography";
import Breadcrumbs from "@mui/joy/Breadcrumbs";
import { Link } from "react-router";
import Stack from "@mui/joy/Stack";
import type { BreadcrumbItem, TabItem } from "../types.js";
import type { ReactNode } from "react";

export type PageContainerProps = {
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
  tabs?: TabItem[];
  children: ReactNode;
};

/**
 * Joy UI PageContainer — title + breadcrumb + action toolbar.
 */
export function PageContainer({
  title,
  breadcrumb,
  actions,
  tabs: _tabs,
  children,
}: PageContainerProps): ReactElement {
  return (
    <div style={{ padding: "16px 24px" }}>
      {breadcrumb && breadcrumb.length > 0
        ? (
            <Breadcrumbs size="sm" sx={{ mb: 1, p: 0 }}>
              {breadcrumb.map((item, i) =>
                item.to
                  ? <Link key={i} to={item.to} style={{ textDecoration: "none", color: "inherit" }}>{item.label}</Link>
                  : <Typography key={i} fontSize="sm">{item.label}</Typography>,
              )}
            </Breadcrumbs>
          )
        : null}
      {title || actions
        ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              {title ? <Typography level="h2">{title}</Typography> : null}
              {actions ? <>{actions}</> : null}
            </Stack>
          )
        : null}
      {children}
    </div>
  );
}
