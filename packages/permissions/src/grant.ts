import type {
  Grant,
  PermissionAction,
  SchemaMap,
  SubjectInput,
  WhereClause,
} from "./types";

/**
 * Declares that a role can perform an action on a subject, optionally restricted
 * by a row-level `where` clause.
 *
 * Used inside the `grants` map of {@link definePermissions} to build permission rules.
 * A grant without a `where` clause applies to all rows.
 *
 * Subjects accept three forms (all interchangeable at runtime):
 * - A {@link DrizzleTable} object reference (the original form).
 * - A string table name (e.g. `"projects"`) — when called via the `grant`
 *   callback inside `definePermissions<User, typeof schema>()`, strings are
 *   constrained to known table names by TypeScript.
 * - The literal `"all"` for grants that apply to every table.
 *
 * @param action - The operation being permitted (`"read"`, `"create"`, `"update"`, `"delete"`, or `"manage"` for all four).
 * @param subject - A Drizzle table reference, a string table name, or `"all"` to apply to every table.
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
 * // Object form (always works)
 * grant("read", posts);
 *
 * // String form (works standalone; type-checked when called via the
 * // `grant` callback inside `definePermissions<User, typeof schema>()`)
 * grant("read", "posts");
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
export function grant<TTables extends SchemaMap = SchemaMap>(
  action: PermissionAction,
  subject: SubjectInput<TTables>,
  options?: { where?: WhereClause },
): Grant {
  return {
    action,
    subject,
    where: options?.where,
  };
}
