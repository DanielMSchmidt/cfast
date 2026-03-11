import { createElement } from "react";
import type { NumberFieldProps } from "../types.js";

export function NumberField({
  value,
  locale = "en",
  currency,
  decimals,
}: NumberFieldProps) {
  if (value == null) {
    return createElement("span", null, "—");
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

  const formatted = new Intl.NumberFormat(locale, options).format(value);
  return createElement("span", null, formatted);
}
