import type { DrizzleTable, PermissionAction, Grant, WhereClause } from "./types";

/**
 * Declares that a role can perform an action on a subject, optionally restricted
 * by a row-level `where` clause.
 *
 * Used inside the `grants` map of {@link definePermissions} to build permission rules.
 * A grant without a `where` clause applies to all rows.
 *
 * @param action - The operation being permitted (`"read"`, `"create"`, `"update"`, `"delete"`, or `"manage"` for all four).
 * @param subject - A Drizzle table reference, or `"all"` to apply to every table.
 * @param options - Optional configuration.
 * @param options.where - A Drizzle filter function `(columns, user) => SQL` that restricts which rows this grant covers.
 * @returns A {@link Grant} object for use in a permissions configuration.
 *
 * @example
 * ```typescript
 * import { grant } from "@cfast/permissions";
 * import { eq } from "drizzle-orm";
 * import { posts } from "./schema";
 *
 * // Unrestricted read on all posts
 * grant("read", posts);
 *
 * // Only allow updating own posts
 * grant("update", posts, {
 *   where: (post, user) => eq(post.authorId, user.id),
 * });
 *
 * // Full access to everything
 * grant("manage", "all");
 * ```
 */
export function grant(
  action: PermissionAction,
  subject: DrizzleTable | "all",
  options?: { where?: WhereClause },
): Grant {
  return {
    action,
    subject,
    where: options?.where,
  };
}
