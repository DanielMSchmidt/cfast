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
 * Page wrapper providing a title, breadcrumb trail, tab navigation, and an action toolbar.
 *
 * Renders via the UI plugin's `pageContainer` and `breadcrumb` slots. Used internally
 * by {@link ListView} and {@link DetailView}, but also useful as a standalone page shell
 * for custom pages.
 *
 * @param props - See {@link PageContainerProps}.
 *
 * @example
 * ```tsx
 * <PageContainer
 *   title="Edit Post"
 *   breadcrumb={[
 *     { label: "Posts", to: "/posts" },
 *     { label: post.title },
 *   ]}
 *   actions={<ActionButton action={deletePost} input={{ postId }} />}
 * >
 *   {/* page content *​/}
 * </PageContainer>
 * ```
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
