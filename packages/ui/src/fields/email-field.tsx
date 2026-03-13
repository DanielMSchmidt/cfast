import type { EmailFieldProps } from "../types.js";

/**
 * Read-only display component that renders an email address as a clickable `mailto:` link.
 *
 * Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link EmailFieldProps}.
 * @returns An `<a>` element with a `mailto:` href, or a placeholder `<span>` for null values.
 *
 * @example
 * ```tsx
 * <EmailField value={user.email} />
 * // -> <a href="mailto:user@example.com">user@example.com</a>
 * ```
 */
export function EmailField({ value }: EmailFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  const email = String(value);
  return <a href={`mailto:${email}`}>{email}</a>;
}
