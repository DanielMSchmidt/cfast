import type { UrlFieldProps } from "../types.js";

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
