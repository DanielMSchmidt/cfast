import type { NumberFieldProps } from "../types.js";

/**
 * Read-only display component that formats numeric values.
 *
 * Uses `Intl.NumberFormat` for locale-aware formatting. Supports currency
 * display and decimal precision control. Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link NumberFieldProps}.
 * @returns A `<span>` with the formatted number, or a placeholder for null values.
 *
 * @example
 * ```tsx
 * <NumberField value={1234.5} locale="en" />
 * // -> "1,234.5"
 *
 * <NumberField value={29.99} currency="USD" />
 * // -> "$29.99"
 * ```
 */
export function NumberField({
  value,
  locale = "en",
  currency,
  decimals,
}: NumberFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) {
    return <span>—</span>;
  }

  const options: Intl.NumberFormatOptions = {};
  if (currency) {
    options.style = "currency";
    options.currency = currency;
  }
  if (decimals !== undefined) {
    options.minimumFractionDigits = decimals;
    options.maximumFractionDigits = decimals;
  }

  const formatted = new Intl.NumberFormat(locale, options).format(num);
  return <span>{formatted}</span>;
}
