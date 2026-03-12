import type { EmailFieldProps } from "../types.js";

export function EmailField({ value }: EmailFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  return <a href={`mailto:${value}`}>{value}</a>;
}
