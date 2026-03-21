import { Form } from "react-router";
import type { ComponentProps, ReactNode } from "react";

type ActionFormProps = Omit<ComponentProps<typeof Form>, "children" | "action"> & {
  /** Object with `_action` key and input fields to inject as hidden inputs. */
  action: Record<string, string | number | boolean | null | undefined>;
  children: ReactNode;
};

/**
 * A Form wrapper that auto-injects hidden fields from an action descriptor.
 *
 * Replaces the manual pattern of:
 * ```tsx
 * <Form method="post">
 *   <input type="hidden" name="_action" value="addComment" />
 *   <input type="hidden" name="postId" value={post.id} />
 * </Form>
 * ```
 *
 * With:
 * ```tsx
 * <ActionForm action={{ _action: "addComment", postId: post.id }} method="post">
 *   ...
 * </ActionForm>
 * ```
 */
export function ActionForm({ action, children, ...formProps }: ActionFormProps) {
  return (
    <Form {...formProps}>
      {Object.entries(action).map(([key, value]) =>
        value != null ? (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ) : null,
      )}
      {children}
    </Form>
  );
}
