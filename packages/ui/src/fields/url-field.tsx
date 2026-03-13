import type { UrlFieldProps } from "../types.js";

/**
 * Read-only display component that renders a URL as an external link.
 *
 * Opens in a new tab with `rel="noopener noreferrer"` and appends an arrow
 * indicator. When `truncate` is enabled, displays only the hostname and path
 * instead of the full URL. Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link UrlFieldProps}.
 * @returns An `<a>` element with `target="_blank"`, or a placeholder `<span>` for null values.
 *
 * @example
 * ```tsx
 * <UrlField value="https://example.com/blog/post-1" truncate />
 * // -> "example.com/blog/post-1 (arrow icon)"
 * ```
 */
export function UrlField({ value, truncate }: UrlFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  let display = value;
  if (truncate) {
    try {
      const url = new URL(value);
      display = url.hostname + (url.pathname !== "/" ? url.pathname : "");
    } catch {
      // Not a valid URL, show as-is
    }
  }

  return (
    <a href={value} target="_blank" rel="noopener noreferrer">
      {display}
      {" \u2197"}
    </a>
  );
}
