import type { TextFieldProps } from "../types.js";

/**
 * Read-only display component for plain text values.
 *
 * Optionally truncates long strings at `maxLength` characters with an ellipsis
 * and shows the full text in a `title` tooltip on hover. Returns an em-dash
 * for null/undefined values.
 *
 * @param props - See {@link TextFieldProps}.
 * @returns A `<span>` with the text content, or a placeholder for null values.
 *
 * @example
 * ```tsx
 * <TextField value={post.title} maxLength={50} />
 * // -> Truncated with tooltip if longer than 50 characters
 * ```
 */
export function TextField({
  value,
  maxLength,
}: TextFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  const text = String(value);
  const display = maxLength && text.length > maxLength
    ? `${text.slice(0, maxLength)}…`
    : text;

  if (maxLength && text.length > maxLength) {
    return <span title={text}>{display}</span>;
  }

  return <span>{display}</span>;
}
