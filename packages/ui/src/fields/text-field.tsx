import type { TextFieldProps } from "../types.js";

export function TextField({
  value,
  maxLength,
}: TextFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  const display = maxLength && value.length > maxLength
    ? `${value.slice(0, maxLength)}…`
    : value;

  if (maxLength && value.length > maxLength) {
    return <span title={value}>{display}</span>;
  }

  return <span>{display}</span>;
}
