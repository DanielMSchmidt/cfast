import { createElement, Fragment } from "react";
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

  return createElement(Fragment, null,
    breadcrumb && breadcrumb.length > 0
      ? createElement(Breadcrumb, { items: breadcrumb })
      : null,
    createElement(PageContainerSlot, { title, actions, children }),
  );
}
