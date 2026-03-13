import type { DateFieldProps } from "../types.js";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");

  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");

  return rtf.format(Math.round(diffDay / 365), "year");
}

function formatDate(date: Date, format: DateFieldProps["format"], locale: string): string {
  switch (format) {
    case "relative":
      return getRelativeTime(date);
    case "long":
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
      }).format(date);
    case "datetime":
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    case "short":
    default:
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(date);
  }
}

/**
 * Read-only display component that formats date values.
 *
 * Accepts `Date` objects, ISO strings, or Unix timestamps. Renders a `<time>`
 * element with the formatted date and a machine-readable `datetime` attribute.
 * Returns an em-dash for null/undefined values and "Invalid date" for unparseable input.
 *
 * @param props - See {@link DateFieldProps}.
 * @returns A `<time>` element with the formatted date, or a placeholder `<span>`.
 *
 * @example
 * ```tsx
 * <DateField value={post.createdAt} format="relative" />
 * // -> "3 days ago"
 *
 * <DateField value="2026-03-11" format="short" locale="en" />
 * // -> "Mar 11, 2026"
 * ```
 */
export function DateField({
  value,
  format = "short",
  locale = "en",
}: DateFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  const date = value instanceof Date
    ? value
    : typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return <span>Invalid date</span>;
  }

  return <time dateTime={date.toISOString()}>{formatDate(date, format, locale)}</time>;
}
