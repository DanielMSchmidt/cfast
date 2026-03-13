import type { RelationFieldProps } from "../types.js";

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

  const record = value as Record<string, unknown>;
  const displayValue = String(record[display] ?? record.id ?? value);
  const id = record.id as string | undefined;

  if (linkTo && id) {
    const href = linkTo.replace(":id", id);
    return <a href={href}>{displayValue}</a>;
  }

  return <span>{displayValue}</span>;
}
