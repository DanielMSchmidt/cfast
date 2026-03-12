import { useComponent } from "../plugin.js";
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
 * Page wrapper with title, breadcrumb, tabs, and action toolbar.
 */
export function PageContainer({
  title,
  breadcrumb,
  actions,
  tabs: _tabs,
  children,
}: PageContainerProps) {
  const PageContainerSlot = useComponent("pageContainer");
  const Breadcrumb = useComponent("breadcrumb");

  return (
    <>
      {breadcrumb && breadcrumb.length > 0
        ? <Breadcrumb items={breadcrumb} />
        : null}
      <PageContainerSlot title={title} actions={actions}>{children}</PageContainerSlot>
    </>
  );
}
