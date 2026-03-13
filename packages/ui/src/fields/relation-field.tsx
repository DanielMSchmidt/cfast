import type { RelationFieldProps } from "../types.js";
import { getField } from "../record-access.js";

/**
 * Read-only display component for related record references.
 *
 * Extracts the display property (defaults to `"name"`) from the related record
 * object and renders it as plain text or a link. When `linkTo` is provided,
 * the `:id` placeholder is replaced with the record's `id` to form the href.
 * Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link RelationFieldProps}.
 * @returns An `<a>` element if `linkTo` is set and the record has an `id`,
 *   a plain `<span>` otherwise, or a placeholder for null values.
 *
 * @example
 * ```tsx
 * <RelationField value={post.author} display="name" linkTo="/users/:id" />
 * // -> <a href="/users/abc123">Jane Doe</a>
 * ```
 */
export function RelationField({
  value,
  display = "name",
  linkTo,
}: RelationFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  if (typeof value !== "object" || value === null) {
    return <span>{String(value)}</span>;
  }

  const displayValue = String(getField(value, display) ?? getField(value, "id") ?? value);
  const rawId = getField(value, "id");
  const id = typeof rawId === "string" ? rawId : undefined;

  if (linkTo && id) {
    const href = linkTo.replace(":id", id);
    return <a href={href}>{displayValue}</a>;
  }

  return <span>{displayValue}</span>;
}
